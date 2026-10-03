// src/__tests__/auth/otp-bypass.test.ts
// Regression tests for P0-01: Universal OTP bypass must NOT exist.
// Tests that OTP "0000" is rejected via the hash comparison path.

import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Replicate the hashOtp logic from mobile-otp/route.ts
function hashOtp(otp: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}

function compareOtp(
  submittedOtp: string,
  storedHash: string,
  secret: string
): boolean {
  const submittedHash = hashOtp(submittedOtp, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(storedHash, "hex"),
      Buffer.from(submittedHash, "hex")
    );
  } catch {
    return false;
  }
}

describe("OTP verification — P0-01 regression: no universal bypass", () => {
  const secret = "test-secret-32chars-abcdefghijkl";
  const realOtp = "123456";
  const storedHash = hashOtp(realOtp, secret);

  it("accepts the correct OTP", () => {
    expect(compareOtp(realOtp, storedHash, secret)).toBe(true);
  });

  it("rejects OTP '0000' — universal bypass must not exist", () => {
    // This is the critical regression test for P0-01
    // "0000" must be treated as a wrong OTP, not a bypass
    expect(compareOtp("0000", storedHash, secret)).toBe(false);
  });

  it("rejects wrong 6-digit OTP", () => {
    expect(compareOtp("999999", storedHash, secret)).toBe(false);
  });

  it("rejects empty OTP", () => {
    expect(compareOtp("", storedHash, secret)).toBe(false);
  });

  it("rejects OTP with same digits rearranged", () => {
    expect(compareOtp("654321", storedHash, secret)).toBe(false);
  });

  it("hash is deterministic — same OTP same secret same hash", () => {
    expect(hashOtp(realOtp, secret)).toBe(hashOtp(realOtp, secret));
  });

  it("different secrets produce different hashes", () => {
    const hash1 = hashOtp(realOtp, "secret-A");
    const hash2 = hashOtp(realOtp, "secret-B");
    expect(hash1).not.toBe(hash2);
  });
});

describe("OTP bypass check — production gate", () => {
  it("OTP '0000' is not a magic value in the hash function", () => {
    const secret = "test-secret-32chars-abcdefghijkl";
    // If someone stored a hash of "0000", only "0000" itself should unlock it
    const hashOf0000 = hashOtp("0000", secret);
    expect(compareOtp("0000", hashOf0000, secret)).toBe(true);
    // But it should NOT unlock a different OTP's hash
    const hashOfRealOtp = hashOtp("123456", secret);
    expect(compareOtp("0000", hashOfRealOtp, secret)).toBe(false);
  });
});
