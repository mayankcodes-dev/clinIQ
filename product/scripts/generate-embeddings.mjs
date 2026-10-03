#!/usr/bin/env node
// scripts/generate-embeddings.mjs
//
// Pre-generates vector embeddings for the ClinIQ knowledge base.
// Run this ONCE locally before deploying to Cloudflare Pages.
// The output file (src/lib/rag/embeddings-cache.json) must be committed to git.
//
// Usage:
//   GEMINI_API_KEY=your_key node scripts/generate-embeddings.mjs
//
// The generated JSON is bundled by esbuild at build time, so the Cloudflare Worker
// doesn't need filesystem access to load it — it's embedded in the Worker bundle.

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set. Run: GEMINI_API_KEY=your_key node scripts/generate-embeddings.mjs");
  process.exit(1);
}

const OUTPUT_PATH = join(__dirname, "../src/lib/rag/embeddings-cache.json");
const RATE_LIMIT_MS = 1200; // Gemini free tier: ~60 req/min

async function embedText(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embed error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.embedding.values;
}

async function main() {
  // Dynamic import of knowledge base (ES module)
  const { KNOWLEDGE_BASE } = await import("../src/lib/rag/knowledge-base.js").catch(() => {
    // TypeScript not compiled yet — use ts-node or compile first
    console.error("❌ Cannot import knowledge-base.js — run `npm run build` first, then run this script again.");
    console.error("   OR run: npx tsx scripts/generate-embeddings.mjs");
    process.exit(1);
  });

  console.log(`📚 Embedding ${KNOWLEDGE_BASE.length} knowledge entries...`);
  const embedded = [];

  for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
    const entry = KNOWLEDGE_BASE[i];
    const text = `${entry.title}\n\n${entry.content}\n\nTags: ${entry.tags.join(", ")}`;

    process.stdout.write(`  [${i + 1}/${KNOWLEDGE_BASE.length}] ${entry.title.slice(0, 50)}...`);

    try {
      const embedding = await embedText(text);
      embedded.push({
        id: entry.id,
        domain: entry.domain,
        symptomSystem: entry.symptomSystem,
        title: entry.title,
        tags: entry.tags,
        source: entry.source,
        embeddedText: text,
        embedding,
      });
      process.stdout.write(" ✅\n");
    } catch (err) {
      process.stdout.write(` ❌ (${err.message.slice(0, 80)})\n`);
      // Use zero vector as placeholder
      embedded.push({
        id: entry.id,
        domain: entry.domain,
        symptomSystem: entry.symptomSystem,
        title: entry.title,
        tags: entry.tags,
        source: entry.source,
        embeddedText: text,
        embedding: new Array(768).fill(0),
      });
    }

    // Rate limit
    if (i < KNOWLEDGE_BASE.length - 1) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(embedded, null, 2));
  console.log(`\n✅ Wrote ${embedded.length} embeddings to ${OUTPUT_PATH}`);
  console.log("   Now commit this file and redeploy to Cloudflare Pages.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
