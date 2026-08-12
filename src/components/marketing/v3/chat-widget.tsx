"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SHOW_CHAT } from "@/lib/chat/config";

/**
 * The chat box: an assistant, and a real person behind it.
 *
 * Three states, and the middle one is the whole design problem.
 *
 *   BOT      talking to the assistant, which answers from a closed brief (see
 *            lib/chat/knowledge.ts) and refuses anything outside it.
 *   WAITING  the visitor has asked for a person and is in the queue. This is
 *            where a live chat is won or lost: the widget shows their place in
 *            the queue, keeps their typing enabled so whoever picks up arrives
 *            with context, and — if nobody is actually at the console — says
 *            so immediately rather than letting them wait on nobody.
 *   LIVE     a member of staff is in the conversation. The assistant goes
 *            silent; the server enforces that too, so a stale tab cannot put
 *            words in while a real person is typing.
 *
 * Updates arrive by polling (3s) rather than a socket. The reasoning is in
 * api/chat/poll/route.ts — short version: no websocket server in a Next route
 * handler, and no pub/sub in this stack for SSE to ride on.
 *
 * State survives navigation via sessionStorage, because every marketing page
 * mounts its own copy of this component and a live chat that died when someone
 * clicked through to the maths page would be worse than no chat at all.
 */

const STORE_KEY = "bp-chat";

/** Matches the poll cost noted in api/chat/poll/route.ts. */
const POLL_MS = 3_000;

type Role = "user" | "assistant" | "staff";
type Msg = { role: Role; content: string };
type Mode = "BOT" | "WAITING" | "LIVE" | "ENDED";

type Stored = { conversationId?: string; messages: Msg[]; mode?: Mode };

const GREETING =
  "Hello — ask me about our tutors, courses or the SHSAT and SAT. For anything I don't know, or to book, press “Talk to a person” and someone here will join.";

function load(): Stored {
  if (typeof window === "undefined") return { messages: [] };
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    if (!raw) return { messages: [] };
    const parsed = JSON.parse(raw) as Stored;
    return {
      conversationId: parsed.conversationId,
      messages: parsed.messages ?? [],
      mode: parsed.mode,
    };
  } catch {
    return { messages: [] };
  }
}

function save(state: Stored) {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing, or storage full. The conversation just will not
    // survive the next page; nothing else depends on this.
  }
}

/** Server roles are shouty; the UI's are not. */
function toRole(role: string): Role {
  if (role === "STAFF") return "staff";
  if (role === "ASSISTANT") return "assistant";
  return "user";
}

