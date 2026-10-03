// src/app/api/queue/note/route.ts
// PATCH /api/queue/note — Persist doctor annotations for a queue entry.
// Requires doctor session token (same auth as queue/update).
//
// Body: { id: string, note: string }
// Returns: { success: true }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, queueEntries } from "@/lib/db";
import { verifyDoctorToken } from "@/lib/doctorAuth";

const NoteSchema = z.object({
  id:   z.string().min(1).max(100),
  note: z.string().max(5000), // reasonable max for clinical notes
});

export async function PATCH(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────
  const token = req.headers.get("authorization") ?? "";
  if (!verifyDoctorToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = NoteSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, note } = parsed.data;

    const result = await db
      .update(queueEntries)
      .set({ doctorNotes: note, updatedAt: new Date() })
      .where(eq(queueEntries.id, id))
      .returning({ id: queueEntries.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[queue/note] error:", msg);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
