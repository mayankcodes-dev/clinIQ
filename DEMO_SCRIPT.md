# ClinIQ — Demo Video Script
## 2-Minute Product Walkthrough

> **Recording Tool**: Use [Loom](https://loom.com) (free) or OBS Studio
> **Browser**: Chrome, full screen, mobile responsive view (F12 → Toggle Device → Pixel 7)
> **URL**: https://cliniq.mayankcodes.dev (or localhost:3000)

---

## Scene 1: Language Selection (0:00 – 0:15)

**Show**: Landing on the app — grid of 22 Indian language buttons

**Say**: 
> "ClinIQ is an AI-powered pre-consultation kiosk. The patient walks up, selects their language — we support all 22 scheduled Indian languages — and the entire experience adapts."

**Action**: Select **हिन्दी (Hindi)** or **মাতৃভাষা (Bengali)** — pick a non-English language to show the multilingual capability.

---

## Scene 2: Authentication (0:15 – 0:25)

**Show**: Login screen with ABHA ID / Aadhaar OTP / Mobile OTP options

**Say**:
> "Authentication via ABHA ID, Aadhaar OTP, or simple mobile OTP. Built on India's ABDM digital health infrastructure."

**Action**: Enter a phone number, get OTP, login.

---

## Scene 3: Consent (0:25 – 0:35)

**Show**: Consent page with toggles — notice the auto-playing voice instruction

**Say**:
> "Every consent is explained in the patient's language via Bhashini text-to-speech. DPDP Act 2023 compliant. Granular toggles — the patient controls exactly what is shared."

**Action**: Toggle consent switches, tap proceed.

---

## Scene 4: OPD Selection (0:35 – 0:40)

**Show**: General OPD vs AYUSH selection

**Say**:
> "Supports both General Medicine and AYUSH — the interview adapts to include Dashavidha Pariksha parameters for Ayurveda."

**Action**: Select one.

---

## Scene 5: AI Clinical Interview — THE HERO MOMENT (0:40 – 1:15)

**Show**: The chat interface with voice recording and touch chips

**Say**:
> "Now the AI conducts a full clinical history interview. The patient can speak naturally in their language — Bhashini ASR converts speech to text. Or they can tap guided response chips. Watch — the AI asks about chief complaint, then dynamically branches into duration, severity, associated symptoms. This would normally take the doctor 5 minutes. ClinIQ does it before the patient walks in."

**Actions**:
1. Tap the microphone → speak a symptom (e.g., "मुझे सिर में दर्द है" / "I have a headache")
2. Show the AI responding with a follow-up question
3. Tap a touch chip to answer
4. Show how the questions adapt — if you say headache, it asks about duration, vision changes, etc.
5. Let 2-3 questions cycle through — show the instant transitions

---

## Scene 6: Document Scan (1:15 – 1:30)

**Show**: Scan page with camera/upload option

**Say**:
> "Patients can scan old prescriptions and lab reports. Gemini Vision OCR extracts medications, dosages, lab values — even from handwritten prescriptions. Abnormal values are auto-flagged."

**Action**: Upload a sample lab report photo → show the extracted values with color-coded flags (⬆ HIGH in red, ✓ NORMAL in green)

---

## Scene 7: AI Summary (1:30 – 1:50)

**Show**: The structured clinical summary page

**Say**:
> "ClinIQ generates a complete structured clinical summary — Chief Complaint, History of Present Illness, Past Medical History, Medications, Allergies, Family History, Review of Systems. Standard clinical format. The doctor opens this BEFORE the patient enters. Every second of consultation goes to examination and clinical decisions — not history-taking."

**Action**: Scroll through the summary sections. Click print to show the A4 report layout.

---

## Scene 8: Closing (1:50 – 2:00)

**Show**: Complete screen / or scroll back to summary

**Say**:
> "ClinIQ. Pre-consultation intelligence for every clinic. 22 languages. Works offline. ABDM native. Built for India's 1.4 billion."

---

## Recording Tips

1. **Mobile responsive view** — this is a kiosk app, show it in portrait/mobile mode
2. **Speak slowly and clearly** — judges are watching many demos
3. **Don't read from script** — use bullet points, be natural
4. **Show real interaction** — actually speak into the mic, don't just click
5. **Keep it under 2 minutes** — judges have short attention spans
6. **Add captions** — Loom auto-generates captions
7. **Test the full flow first** before recording — make sure APIs are responsive

## Quick Record Command (if using OBS)
1. Open OBS Studio
2. Add "Window Capture" → select Chrome
3. Set output to 1920x1080, 30fps, MP4
4. Hit Record → do the walkthrough → Stop
5. Upload to YouTube (unlisted) or Google Drive
6. Paste the link in hackathon submission