export function ChatWidget({
  /**
   * Move the widget in from the right edge on sm and up.
   *
   * The subject pages carry a section-nav rail pinned to the middle of the
   * right edge, and an open panel in the corner covers it completely — which on
   * a page whose only navigation is that rail means opening the chat traps you.
   * The rail is `sm:flex`, so below sm there is nothing to clear and the widget
   * stays in the corner where it belongs.
   */
  railInset = false,
}: {
  railInset?: boolean;
} = {}) {
  const [open, setOpen] = useState(false);
  // Hooks run unconditionally — the early return for SHOW_CHAT lives below the
  // whole hook list, because bailing out up here would change the hook count
  // between renders the moment the flag is flipped.
  const [mode, setMode] = useState<Mode>("BOT");
  /** True only while the "who are you" form is up. */
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [staffName, setStaffName] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [staffOnline, setStaffOnline] = useState(true);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hydrated = useRef(false);
  const polling = useRef(false);

  /**
   * Rehydrate on first open rather than on mount. Reading sessionStorage in a
   * useState initialiser would make the first client render disagree with the
   * server's, and doing it in an effect is a setState cascade on every page —
   * whereas nothing in storage is needed until someone opens the box.
   */
  const openPanel = useCallback(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      const stored = load();
      if (stored.messages.length > 0) setMessages(stored.messages);
      if (stored.conversationId) setConversationId(stored.conversationId);
      if (stored.mode) setMode(stored.mode);
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (messages.length > 0 || conversationId) {
      save({ conversationId, messages, mode });
    }
  }, [messages, conversationId, mode]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, asking, open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && !asking) inputRef.current?.focus();
  }, [open, asking]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * The live half: once a person has been asked for, this is what actually
   * moves the conversation. Runs whether or not the panel is open, so a visitor
   * who closed the box while queuing still sees the reply when they reopen it.
   */
  useEffect(() => {
    if (!conversationId) return;
    if (mode !== "WAITING" && mode !== "LIVE") return;

    let cancelled = false;

    const tick = async () => {
      if (polling.current) return;
      polling.current = true;
      try {
        const res = await fetch("/api/chat/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          gone?: boolean;
          mode?: Mode;
          staffName?: string | null;
          staffOnline?: boolean;
          queuePosition?: number | null;
          messages?: { id: string; role: string; content: string }[];
        };
        if (cancelled) return;

        if (data.gone) {
          // The conversation no longer exists server-side. Drop back to the
          // assistant rather than polling a ghost for ever.
          setMode("BOT");
          setConversationId(undefined);
          return;
        }

        if (data.mode) setMode(data.mode);
        setStaffName(data.staffName ?? null);
        setQueuePosition(data.queuePosition ?? null);
        if (typeof data.staffOnline === "boolean") {
          setStaffOnline(data.staffOnline);
        }
        if (data.messages) {
          // The server transcript is authoritative — it is the only copy that
          // has the staff replies in it.
          setMessages(
            data.messages.map((m) => ({
              role: toRole(m.role),
              content: m.content,
            }))
          );
        }
      } catch {
        // A dropped poll is not worth surfacing; the next one is 3s away.
      } finally {
        polling.current = false;
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [conversationId, mode]);

  /** Send to the assistant. Only reachable in BOT mode. */
  const sendToBot = useCallback(
    async (text: string) => {
      const history = messages;
      setMessages([...history, { role: "user", content: text }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            messages: history.filter((m) => m.role !== "staff"),
            message: text,
            path: window.location.pathname,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as {
            message?: string;
            mode?: Mode;
          } | null;
          // A person joined between this tab rendering and the message being
          // sent. Catch up instead of showing an error.
          if (res.status === 409 && data?.mode) {
            setMode(data.mode);
            return;
          }
          setError(
            data?.message ??
              "The assistant isn't reachable. Try “Talk to a person”."
          );
          return;
        }

        const id = res.headers.get("X-Conversation-Id");
        if (id) setConversationId(id);

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const chunk = await reader.read();
          done = chunk.done;
          if (chunk.value) {
            const piece = decoder.decode(chunk.value, { stream: true });
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = {
                  role: "assistant",
                  content: last.content + piece,
                };
              }
              return next;
            });
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError("Something went wrong. Try “Talk to a person”.");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, conversationId]
  );

  /** Send to whoever picked up. Optimistic — the poll will confirm it. */
  const sendToPerson = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      try {
        const res = await fetch("/api/chat/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "say", conversationId, message: text }),
        });
        if (!res.ok) setError("That didn't send. Try again.");
      } catch {
        setError("That didn't send. Check your connection.");
      }
    },
    [conversationId]
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");
    if (mode === "BOT") void sendToBot(text);
    else void sendToPerson(text);
  }, [input, streaming, mode, sendToBot, sendToPerson]);

  /** Join the queue. */
  const requestPerson = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (sending) return;
      setError(null);
      setSending(true);
      try {
        const res = await fetch("/api/chat/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "request",
            conversationId,
            ...form,
            path: window.location.pathname,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          message?: string;
          conversationId?: string;
          staffOnline?: boolean;
        } | null;
        if (!res.ok) {
          setError(data?.message ?? "We couldn't send that. Please try again.");
          return;
        }
        if (data?.conversationId) setConversationId(data.conversationId);
        if (typeof data?.staffOnline === "boolean") {
          setStaffOnline(data.staffOnline);
        }
        setMessages((prev) => [
          ...prev,
          { role: "user", content: form.message },
        ]);
        setMode("WAITING");
        setAsking(false);
      } catch {
        setError("We couldn't send that. Check your connection and try again.");
      } finally {
        setSending(false);
      }
    },
    [sending, form, conversationId]
  );

  const endChat = useCallback(async () => {
    if (!conversationId) return;
    await fetch("/api/chat/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", conversationId }),
    }).catch(() => undefined);
    setMode("ENDED");
  }, [conversationId]);

  // Every hook above has run. See lib/chat/config.ts for what has to be true
  // in production before this is switched on.
  if (!SHOW_CHAT) return null;

  const live = mode === "LIVE";
  const waiting = mode === "WAITING";

  const heading = asking
    ? "Talk to a person"
    : live
      ? (staffName ?? "A tutor")
      : waiting
        ? "Finding someone"
        : mode === "ENDED"
          ? "Chat ended"
          : "Ask a question";

  return (
    <>
      {/* ── Launcher ── */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-expanded={open}
        aria-controls="bp-chat-panel"
        className={`fixed right-3 bottom-6 z-50 inline-flex items-center gap-3 rounded-full px-7 py-4 font-mono text-[0.72rem] tracking-[0.16em] uppercase shadow-[0_16px_40px_-16px_rgba(0,0,0,0.65)] transition-transform duration-300 hover:scale-[1.04] motion-reduce:transform-none sm:bottom-9 ${
          railInset ? "sm:right-[11rem]" : "sm:right-4"
        }`}
        style={{ backgroundColor: "var(--v3-accent)", color: "var(--v3-paper)" }}
      >
        {open ? "Close" : "Ask us a question"}
        <span aria-hidden>{open ? "↓" : "→"}</span>
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          id="bp-chat-panel"
          role="dialog"
          aria-label="Chat with Borough Prep"
          // Bottom offsets clear the launcher, which is taller than it looks
          // once the uppercase mono label is on it — keep them ahead of the
          // launcher's own bottom offset plus its height.
          className={`fixed right-3 bottom-24 z-50 flex h-[min(32rem,calc(100dvh-11rem))] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[0.8rem] border border-current/15 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)] sm:bottom-28 ${
            railInset ? "sm:right-[11rem]" : "sm:right-4"
          }`}
          style={{
            backgroundColor: "var(--v3-paper)",
            color: "var(--v3-ink)",
          }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-current/12 px-4 py-3">
            <div className="min-w-0">
              <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase opacity-55">
                {live ? "Live now" : "Borough Prep"}
              </p>
              <p className="mt-0.5 truncate text-[0.85rem]">{heading}</p>
            </div>
            {asking && (
              <button
                type="button"
                onClick={() => {
                  setAsking(false);
                  setError(null);
                }}
                className="shrink-0 rounded-full border border-current/25 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase transition-colors hover:border-current/60"
              >
                Back
              </button>
            )}
            {(live || waiting) && (
              <button
                type="button"
                onClick={() => void endChat()}
                className="shrink-0 rounded-full border border-current/25 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase transition-colors hover:border-current/60"
              >
                End
              </button>
            )}
          </div>

          {/* Body */}
          {asking ? (
            <form
              onSubmit={requestPerson}
              className="v3-no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              <p className="text-[0.8rem] leading-relaxed opacity-70">
                Someone here will join this chat. We ask for an email in case
                you have to go before we get to you.
              </p>
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
                autoComplete="name"
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
                autoComplete="email"
              />
              <label className="block">
                <span className="font-mono text-[0.5rem] tracking-[0.16em] uppercase opacity-55">
                  What do you need help with?
                </span>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={3}
                  maxLength={2000}
                  className="mt-1.5 w-full resize-none rounded-md border border-current/20 bg-transparent px-3 py-2 text-[0.85rem] outline-none focus:border-current/50"
                />
              </label>
              {error && (
                <p className="text-[0.78rem] leading-relaxed opacity-70">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full px-5 py-3 font-mono text-[0.6rem] tracking-[0.16em] uppercase disabled:opacity-60"
                style={{
                  backgroundColor: "var(--v3-accent)",
                  color: "var(--v3-paper)",
                }}
              >
                {sending ? "Connecting…" : "Start chat"}
              </button>
            </form>
          ) : (
            <div
              ref={logRef}
              className="v3-no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {mode === "BOT" && <Bubble role="assistant">{GREETING}</Bubble>}

              {messages.map((m, i) => (
                <Bubble key={i} role={m.role}>
                  {m.content ||
                    (streaming && i === messages.length - 1 ? "…" : "")}
                </Bubble>
              ))}

              {waiting && <WaitingNotice online={staffOnline} position={queuePosition} />}

              {mode === "ENDED" && (
                <p className="py-2 text-center font-mono text-[0.55rem] tracking-[0.16em] uppercase opacity-55">
                  Chat ended
                </p>
              )}

              {error && (
                <p className="text-[0.78rem] leading-relaxed opacity-70">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          {!asking && (
            <div className="shrink-0 border-t border-current/12 px-3 py-3">
              {mode === "ENDED" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("BOT");
                    setError(null);
                  }}
                  className="w-full rounded-full px-4 py-2.5 font-mono text-[0.6rem] tracking-[0.14em] uppercase"
                  style={{
                    backgroundColor: "var(--v3-ink)",
                    color: "var(--v3-paper)",
                  }}
                >
                  Start again
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      maxLength={2000}
                      placeholder={
                        live
                          ? `Message ${staffName ?? "us"}…`
                          : waiting
                            ? "Add anything else…"
                            : "Type a question…"
                      }
                      aria-label="Your message"
                      className="min-w-0 flex-1 rounded-full border border-current/20 bg-transparent px-4 py-2.5 text-[0.85rem] outline-none placeholder:opacity-45 focus:border-current/50"
                    />
                    <button
                      type="button"
                      onClick={send}
                      disabled={streaming || input.trim().length === 0}
                      aria-label="Send"
                      className="shrink-0 rounded-full px-4 py-2.5 font-mono text-[0.6rem] tracking-[0.14em] uppercase disabled:opacity-40"
                      style={{
                        backgroundColor: "var(--v3-ink)",
                        color: "var(--v3-paper)",
                      }}
                    >
                      →
                    </button>
                  </div>

                  {/* Only offered while the assistant has the conversation —
                      once a person is in it, or on the way, offering to fetch
                      one again is nonsense. */}
                  {mode === "BOT" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAsking(true);
                        setError(null);
                      }}
                      className="mt-2.5 w-full rounded-full border border-current/20 px-4 py-2 font-mono text-[0.52rem] tracking-[0.16em] uppercase transition-colors hover:border-current/60"
                    >
                      Talk to a person
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * The queue. Says something different depending on whether anyone is actually
 * at the console, because "someone will be with you shortly" at midnight is the
 * single worst thing this widget could do.
 */
function WaitingNotice({
  online,
  position,
}: {
  online: boolean;
  position: number | null;
}) {
  return (
    <div className="rounded-[0.7rem] border border-dashed border-current/25 px-3.5 py-3">
      {online ? (
        <>
          <p className="font-mono text-[0.52rem] tracking-[0.16em] uppercase opacity-60">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full align-middle" style={{ backgroundColor: "var(--v3-accent)" }} />
            Connecting you
          </p>
          <p className="mt-1.5 text-[0.82rem] leading-relaxed opacity-75">
            {position != null && position > 1
              ? `You're number ${position} in the queue. Keep typing if there's more — whoever picks up will see it.`
              : "Someone is being fetched now. Keep typing if there's more — whoever picks up will see it."}
          </p>
        </>
      ) : (
        <>
          <p className="font-mono text-[0.52rem] tracking-[0.16em] uppercase opacity-60">
            Nobody on right now
          </p>
          <p className="mt-1.5 text-[0.82rem] leading-relaxed opacity-75">
            We&rsquo;ve got your message and your email — someone will reply as
            soon as they&rsquo;re back. You can close this window.
          </p>
        </>
      )}
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const mine = role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className={mine ? "max-w-[85%]" : "max-w-[85%]"}>
        {/* Staff messages are labelled. A visitor needs to be able to tell, at
            a glance, that they are no longer talking to the machine. */}
        {role === "staff" && (
          <p className="mb-1 font-mono text-[0.48rem] tracking-[0.16em] uppercase opacity-55">
            Borough Prep
          </p>
        )}
        <p
          className="rounded-[0.7rem] px-3.5 py-2.5 text-[0.85rem] leading-relaxed whitespace-pre-wrap"
          style={
            mine
              ? { backgroundColor: "var(--v3-ink)", color: "var(--v3-paper)" }
              : role === "staff"
                ? {
                    backgroundColor: "var(--v3-accent)",
                    color: "var(--v3-paper)",
                  }
                : { backgroundColor: "var(--v3-card)" }
          }
        >
          {children}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[0.5rem] tracking-[0.16em] uppercase opacity-55">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        maxLength={200}
        className="mt-1.5 w-full rounded-md border border-current/20 bg-transparent px-3 py-2 text-[0.85rem] outline-none focus:border-current/50"
      />
    </label>
  );
}
