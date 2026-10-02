"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const APP_URL = "https://app.cliniq.mayankcodes.dev";
const DEMO_URL = "#";

const C = {
  white:  "#ffffff",
  black:  "#0f172a",
  navy:   "#1a365d",
  teal:   "#0d9488",
  gray:   "#f8fafc",
  muted:  "#64748b",
  border: "rgba(0,0,0,0.06)",
};
const FONT = "'Manrope', system-ui, sans-serif";

// ── Reveal wrapper ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className} style={style}>
      {children}
    </motion.div>
  );
}

// ── Shared text styles ────────────────────────────────────────────────────────
const tagLabel = (color = C.navy): React.CSSProperties => ({
  fontFamily: FONT, fontSize: 11, fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase" as const,
  color, marginBottom: 16, display: "block",
});

const h2: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 800, letterSpacing: "-0.6px",
  lineHeight: 1.12, color: C.black, marginBottom: 20,
};

const bodyText: React.CSSProperties = {
  fontFamily: FONT, fontSize: 17, color: C.muted, lineHeight: 1.7, maxWidth: 440,
};

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { tag: "AI Interview",    headline: "Your patients tell us everything.\nBefore they see you.",    body: "ClinIQ conducts an adaptive AI clinical interview in 22 Indian languages — voice or touch. Patients walk in, and their complete history is already on your screen.",                           img: "/feature-voice.png",    alt: "Patient using ClinIQ" },
  { tag: "Clinical Summary", headline: "Complete SOAP notes.\nBefore the consultation.",             body: "Chief Complaint → HPI → Past History → Medications → Allergies → Family History → Review of Systems. Structured, standardized, ready to edit and approve in one click.",                     img: "/feature-ai.avif",      alt: "Doctor reviewing ClinIQ summary" },
  { tag: "Document AI",     headline: "Old prescriptions?\nWe read those too.",                     body: "Patient snaps a photo of prescriptions, lab reports, or discharge summaries. ClinIQ extracts medications, diagnoses, and lab values automatically. Even handwritten ones.",                   img: "/feature-docs.avif",    alt: "Scanning medical documents" },
  { tag: "Compliance",      headline: "DPDP compliant.\nABDM native.\nZero risk.",                  body: "Built on ABDM/ABHA from day one. FHIR R4 compliant. DPDP Act 2023 audit-ready. Patient consent recorded in their own language. Your clinic stays compliant without effort.",                 img: "/feature-privacy.png",  alt: "Healthcare data compliance" },
];

const STEPS = [
  { n: "01", title: "Patient checks in",        body: "Scans QR at your clinic or opens link from WhatsApp." },
  { n: "02", title: "AI takes the history",     body: "5-8 min voice conversation in patient's language." },
  { n: "03", title: "Documents get scanned",    body: "Old prescriptions + lab reports → digitized instantly." },
  { n: "04", title: "You get the summary",      body: "Structured clinical history on your screen. Edit and approve." },
];

