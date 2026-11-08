"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { WebGLErrorBoundary } from "@/components/WebGLErrorBoundary";
import { StackingFeatures } from "@/components/StackingFeatures";
import { InteractiveSoapSandbox } from "@/components/InteractiveSoapSandbox";

// ── Dynamic 3D import — no SSR, shows placeholder while loading ──────────────
const Hero3DGlass = dynamic(() => import("@/components/Hero3DGlass"), {
  ssr: false,
  loading: () => <div className="hero-3d-placeholder" aria-label="Loading ClinIQ visualisation" />,
});

// ── Constants ────────────────────────────────────────────────────────────────
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.cliniq.mayankcodes.dev";
const DEMO_URL = "mailto:hello@cliniq.health";
const FONT     = "'Manrope', system-ui, sans-serif";

// ── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-72px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Inline SVG icons (1.5px stroke, no emojis) ───────────────────────────────
function IconThroughput() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}
function IconConsole() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
      <path d="M6 9l3 3-3 3" />
      <path d="M13 15h3" />
    </svg>
  );
}
function IconDualMode() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l5 3" />
      <path d="M3.6 15h16.8" />
    </svg>
  );
}
function IconOffline() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0114.08 0" />
      <path d="M1.42 9a16 16 0 0121.16 0" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <circle cx="12" cy="20" r="1" fill="#C2410C" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,7 5.5,10.5 12,3.5" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

// ── Workflow steps data ──────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    tag: "QR & WHATSAPP CHECK-IN",
    headline: "Patient checks in from their own phone.",
    body: "Front desk shares a QR code or WhatsApp link at reception. No app download, no account creation — the patient is ready in seconds.",
  },
  {
    num: "02",
    tag: "AI VOICE TRIAGE + OCR",
    headline: "ClinIQ listens and reads.",
    body: "An adaptive clinical interview in the patient's own language — voice or touch — plus instant OCR extraction of prescriptions and lab reports.",
  },
  {
    num: "03",
    tag: "1-CLICK SOAP & RX",
    headline: "Physician approves the structured record.",
    body: "A complete SOAP note, ICD-10 mapping, drug-interaction check, and prior-medication summary arrive on the doctor's screen before the patient walks in.",
  },
];

// ── Bento clinic cards ───────────────────────────────────────────────────────
const CLINIC_CARDS = [
  {
    icon: <IconThroughput />,
    iconBg: "#EFF6FF",
    stat: "2–3×",
    label: "OPD throughput",
    body: "Structured history ready before the consultation frees the physician from intake scribing.",
  },
  {
    icon: <IconConsole />,
    iconBg: "#F0FDFA",
    stat: "1-screen",
    label: "Doctor console",
    body: "CC, HPI, medications, allergies, and scanned records on a single physician-facing card.",
  },
  {
    icon: <IconDualMode />,
    iconBg: "#F5F3FF",
    stat: "Dual-mode",
    label: "Allopathy + AYUSH",
    body: "Clinical interview and SOAP templates tuned for both conventional and AYUSH care pathways.",
  },
  {
    icon: <IconOffline />,
    iconBg: "#FFF7ED",
    stat: "Offline-ready",
    label: "Resilience built-in",
    body: "Captured patient data syncs when connectivity returns — built for India's real infrastructure.",
  },
];

// ── Pilot benefits ───────────────────────────────────────────────────────────
const PILOT_BENEFITS = [
  "Zero hardware required — works on any phone or tablet",
  "Deployed in under 10 minutes with QR onboarding",
  "Full SOAP, ICD-10, DPDP Act 2023 & ABDM-aligned",
  "Direct product feedback channel with the founding team",
];

