# ClinIQ — Engineering Pivot Document
## MediKiosk → ClinIQ | From Prototype to B2B SaaS

**For:** The engineering team
**From:** Product / Strategy
**Date:** 1 Oct 2026
**Urgency:** 3 hours — landing page changes are top priority

---

## PART 1: THE PIVOT — WHAT CHANGED AND WHY

### Before (MediKiosk)
- A **hackathon prototype** for SIH 2026 / Ministry of AYUSH
- Positioned as: "Patient case-taking software for government hospitals"
- Target user: Government hospital OPD
- Revenue model: None (government project)
- Branding: Blue + orange, "MediKiosk", medical + government feel
- Tagline: "Healthcare in your language"

### After (ClinIQ)
- A **B2B SaaS product** for private clinics, hospitals, and AYUSH practitioners
- Positioned as: "Pre-consultation AI that interviews patients before the doctor does"
- Target buyer: **Clinic owners, hospital admins, diagnostic chains**
- Revenue model: **₹2,000-15,000/month SaaS subscription per clinic**
- Branding: Navy + teal, "ClinIQ", professional medtech SaaS feel
- Tagline: "Pre-consultation intelligence for every clinic"

### What DOESN'T Change (Core Product)
The actual product engine stays the same:
- ✅ AI voice clinical interview (22 languages)
- ✅ Medical document OCR + extraction
- ✅ Structured clinical summary generation
- ✅ ABDM/ABHA integration (keep as a feature, not the core identity)
- ✅ Offline capability
- ✅ AYUSH dual-mode

### What Changes
- ❌ All "MediKiosk" branding → **ClinIQ**
- ❌ All government/SIH language → **B2B SaaS language**
- ❌ "For Hospitals" section → **"For Clinics"** (clinics are the paying customer)
- ❌ Blue + orange theme → **Navy + teal theme**
- ❌ "Get the App" / "Download" → **"Start Free Trial"** / **"Book Demo"**
- ❌ "Free · No app store" → **"Free for 30 days · No credit card required"**
- ➕ ADD: Pricing section
- ➕ ADD: "Trusted by X clinics" social proof
- ➕ ADD: Revenue/business messaging

---

## PART 2: NEW BRAND IDENTITY

