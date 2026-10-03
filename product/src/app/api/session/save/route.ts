// src/app/api/session/save/route.ts
// Saves a complete patient session to Neon DB at the end of the kiosk flow
// Called from summary/page.tsx when patient taps "Submit to Doctor"
// Requires a valid patient session token (issued at OTP verify) in Authorization header.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db, sessions, patients, historyRecords, scannedDocs, consents } from "@/lib/db";

// Inline cuid if package not available
function cuid() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// ── Zod schema — validates shape and bounds on incoming payload ──────────────
const SaveSessionSchema = z.object({
  lang: z.string().max(10).optional(),
  mode: z.string().max(20).optional(),
  patient: z.object({
    name: z.string().max(200).nullish(),
    gender: z.string().max(20).nullish(),
    yearOfBirth: z.string().max(4).nullish(),
    abhaNumber: z.string().max(50).nullish(),
    mobile: z.string().max(15).nullish(),
  }).optional(),
  consent: z.object({
    dataCapture: z.boolean().optional(),
    doctorShare: z.boolean().optional(),
    abhaLink: z.boolean().optional(),
    audioRecording: z.boolean().optional(),
  }).optional(),
  history: z.object({
    messages: z.array(z.any()).max(500).optional(),
    summary: z.record(z.string(), z.any()).nullish(),
  }).optional(),
  docs: z.array(z.record(z.string(), z.any())).max(20).optional(),
});

export async function POST(req: NextRequest) {
  // ── Patient session token auth ─────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const isProduction = process.env.NODE_ENV === "production";

  if (authHeader?.startsWith("Bearer ")) {
    // Verify the token
    const patientToken = authHeader.slice(7);
    const dotIdx = patientToken.lastIndexOf(".");
    if (dotIdx === -1) {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }
    const payloadB64 = patientToken.slice(0, dotIdx);
    const tokenSig = patientToken.slice(dotIdx + 1);
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.APP_SECRET ?? "ClinIQ-dev-otp-salt";
    const payload = Buffer.from(payloadB64, "base64").toString();
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    try {
      if (!crypto.timingSafeEqual(Buffer.from(tokenSig, "hex"), Buffer.from(expectedSig, "hex"))) {
        return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }
  } else if (isProduction) {
    // In production, always require a token
    return NextResponse.json({ error: "Patient session token required" }, { status: 401 });
  } else {
    // Dev: log warning but allow anonymous/guest sessions to save
    console.warn("[session/save] ⚠️  No patient token (dev mode) — allowing anonymous save");
  }

  try {
    // ── Validate request body ────────────────────────────────────────────────
    const rawBody = await req.json();
    const parseResult = SaveSessionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const {
      lang,
      mode,
      patient: patientData,
      consent: consentData,
      history,
      docs,
    } = parseResult.data;

    const sessionId = cuid();
    const patientId = cuid();
    const historyId = cuid();
    const consentId = cuid();

    // 1. Create session
    await db.insert(sessions).values({
      id: sessionId,
      lang: lang ?? "hi",
      mode: mode ?? "combined",
      status: "submitted",
      submittedAt: new Date(),
    });

    // 2. Create patient
    if (patientData) {
      await db.insert(patients).values({
        id: patientId,
        sessionId,
        name: patientData.name ?? null,
        gender: patientData.gender ?? null,
        yearOfBirth: patientData.yearOfBirth ? parseInt(patientData.yearOfBirth) : null,
        abhaNumber: patientData.abhaNumber ?? null,
        mobile: patientData.mobile ?? null,
      });
    }

    // 3. Save history record
    if (history) {
      await db.insert(historyRecords).values({
        id: historyId,
        sessionId,
        messages: history.messages ?? [],
        summary: history.summary ?? null,
        isMock: !history.summary?.chiefComplaint,
      });
    }

    // 4. Save scanned documents (one row per doc)
    if (Array.isArray(docs) && docs.length > 0) {
      await db.insert(scannedDocs).values(
        docs.map((doc: Record<string, unknown>) => ({
          id: cuid(),
          sessionId,
          extracted: doc,
          docType: (doc.docType as string) ?? "other",
          confidence: (doc.confidence as string) ?? "medium",
        }))
      );
    }

    // 5. Save consent
    if (consentData) {
      await db.insert(consents).values({
        id: consentId,
        sessionId,
        dataCapture: consentData.dataCapture ?? false,
        doctorShare: consentData.doctorShare ?? false,
        abhaLink: consentData.abhaLink ?? false,
        audioRecording: consentData.audioRecording ?? false,
      });
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[session/save] error:", msg);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
