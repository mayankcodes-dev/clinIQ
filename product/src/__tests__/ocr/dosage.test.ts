import { describe, it, expect } from "vitest";
import { fixOcrDosage } from "@/lib/ocrUtils";

describe("fixOcrDosage (OCR Post-processing)", () => {
  it("replaces capital 'O' and lowercase 'o' after digits with '0'", () => {
    expect(fixOcrDosage("5OOmg")).toBe("500mg");
    expect(fixOcrDosage("10Omg")).toBe("100mg");
    expect(fixOcrDosage("25omg")).toBe("250mg");
    expect(fixOcrDosage("65O mg")).toBe("650 mg");
  });

  it("replaces leading 'O' before digits with '0'", () => {
    expect(fixOcrDosage("O5mg")).toBe("05mg");
    expect(fixOcrDosage("OO5mg")).toBe("005mg");
  });

  it("leaves already correct dosages untouched", () => {
    expect(fixOcrDosage("500mg")).toBe("500mg");
    expect(fixOcrDosage("10mg")).toBe("10mg");
    expect(fixOcrDosage("0.5mg")).toBe("0.5mg");
  });

  it("handles empty or falsy inputs gracefully", () => {
    expect(fixOcrDosage("")).toBe("");
    expect(fixOcrDosage(undefined as unknown as string)).toBeUndefined();
  });
});