### Name
**ClinIQ** (Clinic + IQ = Your clinic's intelligence layer)

### Logo
Use the generated ClinIQ logo file (speech bubble with medical cross, "Clin" in navy, "IQ" in teal). File: `cliniq_logo.jpg` in the ppt folder. Copy it to `landingPage/public/logo.jpg` (replacing the old MediKiosk logo).

### Color Palette — NEW

```
OLD (MediKiosk):
  blue:   "#2563eb"   (bright blue)
  orange: "#f97316"   (orange accent)
  black:  "#0d0d0d"
  gray:   "#f4f4f5"
  muted:  "#6b7280"

NEW (ClinIQ):
  navy:   "#1a365d"   (primary — dark navy blue, professional)
  teal:   "#0d9488"   (accent — medical teal/green)
  black:  "#0f172a"   (slate-900, slightly softer than pure black)
  gray:   "#f8fafc"   (slate-50, lighter background)
  muted:  "#64748b"   (slate-500)
  white:  "#ffffff"
  border: "rgba(0,0,0,0.06)"
```

### Typography
Keep **Manrope** — it's modern and professional. No change needed.

### Tone of Voice
| MediKiosk | ClinIQ |
|---|---|
| "Healthcare in your language" | "Pre-consultation intelligence for every clinic" |
| "MediKiosk takes your full medical history" | "ClinIQ interviews your patients before you do" |
| "Get the App" | "Start Free Trial" |
| "Free · No app store" | "Free for 30 days · No credit card" |
| "For Hospitals" | "For Clinics" |
| Patient-first language | Doctor/clinic-owner-first language |

---

## PART 3: LANDING PAGE CODE CHANGES

### File: `landingPage/src/app/page.tsx`

---

### 3.1 — APP_URL + CONSTANTS (Lines 9-21)

**OLD:**
```tsx
const APP_URL = "https://app.medikiosk.mayankcodes.dev";

const C = {
  white:  "#ffffff",
  black:  "#0d0d0d",
  blue:   "#2563eb",
  orange: "#f97316",
  gray:   "#f4f4f5",
  muted:  "#6b7280",
  border: "rgba(0,0,0,0.08)",
};
```

**NEW:**
```tsx
const APP_URL = "https://app.cliniq.health"; // UPDATE TO YOUR NEW DOMAIN
const DEMO_URL = "https://calendly.com/YOUR_LINK"; // Add a Calendly/Cal.com link for "Book Demo"

const C = {
  white:  "#ffffff",
  black:  "#0f172a",
  navy:   "#1a365d",
  teal:   "#0d9488",
  gray:   "#f8fafc",
  muted:  "#64748b",
  border: "rgba(0,0,0,0.06)",
};
```

> **IMPORTANT:** After this change, replace every `C.blue` → `C.navy` and every `C.orange` → `C.teal` throughout the entire file.

---

### 3.2 — FEATURES DATA (Lines 56-61)

**OLD:**
```tsx
const FEATURES = [
  { tag: "Voice-first",  headline: "Talk to us.\nWe understand every language.",            body: "Speak in Hindi, Tamil, Bengali — or any of India's 22 Scheduled Languages. MediKiosk listens and understands. No typing needed.",                                                             img: "/feature-voice.png",    alt: "Patient speaking to MediKiosk" },
  { tag: "AI History",   headline: "Your doctor gets the full picture\nbefore you walk in.", body: "Our AI asks about your chief complaint, symptoms, duration, and past history — structuring everything into a clinical summary the doctor can act on.",                                          img: "/feature-ai.avif",      alt: "Doctor reviewing clinical summary" },
  { tag: "Documents",    headline: "Old prescriptions and reports —\njust scan them.",       body: "Upload a photo of your lab report, prescription, or discharge summary. MediKiosk reads it and adds key findings to your record automatically.",                                                 img: "/feature-docs.avif",    alt: "Scanning medical documents" },
  { tag: "Privacy",      headline: "Your data belongs to you.\nAlways.",                    body: "DPDP Act 2023 compliant. ABDM certified. No Aadhaar stored. Your record is shared only with your treating doctor, only on the day of your visit.",                                             img: "/feature-privacy.png",  alt: "Digital health privacy" },
];
```

**NEW:**
```tsx
const FEATURES = [
  { tag: "AI Interview",    headline: "Your patients tell us everything.\nBefore they see you.",    body: "ClinIQ conducts an adaptive AI clinical interview in 22 Indian languages — voice or touch. Patients walk in, and their complete history is already on your screen.",                           img: "/feature-voice.png",    alt: "Patient using ClinIQ" },
  { tag: "Clinical Summary", headline: "Complete SOAP notes.\nBefore the consultation.",             body: "Chief Complaint → HPI → Past History → Medications → Allergies → Family History → Review of Systems. Structured, standardized, ready to edit and approve in one click.",                     img: "/feature-ai.avif",      alt: "Doctor reviewing ClinIQ summary" },
  { tag: "Document AI",     headline: "Old prescriptions?\nWe read those too.",                     body: "Patient snaps a photo of prescriptions, lab reports, or discharge summaries. ClinIQ extracts medications, diagnoses, and lab values automatically. Even handwritten ones.",                   img: "/feature-docs.avif",    alt: "Scanning medical documents" },
  { tag: "Compliance",      headline: "DPDP compliant.\nABDM native.\nZero risk.",                  body: "Built on ABDM/ABHA from day one. FHIR R4 compliant. DPDP Act 2023 audit-ready. Patient consent recorded in their own language. Your clinic stays compliant without effort.",                 img: "/feature-privacy.png",  alt: "Healthcare data compliance" },
];
```

---

### 3.3 — STEPS DATA (Lines 63-68)

**OLD:**
```tsx
const STEPS = [
  { n: "01", title: "Choose your language",     body: "Hindi, Tamil, Bengali, and 19 more." },
  { n: "02", title: "Speak your symptoms",      body: "Voice or touch — whatever feels natural." },
  { n: "03", title: "Upload old reports",       body: "Prescriptions, lab reports, discharge summaries." },
  { n: "04", title: "Doctor gets your summary", body: "Full clinical record ready before you enter." },
];
```

**NEW:**
```tsx
const STEPS = [
  { n: "01", title: "Patient checks in",        body: "Scans QR at your clinic or opens link from WhatsApp." },
  { n: "02", title: "AI takes the history",     body: "5-8 min voice conversation in patient's language." },
  { n: "03", title: "Documents get scanned",    body: "Old prescriptions + lab reports → digitized instantly." },
  { n: "04", title: "You get the summary",      body: "Structured clinical history on your screen. Edit and approve." },
];
```

---

### 3.4 — NAV BAR (Lines 117-145)

**OLD:**
```tsx
{/* Logo */}
<a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
  <Image src="/logo.jpg" alt="MediKiosk" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px", color: C.black }}>
    Medi<span style={{ color: C.blue }}>Kiosk</span>
  </span>
</a>

{/* Nav links */}
<nav className="hide-mobile" style={{ display: "flex", gap: 32 }}>
  {["Features", "For Hospitals", "Languages"].map((item) => (
    ...
  ))}
</nav>

{/* CTA buttons */}
<a href={APP_URL} className="btn-login">Log In ›</a>
<a href={APP_URL} target="_blank" rel="noopener noreferrer" className="btn-download">
  Get the App
  ...
</a>
```

**NEW:**
```tsx
{/* Logo */}
<a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
  <Image src="/logo.jpg" alt="ClinIQ" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px", color: C.black }}>
    Clin<span style={{ color: C.teal }}>IQ</span>
  </span>
</a>

{/* Nav links */}
<nav className="hide-mobile" style={{ display: "flex", gap: 32 }}>
  {["Features", "For Clinics", "Pricing", "Languages"].map((item) => (
    ...
  ))}
</nav>

{/* CTA buttons */}
<a href={APP_URL} className="btn-login">Log In ›</a>
<a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="btn-download">
  Book a Demo
</a>
```

---

### 3.5 — HERO SECTION (Lines 213-260)

**OLD:**
```tsx
<h1>Healthcare in<br />your language.</h1>
<p>MediKiosk takes your full medical history — by voice, in your language — before you see the doctor.</p>
<a ... className="btn-login btn-login-white">Log In ›</a>
<a ... className="btn-download">Get the App ...</a>

{/* AI chip */}
<p>MediKiosk AI</p>
<p>"आपको क्या तकलीफ है?"</p>

{/* Footnote */}
<p>* Free · No app store · Android · iOS · Desktop</p>
```

**NEW:**
```tsx
<h1>Your patients' story.<br />Before they walk in.</h1>
<p>ClinIQ interviews patients in their language, scans their old records, and delivers a complete clinical summary to your screen — before the consultation begins.</p>
<a ... className="btn-login btn-login-white">Start Free Trial ›</a>
<a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="btn-download">Book a Demo</a>

{/* AI chip */}
<p>ClinIQ AI</p>
<p>"आपको क्या तकलीफ है?"</p>

{/* Footnote */}
<p>* Free for 30 days · No credit card · Works on any device</p>
```

---

### 3.6 — "HOW IT WORKS" SECTION HEADLINE (Lines 270-274)

**OLD:**
```tsx
<p style={tagLabel(C.blue)}>Simple process</p>
<h2>Four steps.<br />Under four minutes.</h2>
```

**NEW:**
```tsx
<p style={tagLabel(C.teal)}>How it works</p>
<h2>Setup takes 10 minutes.<br />Each patient takes 5.</h2>
```

---

### 3.7 — "FOR HOSPITALS" → "FOR CLINICS" SECTION (Lines 344-378)

**OLD:**
```tsx
<section id="for-hospitals">
  <p style={tagLabel(C.orange)}>For Hospitals</p>
  <h2>Cut OPD wait times.<br />Not quality of care.</h2>
  {[
    { icon: "⚡", title: "Faster OPD flow",  body: "Doctor gets a structured clinical summary before the patient enters." },
    { icon: "📊", title: "Doctor dashboard", body: "Annotate, approve, and print records from one clean screen." },
    { icon: "🔗", title: "ABDM / ABHA",      body: "Auto-push records to the patient's digital health locker." },
    { icon: "📵", title: "Offline-ready",    body: "Service worker keeps the kiosk running even when network drops." },
  ]}
```

**NEW:**
```tsx
<section id="for-clinics">
  <p style={tagLabel(C.teal)}>For Clinics & Hospitals</p>
  <h2>See more patients.<br />With better outcomes.</h2>
  {[
    { icon: "⚡", title: "2-3x more patients/day",  body: "Doctors spend zero time on history-taking. Every minute goes to diagnosis and care." },
    { icon: "📊", title: "Doctor dashboard",         body: "Review, edit, and approve patient summaries from one clean screen. Mobile-friendly." },
    { icon: "💰", title: "Instant ROI",              body: "Starts at ₹2,000/month. Cost per patient: under ₹2. Pays for itself in the first week." },
    { icon: "📵", title: "Works offline",            body: "No internet? No problem. ClinIQ runs locally and syncs when connected." },
  ]}
```

---

### 3.8 — ADD NEW PRICING SECTION (Insert before "Languages" section)

Add this new section after "For Clinics" and before "Languages":

```tsx
{/* ── PRICING ──────────────────────────────────────────────────────── */}
<section id="pricing" style={{ background: C.gray }}>
  <div className="page-container" style={{ paddingTop: 96, paddingBottom: 96 }}>
    <Reveal>
      <p style={tagLabel(C.teal)}>Simple pricing</p>
      <h2 style={{ ...h2, fontSize: "clamp(30px, 4vw, 48px)", maxWidth: 400, marginBottom: 56 }}>
        One plan.<br />No surprises.
      </h2>
    </Reveal>
    <Reveal delay={0.1}>
      <div className="two-col" style={{ gap: 32 }}>
        {/* Solo/Small Clinic */}
        <div style={{
          border: `2px solid ${C.border}`, borderRadius: 20, padding: 40,
          background: C.white, display: "flex", flexDirection: "column", gap: 16,
        }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em" }}>Starter</p>
          <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.black }}>
            ₹2,000<span style={{ fontSize: 16, fontWeight: 500, color: C.muted }}>/month</span>
          </p>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            Perfect for solo practitioners and small clinics. Up to 200 patient intakes/month.
          </p>
          <ul style={{ fontFamily: FONT, fontSize: 14, color: C.muted, lineHeight: 2, paddingLeft: 20 }}>
            <li>AI voice interview in 22 languages</li>
            <li>Document scanning & OCR</li>
            <li>Doctor summary dashboard</li>
            <li>ABDM/ABHA integration</li>
            <li>Email support</li>
          </ul>
          <a href={APP_URL} className="btn-download" style={{ textAlign: "center", marginTop: 8 }}>Start Free Trial</a>
        </div>

        {/* Multi-Doctor / Hospital */}
        <div style={{
          border: `2px solid ${C.teal}`, borderRadius: 20, padding: 40,
          background: C.white, display: "flex", flexDirection: "column", gap: 16,
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -1, right: 32,
            background: C.teal, color: C.white, padding: "6px 16px",
            borderRadius: "0 0 8px 8px", fontSize: 11, fontWeight: 700,
            fontFamily: FONT, letterSpacing: "0.05em",
          }}>MOST POPULAR</div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em" }}>Growth</p>
          <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.black }}>
            ₹8,000<span style={{ fontSize: 16, fontWeight: 500, color: C.muted }}>/month</span>
          </p>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            For multi-doctor clinics and nursing homes. Unlimited intakes. Priority support.
          </p>
          <ul style={{ fontFamily: FONT, fontSize: 14, color: C.muted, lineHeight: 2, paddingLeft: 20 }}>
            <li>Everything in Starter</li>
            <li>Unlimited patient intakes</li>
            <li>Multi-doctor support</li>
            <li>Waiting room queue manager</li>
            <li>WhatsApp intake links for patients</li>
            <li>AYUSH Dashavidha Pariksha mode</li>
            <li>Priority WhatsApp support</li>
          </ul>
          <a href={DEMO_URL} className="btn-download" style={{ textAlign: "center", marginTop: 8 }}>Book a Demo</a>
        </div>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 13, color: "#bbb", marginTop: 24, textAlign: "center" }}>
        Hospital chains and enterprise? <a href={DEMO_URL} style={{ color: C.teal, fontWeight: 600 }}>Talk to us →</a>
      </p>
    </Reveal>
  </div>
</section>
```

---

### 3.9 — FINAL CTA SECTION (Lines 381-406)

**OLD:**
```tsx
<h2>Ready to try MediKiosk?</h2>
<p>Free. No app store needed. Works on any device.</p>
<a ... className="btn-login btn-login-lg">Log In ›</a>
<a ... className="btn-download btn-download-lg">Download ...</a>
<p>Android · iOS · Desktop · No app store required</p>
```

**NEW:**
```tsx
<h2>Ready to see more patients?</h2>
<p>Free for 30 days. No credit card. Setup in 10 minutes.</p>
<a href={APP_URL} className="btn-login btn-login-lg">Start Free Trial ›</a>
<a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="btn-download btn-download-lg">
  Book a Demo
</a>
<p>Works on any tablet, phone, or desktop · No hardware required</p>
```

---

### 3.10 — FOOTER (Lines 408-436)

**OLD:**
```tsx
<Image src="/logo.jpg" alt="MediKiosk" ... />
<span>Medi<span style={{ color: C.blue }}>Kiosk</span></span>

<p>© 2026 MediKiosk · SIH 2026</p>

<p>Designed & Developed by Team <span style={{ color: C.blue }}>वैद्य सहायक</span></p>
```

**NEW:**
```tsx
<Image src="/logo.jpg" alt="ClinIQ" ... />
<span>Clin<span style={{ color: C.teal }}>IQ</span></span>

<p>© 2026 ClinIQ Health Technologies</p>

<p><a href="mailto:hello@cliniq.health" style={{ color: C.teal }}>hello@cliniq.health</a></p>
```

---

## PART 4: CSS CHANGES

### File: `landingPage/src/app/globals.css`

Replace all `#2563eb` (old blue) → `#1a365d` (navy)
Replace all `#f97316` (old orange) → `#0d9488` (teal)

**OLD:**
```css
.btn-login {
  border: 2px solid #2563eb; background: transparent; color: #2563eb;
}
.btn-login:hover { background: #f97316; border-color: #f97316; color: #fff; }
.btn-download {
  border: 2px solid #2563eb; background: #2563eb; color: #fff;
}
.btn-download:hover { background: #f97316; border-color: #f97316; }
```

**NEW:**
```css
.btn-login {
  border: 2px solid #1a365d; background: transparent; color: #1a365d;
}
.btn-login:hover { background: #0d9488; border-color: #0d9488; color: #fff; }
.btn-download {
  border: 2px solid #0d9488; background: #0d9488; color: #fff;
}
.btn-download:hover { background: #1a365d; border-color: #1a365d; }
```

---

## PART 5: FILE/ASSET CHANGES

| What | Action |
|---|---|
| `public/logo.jpg` | Replace with new ClinIQ logo |
| `public/hero.jpg` | Keep current image OR replace with a clinic/doctor-focused image (not government hospital) |
| `public/hospital.jpg` | Replace with a modern private clinic image (not government hospital OPD) |
| Domain | Point to `cliniq.health` or `getcliniq.com` (buy the domain) |
| `public/favicon.ico` | Generate from the ClinIQ logo icon |

---

## PART 6: BEYOND THE LANDING PAGE — PRODUCT CHANGES

These are NOT urgent for today but are the next sprint:

### App Changes (the actual product at `app.medikiosk...`)
| Change | Priority |
|---|---|
| Replace all "MediKiosk" → "ClinIQ" in UI | 🔴 Today |
| Update logo in app | 🔴 Today |
| Change color theme to navy + teal | 🟡 This week |
| Add "Clinic Dashboard" view for doctor | 🟡 This week |
| Add pricing gate / subscription check | 🟢 Next sprint |
| Add WhatsApp intake link generation | 🟢 Next sprint |
| Add waiting room queue view | 🟢 Next sprint |

### Infra Changes
| Change | Priority |
|---|---|
| New domain: `cliniq.health` or `getcliniq.com` | 🔴 Today |
| Update Cloudflare/DNS | 🔴 Today |
| Update `APP_URL` in code | 🔴 Today |
| New email: `hello@cliniq.health` | 🟡 This week |
| Update GitHub repo name/README | 🟡 This week |

---

## PART 7: QUICK CHECKLIST — DO IN ORDER

```
□ 1. Buy domain (cliniq.health or getcliniq.com)
□ 2. Copy ClinIQ logo to public/logo.jpg
□ 3. Global find-replace in page.tsx: MediKiosk → ClinIQ, medikiosk → cliniq
□ 4. Update color constants (C.blue → C.navy, C.orange → C.teal)
□ 5. Update CSS colors in globals.css
□ 6. Replace all copy (hero, features, steps, for-clinics, footer)
□ 7. Add Pricing section
□ 8. Update CTA buttons ("Get the App" → "Start Free Trial" / "Book Demo")
□ 9. Deploy to new domain
□ 10. Test on mobile + desktop
```

**Total estimated time: 2-3 hours if you move fast and don't redesign anything, just swap text + colors.**
