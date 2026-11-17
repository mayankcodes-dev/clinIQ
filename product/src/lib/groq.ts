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
  // llama-3.1-70b-versatile decommissioned Nov 2026 → llama-3.3-70b-specdec
  INTERVIEW_FAST: "llama-3.3-70b-specdec",
  INSTANT_UTILITY: "llama-3.1-8b-instant",
  SPEECH_TO_TEXT: "whisper-large-v3-turbo",
  // Vision OCR falls through to Gemini; keep for text tasks
  DOCUMENT_VISION: "llama-3.2-11b-vision-preview",
} as const;
