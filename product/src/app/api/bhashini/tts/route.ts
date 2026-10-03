// src/app/api/bhashini/tts/route.ts
// TTS pipeline: ElevenLabs (primary, multilingual v2) → Bhashini Dhruva (fallback)
// POST { text, lang, gender? } -> { audioBase64: string, engine: "elevenlabs"|"bhashini" }

import { NextRequest, NextResponse } from "next/server";

// ── ElevenLabs config ───────────────────────────────────────────────────────
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? "";
// Eleven Multilingual v2 — supports Hindi, Tamil, Telugu, Bengali, Marathi,
// Gujarati, Kannada, Malayalam, Punjabi, Urdu, Odia, Assamese and more.
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "9BWtsMINqrJLrRacOk9x"; // Aria — neutral, clear
const ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

// ── Bhashini config ─────────────────────────────────────────────────────────
const DHRUVA_ENDPOINT =
  process.env.BHASHINI_INFERENCE_URL ??
  "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY ?? "";
const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID ?? "";

// Languages not supported by ElevenLabs multilingual v2 — route straight to Bhashini
const BHASHINI_ONLY_LANGS = new Set(["or", "as", "kok", "sd", "doi", "mai"]);

async function tryElevenLabs(
  text: string,
  lang: string
): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) return null;
  if (BHASHINI_ONLY_LANGS.has(lang)) return null;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: ELEVENLABS_MODEL_ID,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.80,
            speed: 0.95,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[tts] ElevenLabs ${res.status}:`, err.slice(0, 200));
      return null;
    }

    const arrayBuf = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let binary = "";
    // Chunk to avoid stack overflow on large audio
    for (let i = 0; i < bytes.length; i += 4096) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 4096));
    }
    return btoa(binary);
  } catch (e) {
    console.warn("[tts] ElevenLabs error:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function tryBhashini(
  text: string,
  lang: string,
  gender: "male" | "female"
): Promise<string | null> {
  if (!BHASHINI_API_KEY || !BHASHINI_USER_ID) return null;

  try {
    const payload = {
      pipelineTasks: [
        {
          taskType: "tts",
          config: {
            language: { sourceLanguage: lang },
            gender,
            samplingRate: 22050,
          },
        },
      ],
      inputData: {
        input: [{ source: text.trim() }],
        audio: [{ audioContent: null }],
      },
    };

    const res = await fetch(DHRUVA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: BHASHINI_API_KEY,
        ulcaApiKey: BHASHINI_API_KEY,
        userID: BHASHINI_USER_ID,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      console.warn(`[tts] Bhashini ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent ?? null;
  } catch (e) {
    console.warn("[tts] Bhashini error:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, lang = "hi", gender = "female" } = body as {
      text?: string;
      lang?: string;
      gender?: "male" | "female";
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // 1. Try ElevenLabs (high quality multilingual)
    const elAudio = await tryElevenLabs(text, lang);
    if (elAudio) {
      return NextResponse.json({ audioBase64: elAudio, engine: "elevenlabs" });
    }

    // 2. Try Bhashini (Indian language specialist)
    const bhAudio = await tryBhashini(text, lang, gender);
    if (bhAudio) {
      return NextResponse.json({ audioBase64: bhAudio, engine: "bhashini" });
    }

    // 3. Neither available
    const missingKeys = [];
    if (!ELEVENLABS_API_KEY) missingKeys.push("ELEVENLABS_API_KEY");
    if (!BHASHINI_API_KEY) missingKeys.push("BHASHINI_API_KEY");
    return NextResponse.json(
      { error: "No TTS engine available", missing: missingKeys },
      { status: 503 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tts] Unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
