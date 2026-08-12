"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  claimConversation,
  consoleState,
  endConversation,
  goOffline,
  sendStaffReply,
  type ConsoleState,
} from "@/lib/actions/chat-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Where staff actually answer the chat.
 *
 * Polls `consoleState` on a timer, which also serves as the presence heartbeat
 * — so the marketing site's "someone is available" is literally "this page is
 * open somewhere". See lib/chat/presence.ts.
 *
 * The poll runs faster than the heartbeat needs, because this end of the
 * conversation is the one where latency is felt: the visitor is waiting on a
 * reply and the person typing it should see their message land promptly.
 */

const POLL_MS = 3_000;

function ago(iso: string | null) {
  if (!iso) return "";
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function ChatConsole() {
  const [state, setState] = useState<ConsoleState | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const inFlight = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    // A slow poll must not stack up behind itself — on a bad connection that
    // turns one request every three seconds into a queue that never drains.
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setState(await consoleState());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // The first fetch goes through a timer rather than being called straight
    // from the effect body, so the state it sets lands from outside the render
    // pass instead of cascading out of it.
    const first = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  // Give up presence on the way out, so the site stops offering a live chat
  // as soon as the console closes rather than a window later.
  useEffect(() => {
    const leave = () => {
      void goOffline();
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [state?.active?.messages.length]);

  const act = useCallback(
    async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
      setBusy(true);
      try {
        const result = await fn();
        if (!result.ok && result.message) toast.error(result.message);
        await refresh();
        return result.ok;
      } catch {
        toast.error("That didn't go through. Try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const send = useCallback(async () => {
    const text = reply.trim();
    const id = state?.active?.id;
    if (!text || !id || busy) return;
    setReply("");
    const ok = await act(() => sendStaffReply(id, text));
    // Put it back in the box rather than losing what they typed.
    if (!ok) setReply(text);
  }, [reply, state?.active?.id, busy, act]);

  if (!state) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {failed ? "Can't reach the server." : "Loading…"}
      </p>
    );
  }

  const { waiting, active, othersOnline } = state;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">Live chat</h1>
          <p className="text-sm text-muted-foreground">
            While this page is open you&rsquo;re shown as available on the
            website.
            {othersOnline > 0
              ? ` ${othersOnline} other ${
                  othersOnline === 1 ? "person is" : "people are"
                } on too.`
              : " You're the only one on."}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            failed
              ? "bg-red-500/10 text-red-500"
              : "bg-green-500/10 text-green-500"
          }
        >
          {failed ? "reconnecting" : "online"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* ── Queue ── */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">
              Waiting {waiting.length > 0 && `(${waiting.length})`}
            </CardTitle>
            <CardDescription>
              {waiting.length === 0
                ? "Nobody in the queue."
                : "Longest wait first."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {waiting.map((w) => (
              <div key={w.id} className="rounded-lg border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {w.visitorName ?? "Visitor"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ago(w.waitingSince)}
                  </span>
                </div>
                {w.path && (
                  <p className="text-xs text-muted-foreground">{w.path}</p>
                )}
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {w.preview}
                </p>
                <Button
                  size="sm"
                  className="mt-2.5 w-full"
                  disabled={busy}
                  onClick={() => void act(() => claimConversation(w.id))}
                >
                  {active ? "Answer instead" : "Answer"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Active conversation ── */}
        <Card className="flex min-h-[32rem] flex-col">
          {!active ? (
            <CardContent className="flex flex-1 items-center justify-center">
              <p className="text-center text-sm text-muted-foreground">
                Pick someone up from the queue to start talking.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    {active.visitorName ?? "Visitor"}
                  </CardTitle>
                  <CardDescription>
                    {active.visitorEmail}
                    {active.path ? ` · ${active.path}` : ""}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {active.visitorGone && (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-500"
                    >
                      visitor away
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void act(() => endConversation(active.id))}
                  >
                    End chat
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
                <div
                  ref={logRef}
                  className="flex-1 space-y-2.5 overflow-y-auto pr-1"
                >
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className={
                        m.role === "USER" ? "flex" : "flex justify-end"
                      }
                    >
                      <div className="max-w-[80%]">
                        <p className="text-[0.65rem] text-muted-foreground">
                          {m.role === "USER"
                            ? (active.visitorName ?? "Visitor")
                            : m.role === "ASSISTANT"
                              ? "Assistant"
                              : (m.authorName ?? "You")}
                        </p>
                        <p
                          className={`mt-0.5 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                            m.role === "USER"
                              ? "bg-muted"
                              : m.role === "ASSISTANT"
                                ? "bg-muted/50 text-muted-foreground"
                                : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {m.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex shrink-0 items-end gap-2 border-t pt-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder="Reply… (Enter to send, Shift+Enter for a new line)"
                    aria-label="Your reply"
                    className="min-w-0 flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-ring"
                  />
                  <Button
                    disabled={busy || reply.trim().length === 0}
                    onClick={() => void send()}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
