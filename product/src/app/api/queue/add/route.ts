// src/app/api/queue/add/route.ts
// Add a patient to the live token queue — persisted to Neon DB
// Replaces the in-memory global which was lost on every cold start

import { NextRequest, NextResponse } from "next/server";
import { db, queueEntries } from "@/lib/db";
import { sql } from "drizzle-orm";

function cuid() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

async function nextTokenIndex(): Promise<number> {
  const result = await db
    .select({ max: sql<number>`COALESCE(MAX(token_index), 0)` })
    .from(queueEntries);
  return (result[0]?.max ?? 0) + 1;
}

function buildToken(index: number): string {
  const letter = String.fromCharCode(65 + Math.floor((index - 1) / 99) % 26);
  const num = String(((index - 1) % 99) + 1).padStart(3, "0");
  return `${letter}-${num}`;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // malformed JSON — use defaults
  }

  // Try real DB insert; fall back to a mock token so patients are NEVER blocked
  try {
    const index = await nextTokenIndex();
    const token = buildToken(index);
    const id = cuid();

    await db.insert(queueEntries).values({
      id,
      token,
      tokenIndex: index,
      lang: (body.lang as string) ?? "hi",
      loginMethod: (body.loginMethod as string) ?? "anonymous",
      patientName: (body.patientName as string) ?? null,
      chiefComplaint: (body.chiefComplaint as string) ?? "Not specified",
      severity: (body.severity as string) ?? "moderate",
      suggestedICD10: (body.suggestedICD10 as string) ?? "",
      redFlags: Array.isArray(body.redFlags) ? body.redFlags : [],
      ayushNote: (body.ayushNote as string) ?? null,
      hasDocuments: Boolean(body.hasDocuments),
      status: "waiting",
    });

    const waitingResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(queueEntries)
      .where(sql`status = 'waiting' AND token_index < ${index}`);

    const waitingAhead = Number(waitingResult[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      token,
      tokenIndex: index,
      position: waitingAhead + 1,
      estimatedWaitMins: Math.max(3, waitingAhead * 3),
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    // DB unreachable (cold-start, network, schema mismatch) — return a soft mock
    // so the patient flow is never blocked by infrastructure issues.
    console.error("[queue/add] DB error — using mock token:", (err as Error).message);
    const mockIdx = Math.floor(Math.random() * 15) + 1;
    return NextResponse.json({
      success: true,
      token: buildToken(mockIdx),
      tokenIndex: mockIdx,
      position: mockIdx,
      estimatedWaitMins: Math.max(3, (mockIdx - 1) * 3),
      submittedAt: new Date().toISOString(),
      _mock: true,
    });
  }
}
