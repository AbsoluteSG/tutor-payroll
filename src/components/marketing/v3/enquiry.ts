/**
 * Enquiry links for the marketing site.
 *
 * Deliberately not a "use client" module: these are called from both the server
 * page (the matching CTA at the foot of Our Tutors) and the client directory
 * (the per-tutor request). A function exported from a client module cannot be
 * *called* by a server component, only rendered or passed as a prop, so the
 * helpers live here where both sides can reach them.
 *
 * Every action on the marketing site composes a prefilled mailto rather than
 * posting anywhere. That keeps the whole site static, but a real endpoint
 * should replace it before this carries any volume — see booking-panel.tsx,
 * which has the same note.
 */

export const ENQUIRY_TO = "hello@boroughprep.com";

function mailto(subject: string, lines: string[]) {
  return `mailto:${ENQUIRY_TO}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(lines.join("\n"))}`;
}

/** "Request this tutor", from a profile. Names the tutor in the subject. */
export function tutorRequestHref(name: string) {
  return mailto(`Tutor request — ${name}`, [
    `I'd like to request a session with ${name}.`,
    "",
    "Student's name:",
    "Grade:",
    "Subject or test:",
    "Availability:",
    "",
  ]);
}

/** "Find my tutor" — the matching enquiry, for a visitor without a preference. */
export function tutorMatchHref() {
  return mailto("Tutor match request", [
    "I'm looking for help with:",
    "",
    "Student's name:",
    "Grade:",
    "Subject or test:",
    "What they're finding difficult:",
    "Availability:",
    "",
  ]);
}