const LANGS = [
  { native: "हिंदी", en: "Hindi" },       { native: "தமிழ்", en: "Tamil" },
  { native: "తెలుగు", en: "Telugu" },     { native: "বাংলা", en: "Bengali" },
  { native: "मराठी", en: "Marathi" },     { native: "ગુજરાતી", en: "Gujarati" },
  { native: "ಕನ್ನಡ", en: "Kannada" },     { native: "മലയാളം", en: "Malayalam" },
  { native: "ਪੰਜਾਬੀ", en: "Punjabi" },    { native: "اردو", en: "Urdu" },
  { native: "ଓଡ଼ିଆ", en: "Odia" },        { native: "অসমীয়া", en: "Assamese" },
  { native: "मैथिली", en: "Maithili" },   { native: "डोगरी", en: "Dogri" },
  { native: "कोंकणी", en: "Konkani" },    { native: "नेपाली", en: "Nepali" },
  { native: "ᱥᱟᱱᱛᱟᱲᱤ", en: "Santali" }, { native: "سنڌي", en: "Sindhi" },
  { native: "संस्कृत", en: "Sanskrit" },  { native: "বোড়ো", en: "Bodo" },
  { native: "মণিপুরী", en: "Manipuri" },  { native: "کشمیری", en: "Kashmiri" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroTextRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lenis: import("lenis").default | null = null;
    async function init() {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      function raf(t: number) { lenis!.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
    init();
    return () => lenis?.destroy();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(heroTextRef.current, { opacity: 0, y: 36 });
    gsap.to(heroTextRef.current, { opacity: 1, y: 0, duration: 1, delay: 0.25, ease: "power3.out" });
    return () => ScrollTrigger.killAll();
  }, []);

  return (
    <div style={{ background: C.white, color: C.black, fontFamily: FONT, overflowX: "hidden" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div className="page-container" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/logo.jpg" alt="ClinIQ" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px", color: C.black }}>
              Clin<span style={{ color: C.teal }}>IQ</span>
            </span>
          </a>

          {/* Nav links — desktop only */}
          <nav className="hide-mobile" style={{ display: "flex", gap: 32 }}>
            {["Features", "For Clinics", "Pricing", "Languages"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: "none" }}>
                {item}
              </a>
            ))}
          </nav>

          {/* CTA buttons — desktop */}
          <div className="hide-mobile" style={{ display: "flex", gap: 8 }}>
            <a href={APP_URL} className="btn-login">Log In ›</a>
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="btn-download">
              Book a Demo
            </a>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="show-mobile"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "none", flexDirection: "column", gap: 5, padding: 6,
            }}>
            <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? C.navy : C.black, transition: "0.2s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? C.navy : C.black, transition: "0.2s", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? C.navy : C.black, transition: "0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div style={{
            position: "absolute", top: 64, left: 0, right: 0,
            background: C.white, borderBottom: `1px solid ${C.border}`,
            padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16,
          }}>
            {["Features", "For Clinics", "Pricing", "Languages"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                onClick={() => setMenuOpen(false)}
                style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.black, textDecoration: "none" }}>
                {item}
              </a>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <a href={APP_URL} className="btn-login" style={{ textAlign: "center" }}>Log In ›</a>
              <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="btn-download" style={{ textAlign: "center" }}>
                Book a Demo
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO — WhatsApp-style rounded card, one screen ──────────────────── */}
      <section style={{ paddingTop: 64, background: C.white }}>
        <div className="hero-container" style={{ paddingTop: 16, paddingBottom: 0 }}>
          {/* Rounded card — fits exactly one screen height */}
          <div style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            height: "calc(100vh - 64px - 16px)",
            minHeight: 420,
            maxHeight: 780,
            display: "flex",
            alignItems: "flex-end",
          }}>
            <Image
              src="/hero.jpg"
              alt="Patient at ClinIQ"
              fill
              priority
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
            />
            {/* Gradient overlay */}
            <div className="hero-overlay" />

            {/* Text — bottom-left, WhatsApp style */}
            <div ref={heroTextRef} className="hero-text-wrap"
              style={{ position: "relative", zIndex: 2, padding: "48px 52px", maxWidth: 560 }}>
              <h1 style={{
                fontFamily: FONT, fontSize: "clamp(36px, 5.5vw, 66px)",
                fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.08,
                color: C.white, marginBottom: 18,
              }}>
                Your patients' story.<br />Before they walk in.
              </h1>
              <p style={{
                fontFamily: FONT, fontSize: "clamp(14px, 1.8vw, 17px)",
                color: "rgba(255,255,255,0.85)", lineHeight: 1.6, marginBottom: 28, maxWidth: 380,
              }}>
                ClinIQ interviews patients in their language, scans their old records, and delivers a complete clinical summary to your screen — before the consultation begins.
              </p>
              <div className="btn-group" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={APP_URL} className="btn-login btn-login-white">Start Free Trial ›</a>
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="btn-download">Book a Demo</a>
              </div>
            </div>

            {/* AI chip — top right inside card */}
            <motion.div className="hero-chip-top"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute", top: 32, right: 36, zIndex: 3,
                background: "rgba(255,255,255,0.96)", borderRadius: 18,
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, maxWidth: 250,
              }}>
              <Image src="/logo.jpg" alt="ClinIQ" width={40} height={40}
                style={{ borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: FONT, fontSize: 10, color: "#999", fontWeight: 600, marginBottom: 3 }}>ClinIQ AI</p>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.black, lineHeight: 1.3 }}>
                  &ldquo;आपको क्या तकलीफ है?&rdquo;
                </p>
              </div>
            </motion.div>
          </div>
          {/* Footnote below card */}
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", marginTop: 10, textAlign: "right" }}>
            * Free for 30 days · No credit card · Works on any device
          </p>
        </div>
      </section>




      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="features" style={{ background: C.white }}>
        <div className="page-container" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <Reveal>
            <p style={tagLabel(C.teal)}>How it works</p>
            <h2 style={{ ...h2, fontSize: "clamp(30px, 4vw, 48px)", maxWidth: 340, marginBottom: 56 }}>
              Setup takes 10 minutes.<br />Each patient takes 5.
            </h2>
          </Reveal>
          <div className="four-col">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.1}>
                <p style={{ fontFamily: FONT, fontSize: 48, fontWeight: 800, color: "rgba(0,0,0,0.06)", lineHeight: 1, marginBottom: 16, letterSpacing: "-2px" }}>{step.n}</p>
                <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.black, marginBottom: 6 }}>{step.title}</p>
                <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      {FEATURES.map((feat, i) => {
        const isEven = i % 2 === 0;
        return (
          <section key={feat.tag} style={{ background: i % 2 === 0 ? C.gray : C.white }}>
            <div className="page-container two-col" style={{ paddingTop: 80, paddingBottom: 80 }}>
              <Reveal className={isEven ? "" : "order-flip"} style={{ order: isEven ? 1 : 2 }}>
                <p style={tagLabel(C.navy)}>{feat.tag}</p>
                <h2 style={{ ...h2, fontSize: "clamp(26px, 3vw, 38px)", whiteSpace: "pre-line" }}>{feat.headline}</h2>
                <p style={bodyText}>{feat.body}</p>
              </Reveal>
              <Reveal delay={0.12} style={{ order: isEven ? 2 : 1 }}>
                <div style={{ aspectRatio: "4/3", borderRadius: 20, overflow: "hidden", position: "relative", background: C.gray }}>
                  <Image src={feat.img} alt={feat.alt} fill style={{ objectFit: "cover" }} />
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

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

      {/* ── LANGUAGES ──────────────────────────────────────────────────────── */}
      <section id="languages" style={{ background: C.navy }}>
        <div className="page-container" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <Reveal>
            <p style={tagLabel("rgba(255,255,255,0.55)")}>Inclusive by design</p>
            <h2 style={{ ...h2, fontSize: "clamp(30px, 4vw, 48px)", color: C.white, maxWidth: 340, marginBottom: 44 }}>
              22 languages.<br />All of them.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {LANGS.map((lang) => (
                <div key={lang.en} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  borderRadius: 9999, padding: "8px 18px", cursor: "default",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#f97316";
                    (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.15)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}>
                  <span style={{ fontSize: 15, color: C.white }}>{lang.native}</span>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{lang.en}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOR CLINICS ────────────────────────────────────────────────────── */}
      <section id="for-clinics" style={{ background: C.white }}>
        <div className="page-container two-col" style={{ paddingTop: 96, paddingBottom: 96, alignItems: "stretch" }}>
          <Reveal>
            <p style={tagLabel(C.teal)}>For Clinics & Hospitals</p>
            {/* Consistent large heading — each sentence locked to one line with nowrap */}
            <h2 style={{ ...h2, fontSize: "clamp(26px, 3vw, 40px)", maxWidth: 420, marginBottom: 36 }}>
              <span style={{ display: "block", whiteSpace: "nowrap" }}>See more patients.</span>
              <span style={{ display: "block", whiteSpace: "nowrap" }}>With better outcomes.</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { icon: "⚡", title: "2-3x more patients/day",  body: "Doctors spend zero time on history-taking. Every minute goes to diagnosis and care." },
                { icon: "📊", title: "Doctor dashboard",         body: "Review, edit, and approve patient summaries from one clean screen. Mobile-friendly." },
                { icon: "💰", title: "Instant ROI",              body: "Starts at ₹2,000/month. Cost per patient: under ₹2. Pays for itself in the first week." },
                { icon: "📵", title: "Works offline",            body: "No internet? No problem. ClinIQ runs locally and syncs when connected." },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.black, marginBottom: 3 }}>{item.title}</p>
                    <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Hospital image stretches full height */}
          <Reveal delay={0.12} style={{ display: "flex" }}>
            <div style={{ borderRadius: 20, overflow: "hidden", position: "relative", flex: 1, minHeight: 380 }}>
              <Image src="/hospital.jpg" alt="Clinic OPD" fill style={{ objectFit: "cover" }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background: C.gray, borderTop: `1px solid ${C.border}` }}>
        <div className="page-container" style={{ paddingTop: 96, paddingBottom: 96, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Reveal>
            <h2 style={{ fontFamily: FONT, fontSize: "clamp(34px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.08, color: C.black, marginBottom: 14 }}>
              Ready to see more patients?
            </h2>
            {/* Subtitle — 1 line on desktop, wraps naturally on mobile */}
            <p className="cta-subtitle" style={{ fontFamily: FONT, fontSize: 17, color: C.muted, lineHeight: 1.5, marginBottom: 36, whiteSpace: "nowrap" }}>
              Free for 30 days. No credit card. Setup in 10 minutes.
            </p>
            <div className="btn-group" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <a href={APP_URL} className="btn-login btn-login-lg">Start Free Trial ›</a>
              <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="btn-download btn-download-lg">
                Book a Demo
              </a>
            </div>
            <p style={{ fontFamily: FONT, fontSize: 12, color: "#bbb", marginTop: 18 }}>
              Works on any tablet, phone, or desktop · No hardware required
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.white }}>
        <div className="page-container footer-bottom" style={{
          paddingTop: 22, paddingBottom: 26,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 16,
        }}>
          {/* Left — logo + ClinIQ name */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Image src="/logo.jpg" alt="ClinIQ" width={26} height={26} style={{ borderRadius: 7, objectFit: "cover" }} />
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: C.black }}>
              Clin<span style={{ color: C.teal }}>IQ</span>
            </span>
          </a>

          {/* Center — copyright */}
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#aaa", fontWeight: 500, textAlign: "center", whiteSpace: "nowrap" }}>
            © 2026 ClinIQ Health Technologies
          </p>

          {/* Right — team credit */}
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#aaa", textAlign: "right", whiteSpace: "nowrap" }}>
            <a href="mailto:hello@cliniq.health" style={{ color: C.teal, textDecoration: "none", fontWeight: 600 }}>hello@cliniq.health</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
