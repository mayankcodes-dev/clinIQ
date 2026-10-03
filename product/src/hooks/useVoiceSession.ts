"use client";

// src/hooks/useVoiceSession.ts
// 3-layer voice pipeline:
//   Layer 1: ElevenLabs Multilingual v2 (primary TTS) + Bhashini ASR — via server proxy
//   Layer 2: Browser Web Speech API (Chrome) — fallback (10/13 languages)
//   Layer 3: Silent mode — touch-only when both unavailable
//
// All API keys are server-side. No NEXT_PUBLIC_ credentials in the browser bundle.

import { useState, useRef, useCallback, useEffect } from "react";
import {
  isBhashiniConfigured,
  bhashiniASR,
} from "@/lib/bhashini";

export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export type VoiceEngine = "bhashini" | "webspeech" | "none";

interface UseVoiceSessionOptions {
  lang: string;
  onTranscript: (text: string) => void;
  onError?: (msg: string) => void;
}

// ── Browser Web Speech API — supported languages in Chrome ───────
// ✅ = full support  ⚠️ = partial  ❌ = not supported
const WEB_SPEECH_LANGS: Record<string, { bcp47: string; supported: boolean }> = {
  hi: { bcp47: "hi-IN", supported: true },   // ✅ Hindi
  en: { bcp47: "en-IN", supported: true },   // ✅ English (India)
  bn: { bcp47: "bn-IN", supported: true },   // ✅ Bengali
  ta: { bcp47: "ta-IN", supported: true },   // ✅ Tamil
  te: { bcp47: "te-IN", supported: true },   // ✅ Telugu
  mr: { bcp47: "mr-IN", supported: true },   // ✅ Marathi
  gu: { bcp47: "gu-IN", supported: true },   // ✅ Gujarati
  kn: { bcp47: "kn-IN", supported: true },   // ✅ Kannada
  ml: { bcp47: "ml-IN", supported: true },   // ✅ Malayalam
  pa: { bcp47: "pa-IN", supported: true },   // ✅ Punjabi
  ur: { bcp47: "ur-PK", supported: false },  // ❌ Urdu (not in Chrome)
  or: { bcp47: "or-IN", supported: false },  // ❌ Odia (not in Chrome)
  as: { bcp47: "as-IN", supported: false },  // ❌ Assamese (not in Chrome)
};

// ── MediaRecorder for Bhashini (captures raw audio) ──────────────
// Tries MIME types in order of quality/compat. Falls back to browser default.
class BhashiniRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  static getBestMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    }
    return ""; // browser default
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = BhashiniRecorder.getBestMimeType();
    this.mediaRecorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined
    );
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(250); // collect every 250ms
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        this.releaseStream();
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }
      const mimeType = this.mediaRecorder.mimeType || "audio/webm";
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mimeType });
        this.releaseStream();
        resolve(blob);
      };
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      } else {
        this.releaseStream();
        resolve(new Blob(this.chunks, { type: mimeType }));
      }
    });
  }

  /** Release all mic tracks so the browser mic indicator turns off */
  private releaseStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

