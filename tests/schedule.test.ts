/** Unit tests for the callback helpers: phone, email, name, time zones and calling hours. */
import { describe, expect, it } from "vitest";
import { TIME_ZONES, callingDays, cleanText, emailOk, formatPhone, inCallingHours, nameOk, phoneError, safeZone } from "@/lib/schedule";

describe("phone", () => {
  it("accepts 10 digits, or 11 starting with 1", () => {
    expect(phoneError("(212) 555-0142")).toBeNull();
    expect(phoneError("+1 212 555 0142")).toBeNull();
  });
  it("rejects too few or too many digits instead of truncating", () => {
    expect(phoneError("212555014")).toBe("empty");
    expect(phoneError("+44 7911 123456")).toBe("invalid");
    expect(phoneError("+33 6 12 34 56 78")).toBe("invalid");
    expect(phoneError("212-555-01234")).toBe("invalid");
  });
  it("rejects impossible area codes and exchanges", () => {
    expect(phoneError("1125550142")).toBe("invalid");
    expect(phoneError("2120550142")).toBe("invalid");
  });
  it("formats while typing without dropping digits", () => {
    expect(formatPhone("2125550142")).toBe("(212) 555-0142");
    expect(formatPhone("212555014299")).toBe("212555014299");
  });
});

describe("email", () => {
  it("accepts normal addresses and rejects bad ones", () => {
    expect(emailOk("jordan@example.com")).toBe(true);
    expect(emailOk("a@b.co")).toBe(true);
    for (const bad of ["bad", "a@b", "a@.com", "@x.com", "a b@x.com", "‮evil@x.com", "x".repeat(300) + "@x.com"]) expect(emailOk(bad)).toBe(false);
  });
  it("stays fast on hostile input", () => {
    const t = performance.now();
    emailOk("a@" + "a.".repeat(50000) + "@");
    expect(performance.now() - t).toBeLessThan(50);
  });
});

describe("name", () => {
  it("needs two letters, ignoring invisible and control characters", () => {
    expect(nameOk("Jordan Rivera")).toBe(true);
    expect(nameOk("Li")).toBe(true);
    expect(nameOk("​​")).toBe(false);
    expect(nameOk("A")).toBe(false);
    expect(nameOk("12")).toBe(false);
    expect(cleanText("Jo‮rdan\u0000")).toBe("Jordan");
  });
});

describe("time zones and calling hours", () => {
  it("only allows known zones", () => {
    expect(safeZone("America/Denver")).toBe("America/Denver");
    expect(safeZone("Mars/Olympus")).toBe("America/New_York");
    expect(TIME_ZONES.length).toBeGreaterThan(3);
  });
  it("calls only Monday to Saturday, 8 AM to 9 PM in the zone", () => {
    // 2026-11-04 is a Wednesday; 15:00 UTC = 10:00 ET
    expect(inCallingHours(new Date("2026-11-04T15:00:00Z"), "America/New_York")).toBe(true);
    expect(inCallingHours(new Date("2026-11-04T02:30:00Z"), "America/New_York")).toBe(false); // 9:30 PM Tue ET
    expect(inCallingHours(new Date("2026-11-08T17:00:00Z"), "America/New_York")).toBe(false); // Sunday
  });
  it("never offers Sundays or slots outside 8 AM to 9 PM", () => {
    const days = callingDays(new Date("2026-11-04T15:00:00Z"), "America/New_York", "en", 6);
    expect(days.length).toBe(6);
    for (const d of days) {
      expect(new Date(d.key + "T12:00:00Z").getUTCDay()).not.toBe(0);
      for (const s of d.slots) {
        const [h] = s.key.split(":").map(Number);
        expect(h).toBeGreaterThanOrEqual(8);
        expect(h).toBeLessThan(21);
      }
    }
  });
});
