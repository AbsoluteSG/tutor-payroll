"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * "Ask us to call you" — the marketing site's lead form.
 *
 * Replaces a `mailto:` as the primary action. A mailto only works if the
 * visitor has a mail client configured and actually presses send in it; this
 * writes a row whatever their machine is set up to do, and it lands in
 * /admin/enquiries.
 *
 * The mailto stays as the secondary route rather than being deleted — some
 * people would simply rather write an email, and it costs one line to keep.
 */

const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";
const ACCENT = "var(--v3-accent)";

export type EnquiryContext = {
  /** Prefills the subject line, e.g. "Mathematics" or "SHSAT". */
  subject?: string;
  /** User.slug of a specific tutor, when asked for from their profile. */
  tutorSlug?: string;
  /** Shown above the form, so the visitor knows what they are replying to. */
  intro?: string;
};

export function EnquiryForm({
  trigger,
  context,
  fontClass,
}: {
  /** The button that opens it — supplied so each surface keeps its own styling. */
  trigger: React.ReactNode;
  context?: EnquiryContext;
  /**
   * The editorial font variable. The dialog is portalled to the body, which is
   * outside the page's font scope — see tutor-directory.tsx, which has the
   * same problem for the same reason.
   */
  fontClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredTimes: "",
    message: "",
  });

  const honeypot = useRef<HTMLInputElement>(null);

  // Reset a sent form when the dialog is reopened, so a second enquiry does not
  // start on the thank-you screen.
  useEffect(() => {
    if (!open && sent) {
      const timer = setTimeout(() => {
        setSent(false);
        setForm({ name: "", email: "", phone: "", preferredTimes: "", message: "" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, sent]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (sending) return;
      setError(null);
      setSending(true);
      try {
        const res = await fetch("/api/enquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            company: honeypot.current?.value ?? "",
            path: window.location.pathname,
            subject: context?.subject,
            tutorSlug: context?.tutorSlug,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        if (!res.ok) {
          setError(data?.message ?? "We couldn't send that. Please try again.");
          return;
        }
        setSent(true);
      } catch {
        setError("We couldn't send that. Check your connection and try again.");
      } finally {
        setSending(false);
      }
    },
    [sending, form, context]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />

      <DialogContent
        showCloseButton={false}
        className={`${fontClass ?? ""} v3-no-scrollbar max-h-[88vh] w-full max-w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-[0.8rem] p-0 ring-1 ring-current/15 sm:max-w-lg`}
        style={{ backgroundColor: PAPER, color: INK }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="font-[family-name:var(--font-editorial)] text-[2rem] leading-none font-normal tracking-tight">
                {sent ? "Thank you." : "Ask us to call you"}
              </DialogTitle>
              <DialogDescription className="mt-2 font-mono text-[0.52rem] tracking-[0.16em] uppercase opacity-70">
                {context?.subject ?? "Borough Prep"}
              </DialogDescription>
            </div>
            <DialogClose
              aria-label="Close"
              className="-mt-1 -mr-1 shrink-0 rounded-full border border-current/20 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase transition-colors hover:border-current/60"
            >
              Close
            </DialogClose>
          </div>

          {sent ? (
            <p className="mt-6 border-t border-current/12 pt-5 text-[0.92rem] leading-relaxed opacity-80">
              We&rsquo;ve got it. Someone here will get back to you at{" "}
              <span style={{ color: ACCENT }}>{form.email}</span> — usually the
              same day.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 border-t border-current/12 pt-5">
              <p className="text-[0.9rem] leading-relaxed opacity-75">
                {context?.intro ??
                  "Tell us what your student needs and we'll call you back. No obligation, and we won't put you on a mailing list."}
              </p>

              {/* Honeypot. Hidden from people and from screen readers; bots fill
                  it in because they fill in everything. */}
              <div aria-hidden className="hidden">
                <label>
                  Company
                  <input
                    ref={honeypot}
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Your name"
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
                <Field
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  autoComplete="tel"
                />
                <Field
                  label="Best time to call"
                  value={form.preferredTimes}
                  onChange={(v) => setForm({ ...form, preferredTimes: v })}
                  placeholder="e.g. weekday evenings"
                />
              </div>

              <label className="mt-3 block">
                <span className="font-mono text-[0.5rem] tracking-[0.16em] uppercase opacity-55">
                  What do you need help with?
                </span>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  className="mt-1.5 w-full resize-none rounded-md border border-current/20 bg-transparent px-3 py-2 text-[0.88rem] outline-none focus:border-current/50"
                />
              </label>

              {error && (
                <p className="mt-3 text-[0.8rem] leading-relaxed opacity-70">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-5 w-full rounded-full px-5 py-3 font-mono text-[0.62rem] tracking-[0.16em] uppercase disabled:opacity-60"
                style={{ backgroundColor: ACCENT, color: PAPER }}
              >
                {sending ? "Sending…" : "Send"}
              </button>

              <p className="mt-3 text-center font-mono text-[0.5rem] tracking-[0.14em] uppercase opacity-45">
                Or email hello@boroughprep.com
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
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
        placeholder={placeholder}
        maxLength={200}
        className="mt-1.5 w-full rounded-md border border-current/20 bg-transparent px-3 py-2 text-[0.88rem] outline-none placeholder:opacity-40 focus:border-current/50"
      />
    </label>
  );
}
