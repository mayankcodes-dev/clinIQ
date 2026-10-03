// scripts/generate-embeddings.ts
// Run with: npx tsx scripts/generate-embeddings.ts
// Reads GEMINI_API_KEY from .env.local automatically via dotenv
//
// Uses the Gemini REST API directly (same as the curl command) — no SDK needed.
// This is more reliable across API key formats (AIza..., AQ.Ab8..., etc.)

import { config } from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";
import { KNOWLEDGE_BASE } from "../src/lib/rag/knowledge-base";
import type { EmbeddedEntry } from "../src/lib/rag/embedder";

// Load .env.local
config({ path: join(__dirname, "../.env.local") });

const OUTPUT_PATH = join(__dirname, "../src/lib/rag/embeddings-cache.json");
const RATE_LIMIT_MS = 1200; // Gemini free tier: ~60 req/min

// ── REST API embed (same pattern as the curl command) ─────────────
async function embedText(text: string, apiKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: "models/gemini-embedding-2",
      content: { parts: [{ text }] },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Gemini embed ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { embedding: { values: number[] } };
  const values = data?.embedding?.values;
  if (!values?.length) throw new Error("Empty embedding returned");
  return values;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) {
    console.error("❌  GEMINI_API_KEY not set — check .env.local");
    process.exit(1);
  }

  console.log(`\n🧠  ClinIQ RAG — Generating Embeddings`);
  console.log(`📚  Knowledge base: ${KNOWLEDGE_BASE.length} entries`);
  console.log(`📡  Model: gemini-embedding-2 (3072 dimensions)`);
  console.log(`⏱   Estimated time: ~${Math.ceil((KNOWLEDGE_BASE.length * 1.2) / 60)} min\n`);

  const embedded: EmbeddedEntry[] = [];
  let errors = 0;

  for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
    const entry = KNOWLEDGE_BASE[i];
    const embeddedText = `${entry.title}\n\n${entry.content}\n\nTags: ${entry.tags.join(", ")}`;
    const label = `[${String(i + 1).padStart(3, " ")}/${KNOWLEDGE_BASE.length}] ${entry.title.slice(0, 50)}`;

    process.stdout.write(`  ${label}...`);

    let embedding: number[];
    try {
      embedding = await embedText(embeddedText, apiKey);
      process.stdout.write(" ✅\n");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(` ❌ ${msg.slice(0, 80)}\n`);
      embedding = new Array(768).fill(0); // zero-vector placeholder
      errors++;
    }

    embedded.push({
      id: entry.id,
      domain: entry.domain,
      symptomSystem: entry.symptomSystem,
      title: entry.title,
      tags: entry.tags,
      source: entry.source,
      embeddedText,
      embedding,
    });

    // Rate limit — skip delay after last entry
    if (i < KNOWLEDGE_BASE.length - 1) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(embedded, null, 2));

  console.log(`\n${"─".repeat(60)}`);
  console.log(`✅  Wrote ${embedded.length} embeddings → src/lib/rag/embeddings-cache.json`);
  if (errors > 0) {
    console.log(`⚠️   ${errors} entries used zero-vector (API error — check key)`);
  }
  console.log(`\n📋  Next steps:`);
  console.log(`    git add src/lib/rag/embeddings-cache.json`);
  console.log(`    git commit -m "feat(rag): pre-generate embeddings"`);
  console.log(`    git push   →  Cloudflare will bundle it on next deploy`);
  console.log(`${"─".repeat(60)}\n`);
}

main().catch(err => {
  console.error("\n❌  Fatal:", err.message ?? err);
  process.exit(1);
});
