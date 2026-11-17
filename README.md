<div align="center">

# ClinIQ — AI-Powered Multilingual Clinical History Kiosk

**Smart India Hackathon 2026 · Problem Statement PS 26047**
*Ministry of Health and Family Welfare · Category: MedTech / BioTech / HealthTech*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-00E5BF?logo=postgresql)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> ClinIQ replaces the paper OPD form with a voice-first, multilingual AI kiosk.  
> Patients answer questions in their own language — Hindi, Tamil, Bengali and 8 more.  
> The doctor receives a structured, one-page History & Physical before the patient even walks in.

</div>

---

## The Problem

Every day across India, millions of patients fill out paper OPD forms in a language they barely read, hand them to an overwhelmed doctor, and lose critical medical context in translation.

- **Doctors spend 6–8 minutes per patient** just collecting history that could be captured automatically.
- **Non-literate and rural patients** cannot fill forms in English or even their own script.
- **Chronic patients** (diabetics, hypertensives) miss follow-ups because no one reminds them.
- **Paper records** are lost, undated, and invisible to the next specialist.

---

## The Solution

ClinIQ is a **touchscreen + voice kiosk** placed at OPD reception. In under 4 minutes:

1. Patient taps their language and OPD department.
2. The kiosk **speaks** each question using Bhashini / ElevenLabs TTS.
3. Patient **speaks or taps** their answer.
4. AI structures the answers into a clinical **History & Physical (H&P)** document — in medical English — for the doctor.
5. Patient receives a **token number**. Doctor receives the full structured summary before the consultation begins.

---

## Key Features

### 🗣️ Voice-First, 11-Language Support
- Full intake interview conducted via text-to-speech in **Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, and English**.
- Powered by **Bhashini Dhruva** (government-certified ASR/TTS) with ElevenLabs as premium fallback.
- Touch-chip quick-select for semi-literate patients — tap common answers, no typing needed.

### 🧠 AI Clinical Interview Engine
- Groq LLaMA models drive a structured, adaptive interview across **7 clinical stages**: Chief Complaint → HPI → Past History → Drug & Allergy → Family History → Personal History → Review of Systems.
- **AYUSH mode** extends the interview with full **Dashavidha Pariksha** (10-fold Ayurvedic examination) — Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara, and more.
- Interview questions are dynamically generated based on previous answers — no rigid scripted trees.
- Deterministic fallback for all stages when LLM is unavailable — kiosk **never breaks**.

### 📄 AI-Generated History & Physical (H&P) Report
- Gemini 2.5 Flash and Groq LLaMA jointly produce a **physician-grade H&P** in medical English:
  - `CHIEF COMPLAINT` · `HISTORY OF PRESENT ILLNESS` · `PAST MEDICAL HISTORY`
  - `MEDICATIONS` · `ALLERGIES` · `FAMILY AND SOCIAL HISTORY` · `REVIEW OF SYSTEMS`
  - `🚨 RED FLAGS` (highlighted in red) · `ASSESSMENT — DIFFERENTIAL CONSIDERATIONS` · `ICD-10 SUGGESTIONS`
- Report is **single-page**, Georgia serif, clean white — resembles a real hospital H&P note.
- **Print / Save as PDF** with one click.
- **WhatsApp Share** — full H&P pre-filled as a WhatsApp message for teleconsultation or referral.

### 📸 OCR Document Scan
- Patient uploads previous prescriptions, lab reports, discharge summaries, X-ray reports.
- **Gemini Vision** extracts medications, diagnoses, lab values, doctor names, and dates.
- Extracted data is merged into the final H&P — lab values appear in `KEY LABORATORY FINDINGS`.

### 🏥 Live Doctor Queue (B2B Feature 1)
- Each submitted intake auto-generates a **token number** (A-001, A-002 …) stored in Neon Postgres.
- Doctor dashboard shows the live queue: patient name, chief complaint, severity, ICD-10 suggestion, wait time.
- Tokens persist across server restarts (Neon DB) — no in-memory loss on cold starts.
- Graceful mock fallback — if DB is unreachable, patient still gets a token and flow never breaks.

### 💊 Prescription Builder (B2B Feature 2)
- Doctor fills name, Rx, dosage, advice on a digital form in the dashboard.
- Generates a **printable prescription** with clinic letterhead.
- One-click **WhatsApp to Patient** — sends the prescription text as a pre-filled WhatsApp message to the patient's mobile.

