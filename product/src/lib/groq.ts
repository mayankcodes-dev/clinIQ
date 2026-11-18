import "server-only";

import Groq from "groq-sdk";

const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;

if (!process.env.GROQ_API_KEY && process.env.GROK_API_KEY) {
  console.warn(
    "GROK_API_KEY is deprecated. Rename it to GROQ_API_KEY before the next deployment."
  );
}

if (!groqApiKey) {
  throw new Error(
    "GROQ_API_KEY is not configured. Set GROQ_API_KEY in the server environment."
  );
}

export const groqClient = new Groq({
  apiKey: groqApiKey,
  timeout: 15_000,
  maxRetries: 2,
});

export const CLINIQ_MODELS = {
  // Groq models active 2026: openai/gpt-oss-120b for high-quality clinical synthesis
  INTERVIEW_FAST: "openai/gpt-oss-120b",
  INSTANT_UTILITY: "openai/gpt-oss-20b",
  SPEECH_TO_TEXT: "whisper-large-v3-turbo",
  // Vision OCR falls through to Gemini; keep for text tasks
  DOCUMENT_VISION: "llama-3.2-11b-vision-preview",
} as const;
