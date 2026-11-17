"use client";

import { useState } from "react";
import { StackingFeatures } from "@/components/StackingFeatures";
import { HowItWorks } from "@/components/HowItWorks";
import { SiteFooter } from "@/components/SiteFooter";
import { FooterScrollWrapper } from "@/components/FooterScrollWrapper";

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.cliniq.mayankcodes.dev";
const DEMO_URL = "mailto:admin@mayankcodes.dev";

// ── Languages ──────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { native: "हिन्दी",     label: "Hindi" },
  { native: "বাংলা",      label: "Bengali" },
  { native: "తెలుగు",    label: "Telugu" },
  { native: "मराठी",     label: "Marathi" },
  { native: "தமிழ்",    label: "Tamil" },
  { native: "اردو",       label: "Urdu" },
  { native: "ગુજરાતી",  label: "Gujarati" },
  { native: "ಕನ್ನಡ",    label: "Kannada" },
  { native: "ओड़िआ",    label: "Odia" },
  { native: "മലയാളം",   label: "Malayalam" },
  { native: "ਪੰਜਾਬੀ",   label: "Punjabi" },
  { native: "অসমীয়া",  label: "Assamese" },
  { native: "मैथिली",    label: "Maithili" },
  { native: "संस्कृत",   label: "Sanskrit" },
  { native: "کٲشُر",      label: "Kashmiri" },
  { native: "سنڌي",       label: "Sindhi" },
  { native: "कोंकणी",   label: "Konkani" },
  { native: "মণিপুরী",  label: "Manipuri" },
  { native: "नेपाली",    label: "Nepali" },
  { native: "ᱥᱟᱱᱛᱟᱲᱤ", label: "Santali" },
  { native: "बड़ो",      label: "Bodo" },
  { native: "डोगरी",     label: "Dogri" },
];

// ── Page content (everything above footer) ─────────────────────────────────────
function PageContent({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const navLinks = [
    ["Features",     "#features"],
    ["Languages",    "#languages"],
    ["How It Works", "#how-it-works"],
    ["Pilot",        "#pilot"],
  ];

  return (
    <div style={{ fontFamily: "'Manrope', system-ui, sans-serif", background: "#FFFFFF" }}>

      {/* ── NAVBAR ── */}
      <header className="site-header">
        <div className="nav-pill">
          <a href="#hero" className="brand-wordmark">Cliniq<span>.</span></a>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </nav>
          <a href={APP_URL} className="btn-primary-pill" style={{ fontSize:12, minHeight:40, padding:"0 18px" }}>
            Try Cliniq ↗
          </a>
          <button className="mobile-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navLinks.map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <a href={APP_URL} className="btn-primary-pill" style={{ textAlign:"center" }}>Try Cliniq ↗</a>
          </nav>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="hero" className="hero-section">
        <div className="hero-wave-bg" aria-hidden="true">
          <svg className="wave-svg wave-svg-1" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,160 C240,240 480,80 720,160 C960,240 1200,80 1440,160 L1440,320 L0,320 Z" />
          </svg>
          <svg className="wave-svg wave-svg-2" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,200 C200,120 440,280 720,200 C1000,120 1240,260 1440,180 L1440,320 L0,320 Z" />
          </svg>
          <svg className="wave-svg wave-svg-3" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,240 C180,160 360,300 600,240 C840,180 1080,310 1440,220 L1440,320 L0,320 Z" />
          </svg>
        </div>

        <div className="page-container hero-center">
          <h1 className="hero-h1">
            Your patients&apos; story.<br />
            <span style={{ color:"#0284C7" }}>Before</span> they walk in.
          </h1>
          <p className="hero-subcopy">
            ClinIQ interviews patients in their language, scans their records,
            and delivers a full clinical summary before the consultation begins.
          </p>
          <div className="hero-actions">
            <a href="#pilot" className="btn-primary-pill" style={{ minHeight:50, padding:"0 32px", fontSize:14 }}>
              Start Pilot Trial ↗
            </a>
            <a href={DEMO_URL} className="btn-glass-pill" style={{ minHeight:50, padding:"0 26px", fontSize:14 }}>
              Book a Demo
            </a>
          </div>
        </div>

        <div className="hero-bottom-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,80 L0,80 Z" fill="#FFFFFF" />
          </svg>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── STACKING FEATURES ── */}
      <section id="features" className="white-bg" style={{ padding:"0 0 80px" }}>
        <div className="page-container section-pad-top">
          <h2 className="section-h2" style={{ maxWidth:740 }}>More context.<br />Before the clock starts.</h2>
        </div>
        <div style={{ width:"min(1120px, calc(100% - 48px))", margin:"0 auto" }}>
          <StackingFeatures />
        </div>
      </section>

      {/* ── 22 LANGUAGES ── */}
      <section id="languages" className="dark-section">
        <div className="page-container">
          <h2 className="dark-h2">22 languages.<br />One clinical voice.</h2>
          <p className="dark-subcopy">
            ClinIQ conducts patient interviews natively in each language — voice and text — without translation intermediaries.
          </p>
          <div className="lang-grid">
            {LANGUAGES.map((lang) => (
              <div key={lang.label} className="lang-chip glass-dark">
                <span className="lang-native">{lang.native}</span>
                <span className="lang-label">{lang.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PILOT ── */}
      <section id="pilot" className="pilot-section" style={{ borderRadius: "0 0 48px 48px" }}>
        <div className="pilot-depth-blob pilot-blob-1" aria-hidden="true" />
        <div className="pilot-depth-blob pilot-blob-2" aria-hidden="true" />
        <div className="page-container pilot-center">
          <h2 className="pilot-h2">
            Spend your consultation<br />
            looking at your patient,<br />
            not your keyboard.
          </h2>
          <p className="pilot-body">
            Zero-cost 30-day pilot for select clinics and hospitals.<br />
            Works on any phone, tablet, or desktop. No hardware needed.
          </p>
          <button
            type="button"
            onClick={() => {
              const subject = encodeURIComponent("ClinIQ Clinic Pilot Application");
              const body = encodeURIComponent(
`Hi ClinIQ Team,

I'd like to apply for the Early Clinical Pilot Program.

Clinic / Hospital Name: 
City & State: 
Specialty / Department: 
Average daily OPD volume: 
Your Name & Designation: 
Contact Number: 

Any specific requirements or questions:


Looking forward to hearing from you.`
              );
              window.location.href = `mailto:admin@mayankcodes.dev?subject=${subject}&body=${body}`;
            }}
            className="btn-primary-pill"
            style={{ minHeight:52, padding:"0 36px", fontSize:15, border:"none", cursor:"pointer" }}
          >
            Apply for Clinic Pilot ↗
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width:820px) {
          .pilot-glassy-card { grid-template-columns:1fr !important; }
          .pilot-benefits-card { display:none !important; }
          .lang-stats-strip { flex-direction:column; gap:20px !important; }
        }
        @media (max-width:520px) {
          .hero-actions { flex-direction:column; }
          .hero-actions a { width:100%; text-align:center; }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-page">
      <FooterScrollWrapper
        footer={<SiteFooter />}
      >
        <PageContent menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </FooterScrollWrapper>
    </main>
  );
}
