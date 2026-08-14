import { describe, expect, it } from "vitest";
import {
  evaluateBookingSession,
  evaluateCheckoutSession,
} from "./stripe-payments";

const base = {
  payment_status: "paid",
  amount_total: 5000,
  metadata: { paymentRequestId: "req_1", clientId: "cl_1" },
};

describe("evaluateCheckoutSession", () => {
  it("records a paid card session with exact decimal conversion", () => {
    const r = evaluateCheckoutSession(base);
    expect(r.record).toBe(true);
    expect(r.amount!.toString()).toBe("50");
    expect(r.paymentRequestId).toBe("req_1");
    expect(r.clientId).toBe("cl_1");
  });

  it("converts odd cent amounts without float drift", () => {
    const r = evaluateCheckoutSession({ ...base, amount_total: 10001 });
    expect(r.amount!.toString()).toBe("100.01");
  });

  it("skips unpaid sessions (ACH still processing)", () => {
    expect(evaluateCheckoutSession({ ...base, payment_status: "unpaid" }).record).toBe(false);
  });

  it("skips sessions without our metadata (not from a payment link)", () => {
    expect(evaluateCheckoutSession({ ...base, metadata: null }).record).toBe(false);
    expect(evaluateCheckoutSession({ ...base, metadata: { clientId: "cl_1" } }).record).toBe(false);
  });

  it("skips zero or missing totals", () => {
    expect(evaluateCheckoutSession({ ...base, amount_total: 0 }).record).toBe(false);
    expect(evaluateCheckoutSession({ ...base, amount_total: null }).record).toBe(false);
  });
});

/**
 * The booking evaluator mirrors the invoice one, case for case. The extra pair
 * at the end is the point of keeping them separate: neither may ever record the
 * other's session, because doing so would file a booking payment against a
 * payment request or vice versa.
 */
describe("evaluateBookingSession", () => {
  const booking = {
    payment_status: "paid",
    amount_total: 90000,
    metadata: { bookingId: "bk_1" },
  };

  it("records a paid booking and converts cents exactly", () => {
    const result = evaluateBookingSession(booking);
    expect(result.record).toBe(true);
    expect(result.bookingId).toBe("bk_1");
    // Six sessions at $150 — no float drift on the way through.
    expect(result.amount?.toString()).toBe("900");
  });

  it("keeps odd cents exact", () => {
    const result = evaluateBookingSession({ ...booking, amount_total: 87533 });
    expect(result.amount?.toString()).toBe("875.33");
  });

  it("skips a session that is not paid yet", () => {
    expect(
      evaluateBookingSession({ ...booking, payment_status: "unpaid" }).record
    ).toBe(false);
  });

  it("skips zero or missing totals", () => {
    expect(evaluateBookingSession({ ...booking, amount_total: 0 }).record).toBe(false);
    expect(evaluateBookingSession({ ...booking, amount_total: null }).record).toBe(false);
  });

  it("skips a session with no bookingId", () => {
    expect(evaluateBookingSession({ ...booking, metadata: null }).record).toBe(false);
    expect(evaluateBookingSession({ ...booking, metadata: {} }).record).toBe(false);
  });

  it("refuses an invoice session, and the invoice evaluator refuses a booking", () => {
    const invoice = { paymentRequestId: "req_1", clientId: "cl_1" };
    expect(evaluateBookingSession({ ...booking, metadata: invoice }).record).toBe(false);
    expect(
      evaluateCheckoutSession({ ...booking, metadata: { bookingId: "bk_1" } }).record
    ).toBe(false);
  });
});
