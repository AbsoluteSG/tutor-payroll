import { describe, expect, it } from "vitest";
import { evaluateCheckoutSession } from "./stripe-payments";

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