### 📊 Chronic-Care Recall & ROI Dashboard (B2B Feature 3)
- Auto-detects **chronic conditions** (Diabetes E11, Hypertension I10, Hypothyroidism E03, Asthma J45, Osteoarthritis M15–M19) from completed H&P reports using ICD-10 keyword matching.
- **ROI Telemetry Panel** shows live:
  - `Doctor Hours Saved` — `intakes × 6.5 min / 60`
  - `Chronic Patients Identified` — count of tagged chronic cases
  - `Projected Monthly Revenue Lift` — `chronicPatients × ₹500` (avg OPD fee)
  - `Avg Intake Latency` — time per patient in minutes
- **30-Day Smart Recall Table** — lists chronic patients with condition tag, follow-up date, and a **"Send WhatsApp Recall"** button that generates a personalized reminder in the patient's preferred language.

### 🔐 ABHA Integration (Sandbox)
- Full **Ayushman Bharat Health Account (ABHA)** OTP verification flow via ABDM sandbox.
- Dev mock mode when ABDM credentials are absent — kiosk works fully without ABHA for pilots.
- Session token signed with HMAC-SHA256 — patient data requests authenticated server-side.

### 🌐 Offline-Ready PWA
- Service worker (`/public/sw.js`) caches static assets — kiosk works on slow or intermittent clinic Wi-Fi.
- `manifest.json` for Add to Home Screen on Android tablets.

### 🧬 Clinical RAG (Hybrid Retrieval)
- Local knowledge base of 50+ Indian clinical protocols (RNTCP, NCD guidelines, AYUSH formulary).
- Retrieves **red-flag symptoms** and **ICD-10 mappings** relevant to the chief complaint.
- Injected as a protocol checklist into the report-generation prompt — grounding the AI in Indian clinical guidelines.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.5 (App Router, React 19) |
| **Language** | TypeScript 5.x (strict) |
| **Styling** | Tailwind CSS v4, Framer Motion |
| **LLM — Interview** | Groq LLaMA 3.1 70B + LLaMA 3.1 8B (fast) |
| **LLM — Report / OCR** | Google Gemini 2.5 Flash (REST) |
| **TTS / ASR** | Bhashini Dhruva (primary) · ElevenLabs (fallback) |
| **Database** | Neon Postgres (serverless) + Drizzle ORM |
| **Auth** | ABHA OTP via ABDM sandbox · HMAC-SHA256 session tokens |
| **Deployment** | Cloudflare Pages (edge) · Docker (self-host) |
| **Testing** | Vitest · 33 unit + integration tests |

---

## Patient Journey

```
Landing → Language Select → Consent → OPD Department Select
    → Voice/Touch Interview (7 stages, ~4 min)
        → Document Scan (optional — prescriptions, lab reports)
            → Summary Review
                → /report  ← H&P generated here (Gemini + Groq)
                    → WhatsApp Share / Print PDF
                        → Token Number  ← Doctor queue
                            → Doctor Dashboard (live queue, H&P, Rx builder)
```

---

## Project Structure

