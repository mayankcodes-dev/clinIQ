<div align="center">

<img src="./product/public/cliniq_logo.jpg" alt="ClinIQ Logo" width="140" style="border-radius:16px; margin-bottom:12px" />

# ClinIQ

### AI-Powered Multilingual Clinical History Kiosk

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Groq](https://img.shields.io/badge/Groq-Qwen3_8B-orange)](https://groq.com)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E5BF?logo=postgresql)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> ClinIQ turns a touchscreen tablet at OPD reception into a voice-first AI clinical assistant.  
> Patients answer questions in their own language. The doctor receives a structured, physician-grade  
> History & Physical before the consultation begins.

</div>

---

## What ClinIQ Does

ClinIQ is a **pre-consultation intake platform** deployed as a kiosk at hospital and clinic reception desks. In under 4 minutes, it:

1. Greets the patient in their chosen language (**23 UI languages** — 12 Tier 1 + 11 Tier 2 Indian languages)
2. Conducts a structured clinical interview using voice TTS — no typing required
3. Accepts uploaded prescriptions, lab reports, and discharge summaries via camera OCR
4. Generates a physician-grade **History & Physical (H&P)** document in medical English
5. Pushes to a **live token queue** visible on the doctor dashboard (`/doctor`)
6. Shares the full H&P via **WhatsApp as a PDF** for teleconsultation or mobile review

---

## Features

### 🗣️ Voice-First, 23-Language Interview
- Full intake conducted via text-to-speech across **23 UI languages**:
  - **Tier 1 (12):** Hindi · English · Bengali · Tamil · Telugu · Marathi · Gujarati · Kannada · Malayalam · Punjabi · Odia · Assamese
  - **Tier 2 (11):** Urdu · Sanskrit · Maithili · Nepali · Konkani · Dogri · Manipuri · Bodo · Santali · Kashmiri · Sindhi
- **Voice (ASR + TTS):** Bhashini Dhruva covers all 22 official Indian scheduled languages; ElevenLabs used for first-attempt premium voice (auto-falls back to Bhashini on 402)
- Quick-tap chip answers for semi-literate patients — no typing, no spelling

### 🧠 Adaptive AI Interview Engine
- **`qwen/qwen3.8-27b`** on Groq drives a 14-stage structured clinical interview with automatic fallback to `openai/gpt-oss-20b` on any key/model error
- Qwen3 chain-of-thought `<think>` blocks are **stripped before returning** — patients never see internal reasoning
- Dual Groq key failover (`GROQ_API_KEY` → `GROQ_API_KEY_2`) + Gemini 2.5 Flash as final fallback
- Interview stages: `chief_complaint → hpi → onset_duration → severity_character → associated_symptoms → past_medical_history → medications → allergies → family_disease_history → personal_social_history → review_of_systems → ayush_assessment → red_flag_check → closing`
- **AYUSH mode** extends the interview with Dashavidha Pariksha — Prakriti, Vikriti, Agni, Koshtha, and Ayurvedic parameters
- Questions are dynamically generated from prior answers — not a rigid script
- Deterministic INSTANT fallback questions in 13 languages — kiosk **never shows a blank screen**

### 📄 Physician-Grade H&P Report
- Gemini 2.5 Flash + Groq LLaMA jointly produce a **single-page, Georgia-serif H&P** in professional medical English:
  - `CHIEF COMPLAINT` · `HISTORY OF PRESENT ILLNESS` · `PAST MEDICAL HISTORY`
  - `MEDICATIONS` · `ALLERGIES` · `FAMILY AND SOCIAL HISTORY` · `REVIEW OF SYSTEMS`
  - `🚨 RED FLAGS` (highlighted) · `ASSESSMENT — DIFFERENTIAL CONSIDERATIONS` · `ICD-10 SUGGESTIONS`
- Report is RAG-grounded against **Indian clinical protocol guidelines** (hybrid BM25 + semantic retrieval)
- One-click **Print / Save as PDF**

### 💬 WhatsApp Share
- WhatsApp button on `/patient/complete` triggers a **full PDF print dialog** — patient or staff save the structured H&P as PDF
- On desktop the PDF is generated from the full report HTML; on mobile the Web Share API opens the PDF
- Enables instant teleconsultation referral and mobile review by the doctor

### ❌ Removed Features
| Feature | Reason |
|---------|--------|
| Privacy / गोपनीयता section on summary page | Redundant — consent captured at `/patient/consent` |
| "Encrypted · Shared only with treating doctor" text | Covered by DPDP consent footer |
| Print/Save PDF button on `/report` page | PDF only on `/patient/complete` to avoid confusion |
| Print/Save PDF button on `/patient/summary` page | Single save-point policy |
| "SIH 2026 PS 26047" in report footer | Hackathon reference removed for production |
| "Your Aadhaar is never stored" on consent page | No Aadhaar collected; line was misleading |

### 📸 OCR Document Scan
- Patient uploads previous prescriptions, lab reports, discharge summaries, X-ray findings
- **Gemini Vision** extracts medications, diagnoses, lab values, doctor names, dates
- Extracted data merges into the H&P under `KEY LABORATORY AND DOCUMENT FINDINGS`

### Pipeline
> Items actively scoped but not yet in production:
- **Doctor Queue Dashboard** — Code complete at `/clinic/dashboard` (token queue, PIN-protected, ICD-10 hints, wait time); will be surfaced as a separate clinic-staff interface in the next B2B release
- **Prescription Builder** — Doctor-facing Rx editor with drug search, dosage, frequency, and printable prescription slip
- **Chronic-Care Analytics & ROI Calculator** — Per-clinic metrics: total intakes, follow-up recall rate, avg intake duration; ROI estimator for consultation time saved
- **ABHA Integration** — live ABDM sandbox linking; patient H&P auto-linked to Ayushman Bharat Health Account
- **Nurse Dashboard** — vitals entry (BP, SpO₂, weight, temperature) pre-consultation; merged into H&P
- **Expanded Language Coverage** — currently live across **11 Indian languages** (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, English); next: Odia, Assamese, Maithili

---

## Architecture

```
cliniq/
├── product/                        # Next.js 15 App Router — the kiosk + clinic platform
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout — PWA shell, global font, metadata
│   │   │   ├── loading.tsx         # EKG heartbeat loader (ClinIQLoader)
│   │   │   ├── middleware.ts        # Auth guards: /clinic/* requires doctor PIN JWT
│   │   │   │
│   │   │   ├── patient/            # Patient-facing kiosk flow
│   │   │   │   ├── consent/        # DPDP Act 2023 informed consent gate
│   │   │   │   ├── opd-select/     # OPD department + language selector
│   │   │   │   ├── history/        # AI interview engine (voice + touch chips)
│   │   │   │   ├── scan/           # OCR document upload (Gemini Vision)
│   │   │   │   ├── summary/        # Patient review of captured answers
│   │   │   │   ├── complete/       # Token display + queue confirmation
│   │   │   │   └── [scan, opd]     # QR scan and registration screens
│   │   │   │
│   │   │   ├── report/             # H&P report page (WhatsApp share + Print)
│   │   │   │
│   │   │   ├── clinic/
│   │   │   │   └── dashboard/      # Doctor queue dashboard (live tokens, Rx builder)
│   │   │   │
│   │   │   └── api/
│   │   │       ├── interview/      # LLM interview question generation (Groq + flight-shield)
│   │   │       ├── report/         # H&P generation (Groq + Gemini + RAG + flight-shield)
│   │   │       ├── queue/add/      # Patient token creation → Neon Postgres
│   │   │       ├── clinic/queue/   # Doctor queue READ endpoint
│   │   │       ├── bhashini/tts/   # Bhashini / ElevenLabs TTS proxy
│   │   │       ├── scan/extract/   # Gemini Vision OCR extraction
│   │   │       └── auth/           # Doctor PIN auth (HMAC-SHA256 session tokens)
│   │   │
│   │   ├── lib/
│   │   │   ├── singleflight.ts     # flight-shield wrapper (request deduplication)
│   │   │   ├── sessionStore.ts     # Client-side session state (sessionStorage, normalized)
│   │   │   ├── groq.ts             # Groq client + model registry (LLaMA 3.1 70B / 3.2 11B Vision)
│   │   │   ├── buildSummary.ts     # Deterministic fallback summary builder (no LLM needed)
│   │   │   ├── ocrUtils.ts         # OCR extraction helpers + document normalization
│   │   │   ├── clinicQueueStore.ts # B2B queue publish (REST → /api/queue/add)
│   │   │   ├── clinicAnalytics.ts  # Chronic-care ROI calculator + per-clinic metrics
│   │   │   ├── sessionStore.ts     # Typed patient session manager (read/write/migrate)
│   │   │   ├── translations.ts     # 11-language UI string table
│   │   │   ├── constants.ts        # Shared clinical constants (OPD types, languages)
│   │   │   ├── resilientFetch.ts   # Retry + timeout wrapper for all external API calls
│   │   │   │
│   │   │   ├── rag/
│   │   │   │   ├── clinicalRetriever.ts    # Hybrid BM25 + cosine-similarity retriever
│   │   │   │   ├── localClinicalKnowledge.ts # Indian clinical protocol knowledge base
│   │   │   │   └── embedder.ts             # Text embedding pipeline (cached JSON)
│   │   │   │
│   │   │   └── db/
│   │   │       ├── index.ts        # Neon HTTP + Drizzle ORM client (lazy init, edge-safe)
│   │   │       └── schema.ts       # Drizzle schema: sessions, patients, queue_entries
│   │   │
│   │   ├── components/
│   │   │   ├── kiosk/              # KioskLayout, KioskHeader, KioskFooter, AudioWave
│   │   │   ├── clinic/             # PrescriptionBuilder, PrintablePrescription, queue cards
│   │   │   ├── interview/          # InterQuestionLoader (between-question animation)
│   │   │   ├── ui/                 # Primitives: Button, Card, Input (Tailwind 4 + CVA)
│   │   │   └── ClinIQLoader.tsx    # EKG heartbeat SVG loader
│   │   │
│   │   └── __tests__/
│   │       ├── summary/            # buildSummary unit tests
│   │       ├── queue/              # Clinic queue logic tests
│   │       ├── ocr/                # OCR dosage extraction tests
│   │       ├── clinic/             # Analytics calculator tests
│   │       └── integration/        # Full patient→doctor journey E2E test
│   │
│   ├── drizzle/                    # DB migration SQL files (drizzle-kit)
│   └── public/                     # Static assets, PWA manifest, service worker
│
└── landingPage/                    # Marketing site (separate Next.js app)
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 App Router | Edge-ready, server components, file-based routing |
| **Language** | TypeScript 5 (strict) | End-to-end type safety across API ↔ client |
| **Styling** | Tailwind CSS 4 + CVA | CSS-first config, variant-aware component primitives |
| **LLM — Interview** | Groq LLaMA 3.1 70B | Sub-200ms inference for real-time question generation |
| **LLM — Interview** | Groq `qwen/qwen3.8-27b` + `openai/gpt-oss-20b` fallback | Dual-key + dual-model failover; `<think>` blocks stripped |
| **LLM — H&P Report** | Groq `qwen/qwen3.8-27b` + Gemini 2.5 Flash fallback | Dual-model for reliability; 55s timeout on Gemini |
| **LLM — Vision OCR** | Gemini 2.5 Flash Vision | Multi-page prescription + lab report extraction |
| **TTS** | Bhashini Dhruva API | 22 Indian scheduled languages |
| **TTS Fallback** | ElevenLabs | Premium voice; auto-falls back to Bhashini on 402 |
| **Database** | Neon Postgres (serverless) | HTTP driver — works on Cloudflare Workers edge runtime |
| **ORM** | Drizzle ORM | Type-safe SQL, zero-overhead, edge-compatible |
| **RAG** | Bundled BM25 + cosine similarity | 21 Indian clinical protocol entries, no runtime vector DB |
| **Auth** | HMAC-SHA256 session tokens | Doctor PIN hashed; no JWT library dependency |
| **Testing** | Vitest 3 | 35 unit + integration tests (8 files) |
| **Deployment** | Cloudflare Workers + OpenNext | Edge runtime, global CDN, zero cold-start |

---

## Patient Flow

```mermaid
flowchart TD
    A["🏥 Patient arrives at OPD"] --> B["Select Language\n(23 UI languages)"]
    B --> C["Login\n(Anonymous / Mobile OTP)"]
    C --> D["DPDP Consent Gate\n(/patient/consent)"]
    D --> E["Choose OPD Type\nGeneral / AYUSH\n(/patient/opd-select)"]
    E --> F["AI Interview\nVoice + Touch Chips\n14 clinical stages\n(/patient/history)"]
    F --> G{"Upload Documents?\n(optional)\n(/patient/scan)"}
    G -- Yes --> H["OCR Scan\nGemini Vision extracts\nRx · Labs · Discharge"]
    G -- No --> I["Summary Review\n(/patient/summary)"]
    H --> I
    I --> J["Full H&P Report\n(/report)\nPhysician-grade English"]
    J --> K["Token Queue\n(/patient/complete)\nDoctor Dashboard → /doctor"]
```

Each step stores state in `sessionStorage` via `SessionStore` — no server round-trips until report generation. The doctor dashboard updates in real-time from Neon Postgres.

---

## Getting Started

### Prerequisites
- Node.js 20+
- [Neon](https://neon.tech) Postgres database (free tier)
- [Groq](https://console.groq.com) API key (free tier)
- [Google AI Studio](https://aistudio.google.com) Gemini API key (free)
- Optional: Bhashini credentials, ElevenLabs key (app works without them in dev)

### 1. Clone & Install

```bash
git clone https://github.com/mayankcodes-dev/clinIQ.git
cd clinIQ/product
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# LLM
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Database (Neon Postgres)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Auth
NEXTAUTH_SECRET=your-32-char-random-secret
DOCTOR_PIN=1234

# TTS / ASR — optional; app falls back to silent mode in dev
ELEVENLABS_API_KEY=sk_...
BHASHINI_USER_ID=...
BHASHINI_API_KEY=...
BHASHINI_INFERENCE_URL=https://dhruva-api.bhashini.gov.in/services/inference/pipeline
```

### 3. Push Database Schema

```bash
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

### 4. Run Dev Server

```bash
npm run dev
# → http://localhost:3000          Patient kiosk
# → http://localhost:3000/clinic/dashboard    Doctor dashboard (PIN: 1234)
```

---

## Running Tests

```bash
npm test              # Vitest — 33 unit + integration tests
npm run lint          # ESLint (Next.js config)
npx tsc --noEmit      # TypeScript strict check
npm run build         # Production build (must exit 0 before deploy)
```

---

## Deployment

### Cloudflare Pages (recommended)

```bash
npm run build
```

Set all env vars in Cloudflare Pages → Settings → Environment Variables.  
See `wrangler.jsonc` and `open-next.config.ts` for Cloudflare-specific adapter config.

### Docker (self-hosted clinic)

```bash
docker build -t cliniq .
docker run -p 3000:3000 --env-file .env.local cliniq
```

---

## Security & Compliance

- **DPDP Act 2023** — explicit informed consent before data capture; consent stored per session
- **No plaintext secrets** — doctor PIN hashed with HMAC-SHA256; session tokens signed; never stored in localStorage
- **Patient data isolation** — sessionStorage cleared on new session; no cross-patient leakage
- **Input sanitisation** — all API routes strip control characters and enforce field-length limits
- **Auth guards** — `/clinic/dashboard` and queue-mutation routes require a valid signed PIN token
- **flight-shield** — SingleFlight dedup prevents redundant LLM calls and protects upstream rate limits

---

## License

MIT © 2026 Mayank

> *ClinIQ is an AI-assisted pre-consultation intake tool. It is NOT a diagnostic device.  
> All generated reports are for physician review only and do not constitute a clinical diagnosis.*