// ── WebGL fallback HUD ───────────────────────────────────────────────────────
function HeroFallback() {
  return (
    <div
      className="hero-3d-placeholder"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center,rgba(2,132,199,0.07),transparent 68%)",
      }}
    >
      <div className="telemetry-card" style={{ position: "static", width: 268 }}>
        <div className="telemetry-heading">
          <span className="telemetry-heart" aria-hidden="true">♥</span>
          <span>LIVE PATIENT SIGNAL</span>
        </div>
        <div className="telemetry-value">
          <strong>79</strong><span>BPM</span>
        </div>
        <svg className="ecg-wave" viewBox="0 0 280 48" role="img" aria-label="ECG waveform">
          <polyline className="ecg-line" points="0,27 32,27 43,27 51,11 59,39 67,27 94,27 105,27 113,19 119,32 126,27 157,27 168,27 178,7 187,42 196,27 225,27 237,27 247,17 254,34 263,27 280,27" />
        </svg>
        <div className="telemetry-footer">
          <span>Stable rhythm</span><span className="telemetry-dot" /><span>Encrypted</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    ["Features",     "#features"],
    ["Live Demo",    "#demo"],
    ["How It Works", "#how-it-works"],
    ["For Clinics",  "#for-clinics"],
    ["Pilot",        "#pilot"],
  ];

  return (
    <main
      className="landing-page"
      style={{ fontFamily: FONT, background: "#FFFFFF" }}
    >
      {/* ════════════════════════════════════════════════════════════
          FLOATING FROSTED-GLASS PILL HEADER
      ════════════════════════════════════════════════════════════ */}
      <header className="site-header">
        <div className="nav-pill">
          {/* Wordmark */}
          <a href="#hero" className="brand-wordmark">
            Cliniq<span>.</span>
          </a>

          {/* Centre nav */}
          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks.map(([label, href]) => (
              <a key={label} href={href}>{label}</a>
            ))}
          </nav>

          {/* CTA */}
          <a href={APP_URL} className="btn-primary-pill" style={{ fontSize: 12, minHeight: 40, padding: "0 18px" }}>
            Try Cliniq ↗
          </a>

          {/* Mobile burger */}
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navLinks.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <a href={APP_URL} className="btn-primary-pill" style={{ textAlign: "center" }}>
              Try Cliniq ↗
            </a>
          </nav>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════
          HERO — Pure white, 2-column grid
      ════════════════════════════════════════════════════════════ */}
      <section id="hero" className="hero-section">
        <div className="page-container hero-grid">

          {/* Left: copy */}
          <Reveal className="hero-copy">
            {/* Eyebrow pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#F0FDFA", border: "1px solid #99F6E4",
              borderRadius: 9999, padding: "6px 14px", marginBottom: 24,
            }}>
              <span style={{
                display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                background: "#16A34A",
                boxShadow: "0 0 0 2px rgba(22,163,74,0.25)",
                animation: "hero-dot-pulse 2.2s ease-in-out infinite",
              }} />
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#0D9488",
                fontFamily: "'Courier New', monospace",
              }}>
                PATIENTS FIRST · TECHNOLOGY FOR BETTER CARE
              </span>
            </div>

            <h1>
              Your patients&apos; story.<br />
              <span style={{ color: "#0284C7" }}>Before</span> they walk in.
            </h1>

            <p className="hero-subcopy">
              ClinIQ interviews patients in their language, scans their old records,
              and delivers a complete clinical summary to your screen — before the
              consultation begins.
            </p>

            <div className="hero-actions">
              <a href="#pilot" className="btn-primary-pill" style={{ minHeight: 50, padding: "0 28px", fontSize: 14 }}>
                Start Pilot Trial ↗
              </a>
              <a href={DEMO_URL} className="btn-glass-pill" style={{ minHeight: 50, padding: "0 24px", fontSize: 14 }}>
                Book a Demo
              </a>
            </div>

            {/* Monospace footnote */}
            <p style={{
              marginTop: 24, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              color: "#94A3B8", fontFamily: "'Courier New', monospace",
              textTransform: "uppercase",
            }}>
              22 INDIAN LANGUAGES · &lt;600MS GROQ LPU · ZERO CLINIC HARDWARE
            </p>
          </Reveal>

          {/* Right: 3D hero */}
          <Reveal className="hero-visual" delay={0.14}>
            <WebGLErrorBoundary fallback={<HeroFallback />}>
              <Hero3DGlass />
            </WebGLErrorBoundary>
          </Reveal>
        </div>

        <div className="scroll-cue">Scroll to explore <span>↓</span></div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS — 3-Step architectural cards
      ════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: "108px 0", background: "#FFFFFF" }}>
        <div className="page-container">
          <Reveal>
            <p className="eyebrow">A calmer front door to care</p>
            <h2 className="section-title">
              Setup takes 10 minutes.<br />Each patient takes 5.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {STEPS.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.1}>
                <div style={{
                  background: "#F8FAFC",
                  border: "1px solid rgba(15,23,42,0.07)",
                  borderRadius: 24,
                  padding: "32px 28px 28px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      fontSize: 11, fontFamily: "'Courier New', monospace",
                      fontWeight: 800, letterSpacing: "0.1em", color: "#CBD5E1",
                    }}>
                      {step.num}
                    </span>
                    <span style={{
                      fontSize: 9, fontFamily: "'Courier New', monospace",
                      fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "#94A3B8",
                    }}>
                      {step.tag}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: 18, fontWeight: 800, letterSpacing: "-0.04em",
                    lineHeight: 1.18, color: "#0F172A",
                  }}>
                    {step.headline}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.72, color: "#475569", flex: 1 }}>
                    {step.body}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0284C7", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                    Learn more <IconArrow />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          ENHANCED STACKING CARDS
      ════════════════════════════════════════════════════════════ */}
      <section id="features" style={{ background: "#FFFFFF", padding: "0 0 80px" }}>
        <div className="page-container" style={{ paddingTop: 108, paddingBottom: 56 }}>
          <Reveal>
            <p className="eyebrow" style={{ color: "#0284C7" }}>One workflow. Every patient story.</p>
            <h2 className="section-title" style={{ maxWidth: 740 }}>
              Give your team more context<br />before the clock starts.
            </h2>
          </Reveal>
        </div>
        {/* Full-bleed scroll zone — no page-container so cards can be wide */}
        <div style={{ width: "min(1120px, calc(100% - 48px))", margin: "0 auto" }}>
          <StackingFeatures />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          INTERACTIVE LANGUAGE SANDBOX
      ════════════════════════════════════════════════════════════ */}
      <div id="demo">
        <InteractiveSoapSandbox />
      </div>

      {/* ════════════════════════════════════════════════════════════
          FOR CLINICS & HOSPITALS — 4-card SVG bento
      ════════════════════════════════════════════════════════════ */}
      <section id="for-clinics" style={{ background: "#0F172A", padding: "108px 0" }}>
        <div className="page-container">
          <Reveal>
            <p className="eyebrow light-eyebrow">For clinics and care teams</p>
            <h2 className="section-title light-title" style={{ maxWidth: 620 }}>
              Less documentation drag.<br />More human attention.
            </h2>
          </Reveal>

          {/* 2×2 bento grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 56 }}>
            {CLINIC_CARDS.map((card, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 24,
                  padding: "32px 32px 28px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 44, height: 44, borderRadius: 12,
                    background: card.iconBg,
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{
                      fontSize: "clamp(28px,3vw,42px)", fontWeight: 800,
                      letterSpacing: "-0.07em", color: "white", lineHeight: 1,
                    }}>{card.stat}</p>
                    <p style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
                      marginTop: 4, fontFamily: "'Courier New', monospace",
                    }}>{card.label}</p>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.68, color: "rgba(255,255,255,0.6)", flex: 1 }}>
                    {card.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Proof stats bar */}
          <Reveal>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4,1fr)",
              gap: 1, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              background: "rgba(255,255,255,0.1)",
            }}>
              {[
                ["22", "patient languages"],
                ["5–8 min", "per intake"],
                ["<10 min", "clinic setup"],
                ["1 card", "clinical record"],
              ].map(([stat, label]) => (
                <div key={label} style={{
                  padding: "30px 28px",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  background: "rgba(255,255,255,0.04)",
                }}>
                  <strong style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.09em", lineHeight: 1, color: "white" }}>{stat}</strong>
                  <span style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PRE-REVENUE PILOT INVITATION
      ════════════════════════════════════════════════════════════ */}
      <section id="pilot" style={{ background: "#F8FAFC", padding: "108px 0" }}>
        <div className="page-container">
          <Reveal>
            <div style={{
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.07)",
              borderRadius: 36,
              padding: "clamp(36px,5vw,72px)",
              boxShadow: "0 8px 48px rgba(15,23,42,0.06)",
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: 48,
              alignItems: "stretch",
            }}>
              {/* Left: copy */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <p style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#0D9488",
                  fontFamily: "'Courier New', monospace", marginBottom: 20,
                }}>
                  EARLY CLINICAL PILOT COHORT · 2026
                </p>
                <h2 style={{
                  fontSize: "clamp(28px,4vw,52px)", fontWeight: 800,
                  letterSpacing: "-0.065em", lineHeight: 1.06,
                  color: "#0F172A", marginBottom: 20,
                }}>
                  Spend your consultation looking at your patient, not your keyboard.
                </h2>
                <p style={{
                  fontSize: 17, lineHeight: 1.75, color: "#475569", marginBottom: 12,
                  fontWeight: 500, maxWidth: 520,
                }}>
                  Currently onboarding select partner clinics and hospitals for our
                  zero-cost 30-day clinical pilot. Works on any phone, tablet, or desktop.
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.72, color: "#64748B", marginBottom: 36, maxWidth: 500 }}>
                  Help shape the next generation of pre-consultation intelligence with
                  your clinicians, your patients, and your real workflow.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <a href={APP_URL} className="btn-primary-pill" style={{ minHeight: 50, padding: "0 28px", fontSize: 14 }}>
                    Launch ClinIQ App ↗
                  </a>
                  <a href={DEMO_URL} className="btn-glass-pill" style={{ minHeight: 50, padding: "0 24px", fontSize: 14 }}>
                    Apply for Clinic Pilot
                  </a>
                </div>
              </div>

              {/* Right: benefits list */}
              <div style={{
                background: "#F8FAFC",
                border: "1px solid rgba(15,23,42,0.07)",
                borderRadius: 24,
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                alignSelf: "center",
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#0D9488",
                  fontFamily: "'Courier New', monospace", marginBottom: 20,
                }}>
                  WHAT PARTNER CLINICS RECEIVE
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                  {PILOT_BENEFITS.map((b, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#F0FDF4", border: "1px solid #86EFAC", flexShrink: 0, marginTop: 2,
                      }}>
                        <IconCheck />
                      </span>
                      <span style={{ fontSize: 14, lineHeight: 1.6, color: "#334155", fontWeight: 500 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          MINIMALIST WHITE FOOTER
      ════════════════════════════════════════════════════════════ */}
      <footer style={{
        background: "#0F172A",
        padding: "52px 0",
        color: "rgba(255,255,255,0.5)",
      }}>
        <div className="page-container" style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          alignItems: "center",
          gap: 36,
        }}>
          <div>
            <a href="#hero" style={{
              fontSize: 20, fontWeight: 800, letterSpacing: "-0.07em",
              color: "white", textDecoration: "none", display: "inline-block", marginBottom: 8,
            }}>
              Cliniq<span style={{ color: "#0284C7" }}>.</span>
            </a>
            <p style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 300 }}>
              Pre-consultation intelligence for every clinic.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 22 }}>
            {[
              ["Features", "#features"],
              ["For Clinics", "#for-clinics"],
              ["Pilot Program", "#pilot"],
              ["Contact", DEMO_URL],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700,
                textDecoration: "none", transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "white")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 11, textAlign: "right", whiteSpace: "nowrap" }}>
            © 2026 ClinIQ Health Technologies<br />
            <a href="mailto:hello@cliniq.health" style={{ color: "#0284C7", textDecoration: "none" }}>
              hello@cliniq.health
            </a>
          </p>
        </div>
      </footer>

      {/* ── Keyframe for eyebrow dot ── */}
      <style>{`
        @keyframes hero-dot-pulse {
          0%,100% { box-shadow: 0 0 0 2px rgba(22,163,74,0.25); }
          50%      { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
        }
        @media (max-width: 820px) {
          .mobile-nav { display: flex !important; }
        }
        @media (max-width: 680px) {
          #how-it-works .page-container > div { grid-template-columns: 1fr !important; }
          #for-clinics .page-container > div:first-of-type { grid-template-columns: 1fr !important; }
          #pilot .page-container > div > div { grid-template-columns: 1fr !important; }
          #pilot .page-container > div > div > div:last-child { display: none; }
        }
      `}</style>
    </main>
  );
}
