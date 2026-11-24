// src/app/api/clinic/queue/route.ts
// Server-side persistence for the B2B clinic queue.
// Stores entries in-process (same singleton pattern as queue.ts) for demo;
// swap the Map for Neon/Supabase for production.

import { NextRequest, NextResponse } from "next/server";
import type { ClinicQueueEntry } from "@/lib/clinicQueueStore";

export const runtime = "nodejs";

// --------- In-process store (survives warm restarts) ------------------------------------------------------------------------------------------------
declare global {
  var __clinicQueue: Map<string, ClinicQueueEntry> | undefined;
}

function getStore(): Map<string, ClinicQueueEntry> {
  if (!global.__clinicQueue) global.__clinicQueue = new Map();
  return global.__clinicQueue;
}

// --------- Validation helpers ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

function asStringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function validateEntry(body: Record<string, unknown>): ClinicQueueEntry | null {
  const clinicId = asString(body.clinicId);
  const tokenNumber = typeof body.tokenNumber === "number" ? body.tokenNumber : NaN;
  if (!clinicId || !Number.isFinite(tokenNumber) || tokenNumber < 1) return null;

  return {
    id: asString(body.id) || `${clinicId}::${tokenNumber}`,
    clinicId,
    tokenNumber,
    token: asString(body.token) || `A-${String(tokenNumber).padStart(3, "0")}`,
    patientName: asString(body.patientName, "Patient"),
    patientAge: asString(body.patientAge) || undefined,
    patientGender: asString(body.patientGender) || undefined,
    language: asString(body.language, "hi"),
    chiefComplaint: asString(body.chiefComplaint, "Not specified"),
    redFlags: asStringList(body.redFlags),
    hasRedFlags: Boolean(body.hasRedFlags),
    icd10Suggestions: asStringList(body.icd10Suggestions),
    report: (body.report && typeof body.report === "object")
      ? body.report as ClinicQueueEntry["report"]
      : undefined,
    intakeStartedAt: typeof body.intakeStartedAt === "number" ? body.intakeStartedAt : Date.now(),
    intakeCompletedAt: typeof body.intakeCompletedAt === "number" ? body.intakeCompletedAt : Date.now(),
    avgIntakeMins: typeof body.avgIntakeMins === "number" ? body.avgIntakeMins : 0,
    status: (["waiting", "in_consultation", "done"] as const).includes(
      body.status as ClinicQueueEntry["status"]
    )
      ? (body.status as ClinicQueueEntry["status"])
      : "waiting",
  };
}

// --------- POST: upsert a patient intake entry ------------------------------------------------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > 65_536) {
      return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const entry = validateEntry(body);
    if (!entry) {
      return NextResponse.json({ error: "INVALID_ENTRY" }, { status: 400 });
    }

    getStore().set(entry.id, entry);
    return NextResponse.json({ success: true, id: entry.id });
  } catch (err) {
    console.error("[clinic/queue POST]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

// --------- GET: fetch queue for a clinic ---------------------------------------------------------------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const clinicId = req.nextUrl.searchParams.get("clinicId") ?? "";
  if (!clinicId) {
    return NextResponse.json({ error: "clinicId required" }, { status: 400 });
  }

  const entries = [...getStore().values()]
    .filter((e) => e.clinicId === clinicId)
    .sort((a, b) => {
      // Red-flag entries first, then by token number
      if (a.hasRedFlags !== b.hasRedFlags) return a.hasRedFlags ? -1 : 1;
      return a.tokenNumber - b.tokenNumber;
    });

  const avgIntakeMins =
    entries.length > 0
      ? Math.round((entries.reduce((s, e) => s + e.avgIntakeMins, 0) / entries.length) * 10) / 10
      : 0;

  return NextResponse.json({
    clinicId,
    queue: entries,
    stats: {
      waiting: entries.filter((e) => e.status === "waiting").length,
      inConsultation: entries.filter((e) => e.status === "in_consultation").length,
      done: entries.filter((e) => e.status === "done").length,
      redFlagsDetected: entries.filter((e) => e.hasRedFlags).length,
      avgIntakeMins,
    },
    timestamp: Date.now(),
  });
}

// --------- PATCH: update patient status ---------------------------------------------------------------------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = asString(body.id);
    const status = body.status as ClinicQueueEntry["status"];
    if (!id || !["waiting", "in_consultation", "done"].includes(status)) {
      return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
    }

    const store = getStore();
    const entry = store.get(id);
    if (!entry) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    store.set(id, { ...entry, status });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[clinic/queue PATCH]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
