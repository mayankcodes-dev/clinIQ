// src/lib/rag/embedder.ts
// Generates and caches embeddings for the knowledge base using Gemini text-embedding-004.
// Embeddings are cached to src/lib/rag/embeddings-cache.json at build/ingest time.
// At runtime, the cache is loaded once and used for all similarity searches.

import { GoogleGenAI } from "@google/genai";
import type { KnowledgeEntry } from "./knowledge-base";

export interface EmbeddedEntry {
  id: string;
  domain: string;
  symptomSystem: string;
  title: string;
  tags: string[];
  source: string;
  /** The text that was embedded (title + content) */
  embeddedText: string;
  /** 768-dimensional embedding vector from text-embedding-004 */
  embedding: number[];
}

/** Generate a single embedding vector for the given text */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set — cannot generate embeddings");

  // Use REST API directly — more reliable across key formats (AIza..., AQ.Ab8..., etc.)
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent",
    {
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
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Gemini embedding error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { embedding: { values: number[] } };
  const values = data?.embedding?.values;
  if (!values?.length) throw new Error("Gemini embedding returned empty vector");
  return values;
}

/** Build the text to embed for a knowledge entry (title + content for rich retrieval) */
function buildEmbedText(entry: KnowledgeEntry): string {
  return `${entry.title}\n\n${entry.content}\n\nTags: ${entry.tags.join(", ")}`;
}

/** Embed all knowledge entries — called by the /api/rag/ingest route */
export async function embedAllEntries(
  entries: KnowledgeEntry[]
): Promise<EmbeddedEntry[]> {
  const embedded: EmbeddedEntry[] = [];

  for (const entry of entries) {
    const embeddedText = buildEmbedText(entry);
    let embedding: number[];
    try {
      embedding = await embedText(embeddedText);
    } catch (err) {
      console.error(`[RAG] Failed to embed entry "${entry.id}":`, err);
      // Use zero vector as placeholder so the cache is still written
      embedding = new Array(768).fill(0);
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
    // Rate limit: Gemini free tier allows ~60 embeddings/min
    await new Promise((r) => setTimeout(r, 1100));
  }

  return embedded;
}
