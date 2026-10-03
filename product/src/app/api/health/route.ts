// src/app/api/health/route.ts
// Health check endpoint — verifies critical service dependencies.
// GET /api/health → { ok: true, services: {...}, ts: number }

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  const services: Record<string, string> = {};

  // Check DB connectivity
  try {
    await db.execute(sql`SELECT 1 AS ping`);
    services.db = "ok";
  } catch (e) {
    services.db = `error: ${e instanceof Error ? e.message.slice(0, 80) : "unknown"}`;
  }

  // Check critical env vars (presence only — not values)
  const requiredEnvs = ["GEMINI_API_KEY", "NEXTAUTH_SECRET", "DOCTOR_PIN"];
  const missingEnvs = requiredEnvs.filter((k) => !process.env[k]);
  services.config = missingEnvs.length === 0 ? "ok" : `missing: ${missingEnvs.join(", ")}`;

  const allOk = Object.values(services).every((v) => v === "ok");
  const latencyMs = Date.now() - start;

  return NextResponse.json(
    { ok: allOk, services, latencyMs, ts: Date.now() },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