export function useVoiceSession({
  lang,
  onTranscript,
  onError,
}: UseVoiceSessionOptions) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [engine, setEngine] = useState<VoiceEngine>("none");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recorderRef = useRef<BhashiniRecorder | null>(null);
  // Track the live AudioContext so speak() can kill it on every new call
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const webSpeechInfo = WEB_SPEECH_LANGS[lang] ?? { bcp47: "hi-IN", supported: false };

  // ── Determine active engine on mount / lang change ────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;

    // Always use Bhashini engine — TTS and ASR are routed through server-side
    // proxies (/api/bhashini/tts and /api/bhashini/asr) which hold the API keys.
    // No need for NEXT_PUBLIC_ env vars to be set on the client.
    setEngine("bhashini");

    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, [lang, webSpeechInfo.supported]);

  /** Stop and close any AudioContext that is currently playing */
  const killActiveAudio = useCallback(() => {
    try { audioSourceRef.current?.stop(); } catch { /* already stopped */ }
    audioSourceRef.current = null;
    try { audioCtxRef.current?.close(); } catch { /* already closed */ }
    audioCtxRef.current = null;
  }, []);

  // ────────────────────────────────────────────────────────────────
  // SPEAK — ElevenLabs/Bhashini TTS primary, SpeechSynthesis fallback
  //
  // KEY BEHAVIOUR: every call to speak() IMMEDIATELY kills any audio
  // still playing from the previous question. Old audio can never bleed
  // into a new question — the transition is instant and clean.
  // ────────────────────────────────────────────────────────────────
  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      if (!text) { onEnd?.(); return; }

      // Kill whatever is playing from the previous question instantly
      synthRef.current?.cancel();
      killActiveAudio();
      setState("speaking");
      setIsSpeaking(true);

      // ── Server-side TTS (ElevenLabs primary → Bhashini fallback) ─
      if (engine === "bhashini") {
        try {
          const res = await fetch("/api/bhashini/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lang, gender: "female" }),
            signal: AbortSignal.timeout(12_000),
          });
          if (res.ok) {
            const { audioBase64 } = await res.json();
            if (audioBase64) {
              const binaryStr = atob(audioBase64);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

              // Create a cancellable AudioContext — stored in ref for killActiveAudio()
              const audioCtx = new AudioContext();
              audioCtxRef.current = audioCtx;
              let decoded: AudioBuffer;
              try {
                decoded = await audioCtx.decodeAudioData(bytes.buffer);
              } catch {
                audioCtx.close().catch(() => {});
                if (audioCtxRef.current === audioCtx) audioCtxRef.current = null;
                throw new Error("Audio decode failed");
              }

              const source = audioCtx.createBufferSource();
              audioSourceRef.current = source;
              source.buffer = decoded;
              source.connect(audioCtx.destination);
              source.onended = () => {
                // Guard: only fire onEnd if we are still the active source.
                // If killActiveAudio() ran first, audioSourceRef.current is null.
                if (audioSourceRef.current === source) {
                  audioSourceRef.current = null;
                  audioCtxRef.current = null;
                  setIsSpeaking(false);
                  setState("idle");
                  onEnd?.();
                }
                audioCtx.close().catch(() => {});
              };
              source.start(0);
              return;
            }
          }
        } catch (e) {
          console.warn("[Voice] TTS server proxy failed, falling back to Web Speech:", e);
          killActiveAudio();
        }
      }

      // ── Web Speech Synthesis fallback ────────────────────────────
      if (!synthRef.current) { setIsSpeaking(false); setState("idle"); onEnd?.(); return; }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = webSpeechInfo.bcp47;
      utter.rate = 0.88;
      utter.pitch = 1.0;
      const voices = synthRef.current.getVoices();
      const match = voices.find((v) => v.lang.startsWith(lang) || v.lang === webSpeechInfo.bcp47);
      if (match) utter.voice = match;
      utter.onend = () => { setIsSpeaking(false); setState("idle"); onEnd?.(); };
      utter.onerror = () => { setIsSpeaking(false); setState("idle"); onEnd?.(); };
      synthRef.current.speak(utter);
    },
    [engine, lang, webSpeechInfo.bcp47, killActiveAudio]
  );

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    killActiveAudio();
    setIsSpeaking(false);
    setState("idle");
  }, [killActiveAudio]);

  // ────────────────────────────────────────────────────────────────
  // START LISTENING — Bhashini ASR primary, Web Speech fallback
  // ────────────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    setTranscript("");
    setState("listening");

    // ── Bhashini ASR (MediaRecorder → Dhruva) ───────────────────
    if (engine === "bhashini") {
      try {
        const recorder = new BhashiniRecorder();
        recorderRef.current = recorder;
        await recorder.start();
        return; // stop() called by stopListening()
      } catch (e: unknown) {
        const name = e instanceof Error ? e.name : "";
        const msg  = e instanceof Error ? e.message : String(e);
        if (name === "NotAllowedError" || msg.includes("Permission")) {
          onError?.("🔒 Microphone permission denied. Tap the 🔒 in the address bar → allow microphone.");
          setState("error");
          return;
        }
        if (name === "NotFoundError" || msg.includes("audio-capture") || msg.includes("could not start audio")) {
          onError?.("🎤 No microphone found. Please connect a mic, or use touch/type input below.");
          setState("error");
          return;
        }
        if (name === "NotReadableError") {
          onError?.("🎤 Microphone is busy (used by another app). Close other apps and try again.");
          setState("error");
          return;
        }
        console.warn("[Voice] Bhashini recorder failed, falling back to Web Speech:", e);
        // fall through to Web Speech API
      }
    }

    // ── Web Speech API fallback ──────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type SpeechRecognitionCtor = new () => any;
    const SpeechRecognitionAPI: SpeechRecognitionCtor | undefined =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI || !webSpeechInfo.supported) {
      onError?.(
        lang === "ur"
          ? "Urdu voice not supported in browser. Bhashini key needed. Use touch input."
          : lang === "or"
          ? "Odia voice not supported in browser. Bhashini key needed. Use touch input."
          : lang === "as"
          ? "Assamese voice not supported in browser. Bhashini key needed. Use touch input."
          : "Voice recognition not supported. Use Chrome or touch input."
      );
      setState("error");
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = webSpeechInfo.bcp47;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      const shown = final || interim;
      setTranscript(shown);
      if (final) { onTranscript(final.trim()); setState("processing"); }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "no-speech") { setState("idle"); return; }
      if (e.error === "audio-capture") {
        onError?.(
          "🎤 Microphone not available. Please allow mic access in browser settings, or use touch/type input below."
        );
        setState("error");
        return;
      }
      if (e.error === "not-allowed") {
        onError?.(
          "🔒 Microphone permission denied. Tap the 🔒 icon in the browser address bar → allow microphone."
        );
        setState("error");
        return;
      }
      if (e.error === "network") {
        onError?.("माइक नहीं चला / Mic unavailable for this language. Please type your answer.");
        setState("error");
        return;
      }
      onError?.(`Mic error: ${e.error}`);
      setState("error");
    };

    recognition.onend = () => { if (state === "listening") setState("idle"); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [engine, lang, webSpeechInfo, onError, onTranscript, state]);

  // ── Stop listening (Bhashini: stop recorder → POST to server proxy) ─────
  const stopListening = useCallback(async () => {
    // Bhashini: stop MediaRecorder → POST audio to server-side ASR route
    if (engine === "bhashini" && recorderRef.current) {
      setState("processing");
      try {
        const blob = await recorderRef.current.stop();
        recorderRef.current = null;

        // Convert blob → base64 for server proxy
        const arrayBuffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const audioBase64 = btoa(binary);

        const res = await fetch("/api/bhashini/asr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64, mimeType: blob.type || "audio/webm", lang }),
          signal: AbortSignal.timeout(12_000),
        });
        if (res.ok) {
          const { transcript: text } = await res.json();
          if (text) { setTranscript(text); onTranscript(text); }
        } else {
          // Fall back to direct client-side call
          const text = await bhashiniASR(blob, lang);
          if (text) { setTranscript(text); onTranscript(text); }
        }
      } catch (e) {
        console.warn("[Voice] Bhashini ASR failed:", e);
        onError?.("आवाज़ पहचान नहीं हुई। कृपया टाइप करें / Voice recognition failed. Please type.");
      } finally {
        setState("idle");
      }
      return;
    }

    // Web Speech: just stop
    recognitionRef.current?.stop();
    setState("idle");
  }, [engine, lang, onTranscript, onError]);

  return {
    state,
    transcript,
    isSpeaking,
    engine,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    isListening: state === "listening",
    isSupported: engine !== "none",
    webSpeechSupported: webSpeechInfo.supported,
  };
}

// Keep isBhashiniConfigured exported for any legacy imports
export { isBhashiniConfigured };
