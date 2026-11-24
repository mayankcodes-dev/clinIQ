<div align="center">

<img src="./cliniq_logo.jpg" alt="ClinIQ Logo" width="140" style="border-radius:16px; margin-bottom:12px" />

# ClinIQ

### AI-Powered Multilingual Clinical History Kiosk

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.1-orange)](https://groq.com)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E5BF?logo=postgresql)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> ClinIQ turns a touchscreen tablet at OPD reception into a voice-first AI clinical assistant.  
> Patients answer questions in their own language. The doctor receives a structured, physician-grade  
> History & Physical before the consultation begins.

</div>

---

## What ClinIQ Does

ClinIQ is a **pre-consultation intake platform** deployed as a kiosk at hospital and clinic reception desks. In under 4 minutes, it:

1. Greets the patient in their chosen language (11 Indian languages + English)
2. Conducts a structured clinical interview using voice TTS — no typing required
3. Accepts uploaded prescriptions, lab reports, and discharge summaries via camera OCR
4. Generates a physician-grade **History & Physical (H&P)** document in medical English
5. Pushes the patient to a **live token queue** visible on the doctor's dashboard
6. Sends the full H&P via **WhatsApp** for teleconsultation or mobile review

---

## Features

### 🗣️ Voice-First, 11-Language Interview
- Full intake conducted via text-to-speech across **Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, and English**
- Powered by **Bhashini Dhruva** (government-grade ASR/TTS) with ElevenLabs as premium voice fallback
- Quick-tap chip answers for semi-literate patients — no typing, no spelling

### 🧠 Adaptive AI Interview Engine
- Groq LLaMA 3.1 drives a 7-stage structured clinical interview:  
  `Chief Complaint → HPI → Past History → Drug & Allergy → Family History → Personal History → Review of Systems`
- **AYUSH mode** extends the interview with full Dashavidha Pariksha — Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara, Nidana, and 10 more Ayurvedic parameters
- Questions are dynamically generated from prior answers — not a rigid script
- **flight-shield SingleFlight** deduplicates concurrent LLM calls per session, preventing thundering-herd on rapid taps
- Deterministic fallback for every stage — kiosk **never shows a blank screen**

### 📄 Physician-Grade H&P Report
- Gemini 2.5 Flash + Groq LLaMA jointly produce a **single-page, Georgia-serif H&P** in professional medical English:
  - `CHIEF COMPLAINT` · `HISTORY OF PRESENT ILLNESS` · `PAST MEDICAL HISTORY`
  - `MEDICATIONS` · `ALLERGIES` · `FAMILY AND SOCIAL HISTORY` · `REVIEW OF SYSTEMS`
  - `🚨 RED FLAGS` (highlighted) · `ASSESSMENT — DIFFERENTIAL CONSIDERATIONS` · `ICD-10 SUGGESTIONS`
- Report is RAG-grounded against **Indian clinical protocol guidelines** (hybrid BM25 + semantic retrieval)
- One-click **Print / Save as PDF**

### 💬 WhatsApp Share
- Full H&P pre-formatted as a WhatsApp message — bold headers, structured sections
- One tap opens WhatsApp Web / app with the report pre-filled
- Enables instant teleconsultation referral and mobile review by the doctor
- Works on both desktop (WhatsApp Web) and mobile (native app deep-link)

### 📸 OCR Document Scan
- Patient uploads previous prescriptions, lab reports, discharge summaries, X-ray findings
- **Gemini Vision** extracts medications, diagnoses, lab values, doctor names, dates
- Extracted data merges into the H&P under `KEY LABORATORY AND DOCUMENT FINDINGS`

### 🏥 Live Doctor Queue (B2B — Clinic Dashboard)
- Every completed intake auto-assigns a **token number** (A-001, A-002 …) persisted in Neon Postgres
- Doctor dashboard at `/clinic/dashboard` shows the live queue: patient name, chief complaint, severity level, ICD-10 hint, wait time
- Tokens survive server restarts (DB-persisted); graceful in-memory mock fallback if DB is unreachable
- PIN-protected access — configurable via `DOCTOR_PIN` env var

### Pipeline
> Items actively scoped but not yet in production:
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
| **LLM — H&P Report** | Groq LLaMA 3.1 70B + Gemini 2.5 Flash | Dual-model for reliability; Gemini fallback |
| **LLM — Vision OCR** | Gemini 2.5 Flash Vision | Multi-page prescription + lab report extraction |
| **TTS** | Bhashini Dhruva API | Govt-certified Indian language TTS (11 languages) |
| **TTS Fallback** | ElevenLabs | Premium voice for English and high-fidelity fallback |
| **Database** | Neon Postgres (serverless) | HTTP driver — works on Cloudflare Pages edge runtime |
| **ORM** | Drizzle ORM | Type-safe SQL, zero-overhead, edge-compatible |
| **Request Dedup** | flight-shield (SingleFlight) | Prevents thundering-herd on concurrent LLM calls |
| **RAG** | Hybrid BM25 + cosine similarity | Indian clinical protocol grounding, local knowledge base |
| **Auth** | HMAC-SHA256 session tokens | Doctor PIN hashed; no JWT library dependency |
| **Testing** | Vitest 3 | 33 unit + integration tests (summary, queue, OCR, analytics) |
| **Deployment** | Cloudflare Pages + OpenNext | Edge runtime, global CDN, zero cold-start |

---

## Patient Flow

```mermaid
flowchart TD
    A["🏥 Patient arrives at OPD"] --> B["Select Language\n(11 Indian languages)"]
    B --> C["DPDP Consent Gate"]
    C --> D["Choose OPD Type\nGeneral / AYUSH"]
    D --> E["AI Interview\nVoice + Touch Chips\n7 clinical stages"]
    E --> F{"Upload Documents?\n(optional)"}
    F -- Yes --> G["OCR Scan\nGemini Vision extracts\nRx · Labs · Discharge"]
    F -- No --> H["Summary Review\nPatient confirms answers"]
    G --> H
    H --> I["H&P Report Generation\nGroq + Gemini\nPhysician-grade English"]
    I --> J["WhatsApp Share\nOne-tap pre-filled message"]
    I --> K["Token Queue\nNeon Postgres\nDoctor Dashboard"]
    K --> L["Doctor sees live queue\n/clinic/dashboard\nName · Complaint · ICD-10 · Wait"]
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
