import "server-only";

import Groq from "groq-sdk";

export const CLINIQ_MODELS = {
  // Groq models active 2026: openai/gpt-oss-120b for high-quality clinical synthesis
  INTERVIEW_FAST: "openai/gpt-oss-120b",
  INSTANT_UTILITY: "openai/gpt-oss-20b",
  SPEECH_TO_TEXT: "whisper-large-v3-turbo",
  // Vision OCR falls through to Gemini; keep for text tasks
  DOCUMENT_VISION: "llama-3.2-11b-vision-preview",
} as const;

// Lazy singleton — created on first request, not at module load time.
// This prevents next build from throwing during static page collection
// when GROQ_API_KEY is not set in the build environment.
let _client: Groq | null = null;

export function getGroqClient(): Groq {
  if (_client) return _client;

  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;

  if (process.env.GROQ_API_KEY === undefined && process.env.GROK_API_KEY) {
    console.warn(
      "GROK_API_KEY is deprecated. Rename it to GROQ_API_KEY before the next deployment."
    );
  }

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Set GROQ_API_KEY in the Cloudflare Pages environment variables."
    );
  }

  _client = new Groq({ apiKey, timeout: 15_000, maxRetries: 2 });
  return _client;
}

// Keep groqClient as a convenience re-export for existing callers that
// reference it directly — but make it a getter so it stays lazy.
export const groqClient = {
  get chat() { return getGroqClient().chat; },
  get audio() { return getGroqClient().audio; },
} as unknown as Groq;
