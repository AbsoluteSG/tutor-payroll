import { describe, expect, it } from "vitest";
import {
  moneyString,
  classSubmissionSchema,
  usernameSchema,
  profileSchema,
  scheduleClassSchema,
} from "./schemas";

describe("profileSchema", () => {
  const base = {
    name: "Taylor",
    email: "Taylor@Example.com",
    username: "taylor",
    currentPassword: "secret123",
    newPassword: "",
  };

  it("accepts a valid profile and lowercases email", () => {
    const parsed = profileSchema.parse(base);
    expect(parsed.email).toBe("taylor@example.com");
  });

  it("allows blank username and blank new password", () => {
    expect(profileSchema.safeParse({ ...base, username: "", newPassword: "" }).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(profileSchema.safeParse({ ...base, currentPassword: "" }).success).toBe(false);
  });

  it("rejects a too-short new password but allows a valid one", () => {
    expect(profileSchema.safeParse({ ...base, newPassword: "short" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, newPassword: "longenough1" }).success).toBe(true);
  });
});

describe("scheduleClassSchema", () => {
  const base = {
    tutorId: "t1",
    clientId: "c1",
    studentName: "Emma",
    scheduledAt: "2026-08-01T14:30",
    durationMinutes: "60",
  };

  it("accepts a valid schedule and coerces duration", () => {
    expect(scheduleClassSchema.parse(base).durationMinutes).toBe(60);
  });

  it("rejects a missing tutor, bad datetime, or out-of-range duration", () => {
    expect(scheduleClassSchema.safeParse({ ...base, tutorId: "" }).success).toBe(false);
    expect(scheduleClassSchema.safeParse({ ...base, scheduledAt: "not-a-date" }).success).toBe(false);
    expect(scheduleClassSchema.safeParse({ ...base, durationMinutes: "3" }).success).toBe(false);
  });
});

describe("usernameSchema", () => {
  it("accepts valid usernames and lowercases them", () => {
    expect(usernameSchema.parse("Taylor_1")).toBe("taylor_1");
    expect(usernameSchema.parse("abc")).toBe("abc");
    expect(usernameSchema.parse("first.last-2")).toBe("first.last-2");
  });

  it("rejects emails, short names, and bad characters", () => {
    expect(usernameSchema.safeParse("a@b.com").success).toBe(false);
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse(".starts-with-dot").success).toBe(false);
    expect(usernameSchema.safeParse("has space").success).toBe(false);
  });
});

describe("moneyString", () => {
  it("accepts whole and 2-decimal amounts", () => {
    expect(moneyString.safeParse("45").success).toBe(true);
    expect(moneyString.safeParse("45.5").success).toBe(true);
    expect(moneyString.safeParse("45.50").success).toBe(true);
  });

  it("rejects zero, negatives, and junk", () => {
    expect(moneyString.safeParse("0").success).toBe(false);
    expect(moneyString.safeParse("0.00").success).toBe(false);
    expect(moneyString.safeParse("-5").success).toBe(false);
    expect(moneyString.safeParse("45.555").success).toBe(false);
    expect(moneyString.safeParse("abc").success).toBe(false);
    expect(moneyString.safeParse("1e5").success).toBe(false);
  });
});

describe("classSubmissionSchema", () => {
  const valid = {
    clientId: "c1",
    studentName: "Emma",
    date: "2026-07-23",
    durationMinutes: "60",
    fullCost: "60",
  };

  it("accepts a valid submission", () => {
    expect(classSubmissionSchema.safeParse(valid).success).toBe(true);
  });

  it("coerces duration to a number", () => {
    const parsed = classSubmissionSchema.parse(valid);
    expect(parsed.durationMinutes).toBe(60);
  });

  it("rejects out-of-range durations and bad dates", () => {
    expect(classSubmissionSchema.safeParse({ ...valid, durationMinutes: "0" }).success).toBe(false);
    expect(classSubmissionSchema.safeParse({ ...valid, durationMinutes: "700" }).success).toBe(false);
    expect(classSubmissionSchema.safeParse({ ...valid, date: "07/23/2026" }).success).toBe(false);
    expect(classSubmissionSchema.safeParse({ ...valid, studentName: "" }).success).toBe(false);
  });
});
