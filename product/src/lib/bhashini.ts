// src/lib/bhashini.ts
// Bhashini helpers — all API calls now go through server-side proxies.
// NEXT_PUBLIC_ env vars removed: keys must never appear in the browser bundle.

// ── Check if Bhashini is available (server-side check via proxy) ──
// Always returns true — the server-side proxy handles availability.
export function isBhashiniConfigured(): boolean {
  return true; // server routes handle key checks and 503 if unconfigured
}

// ── ASR: Audio Blob → Transcript string (via server proxy) ────────
// This client-side helper is kept for backwards compat but routes through
// the secure /api/bhashini/asr server route instead of calling Bhashini directly.
export async function bhashiniASR(
  audioBlob: Blob,
  lang: string
): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  const audioBase64 = btoa(binary);

  const res = await fetch("/api/bhashini/asr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioBase64,
      mimeType: audioBlob.type || "audio/webm",
      lang,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) throw new Error(`Bhashini ASR proxy error: ${res.status}`);
  const data = await res.json();
  return (data?.transcript ?? "").trim();
}

// ── Play ArrayBuffer as audio in browser ─────────────────────────
export async function playAudioBuffer(
  buffer: ArrayBuffer,
  onEnd?: () => void
): Promise<void> {
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(buffer);
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.onended = () => {
    audioCtx.close();
    onEnd?.();
  };
  source.start(0);
}