```
medikiosk/
├── product/                     ← Next.js application (the kiosk + dashboard)
│   ├── src/
│   │   ├── app/
│   │   │   ├── patient/         ← Patient-facing kiosk flow
│   │   │   │   ├── consent/     ← DPDP Act consent screen
│   │   │   │   ├── opd-select/  ← Department selection
│   │   │   │   ├── history/     ← AI interview (voice + touch)
│   │   │   │   ├── scan/        ← OCR document upload
│   │   │   │   ├── summary/     ← Review before submit
│   │   │   │   └── complete/    ← Token number display
│   │   │   ├── report/          ← H&P report (doctor + patient view)
│   │   │   ├── clinic/
│   │   │   │   └── dashboard/   ← Doctor dashboard (queue, Rx, ROI)
│   │   │   └── api/
│   │   │       ├── interview/   ← Groq LLM interview engine
│   │   │       ├── report/      ← Gemini H&P generator
│   │   │       ├── scan/        ← Gemini Vision OCR
│   │   │       ├── bhashini/    ← TTS + ASR endpoints
│   │   │       ├── queue/       ← Neon queue CRUD
│   │   │       └── auth/        ← ABHA OTP + doctor PIN
│   │   ├── lib/
│   │   │   ├── sessionStore.ts  ← Client-side session management
│   │   │   ├── clinicQueueStore.ts ← In-memory clinic queue (B2B)
│   │   │   ├── clinicAnalytics.ts  ← Chronic-care ROI calculator
│   │   │   ├── groq.ts          ← Groq client + model config
│   │   │   ├── buildSummary.ts  ← Fallback summary builder
│   │   │   └── rag/             ← Clinical knowledge retrieval
│   │   └── components/
│   │       ├── kiosk/           ← KioskLayout, KioskHeader, etc.
│   │       ├── clinic/          ← PrescriptionBuilder, dashboard cards
│   │       ├── interview/       ← InterQuestionLoader animation
│   │       └── ClinIQLoader.tsx ← EKG heartbeat loader
│   ├── drizzle/                 ← DB migration SQL files
│   └── public/                  ← Static assets, PWA manifest, sw.js
└── landingPage/                 ← Marketing site (separate Next.js app)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) Postgres database (free tier works)
- A [Groq](https://console.groq.com) API key (free tier works)
- A [Google AI Studio](https://aistudio.google.com) Gemini API key (free)
- Optional: Bhashini API credentials, ElevenLabs API key

### 1. Clone

```bash
git clone https://github.com/mayankcodes-dev/medikiosk.git
cd medikiosk/product
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

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
NEXTAUTH_SECRET=your-32-char-secret
DOCTOR_PIN=1234

# TTS/ASR (optional — app works without these in dev)
ELEVENLABS_API_KEY=sk_...
BHASHINI_USER_ID=...
BHASHINI_API_KEY=...
BHASHINI_INFERENCE_URL=https://dhruva-api.bhashini.gov.in/services/inference/pipeline

# ABHA (optional — dev mock used when empty)
ABDM_CLIENT_ID=
ABDM_CLIENT_SECRET=
```

### 4. Push Database Schema

```bash
npx drizzle-kit push
```

### 5. Run Dev Server

```bash
npm run dev
# → http://localhost:3000
```

### 6. Access Doctor Dashboard

Navigate to `http://localhost:3000/clinic/dashboard`  
Default doctor PIN: **1234** (set `DOCTOR_PIN` in env to change)

---

## Running Tests

```bash
npm test          # Vitest — 33 unit + integration tests
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript strict check
```

---

## Deployment

### Cloudflare Pages (recommended)

```bash
npm run build     # Builds Next.js for Cloudflare Pages edge runtime
```

Set environment variables in Cloudflare Pages → Settings → Environment Variables.  
See `wrangler.jsonc` and `open-next.config.ts` for Cloudflare-specific config.

### Docker (self-hosted clinic)

```bash
docker build -t cliniq .
docker run -p 3000:3000 --env-file .env.local cliniq
```

---

## Security & Compliance

- **DPDP Act 2023** — explicit informed consent before any data capture; consent stored per session.
- **No plaintext secrets** — OTP hashed with HMAC-SHA256; session tokens signed; never stored in browser localStorage.
- **Patient data isolation** — sessionStorage cleared on new session; no cross-patient data leakage.
- **Input sanitisation** — all API routes strip control characters and enforce field length limits.
- **Auth guards** — `/clinic/dashboard` and all queue mutation routes require a valid doctor PIN or patient token.
- **`.env.local` gitignored** — real API keys never committed.

---

## Roadmap

- [ ] FHIR R4 export (HL7 bundle per session)
- [ ] ABHA production integration (live ABDM, not sandbox)
- [ ] Multi-clinic SaaS mode (clinic subdomain routing)
- [ ] Teleconsultation deep-link (Jio Health Hub / eSanjeevani)
- [ ] Offline-first SQLite for areas with no connectivity
- [ ] Nurse dashboard for vitals entry (BP, SpO₂, weight, temp)
- [ ] Voice-only mode for blind / motor-impaired patients

---

## Team

**Team ClinIQ** — Smart India Hackathon 2026  
Problem Statement: PS 26047 · Category: MedTech / BioTech / HealthTech  
Institution: [Your Institution Name]

---

## License

MIT © 2026 Team ClinIQ

> *This software is an AI-assisted pre-consultation intake tool. It is NOT a diagnostic device.  
> All generated reports are for physician review only and do not constitute a clinical diagnosis.*
