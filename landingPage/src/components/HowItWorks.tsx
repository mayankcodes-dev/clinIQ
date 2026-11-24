"use client";

import { useState, useEffect, useRef } from "react";

interface Step {
  num: string;
  headline: string;
  body: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    num: "01",
    headline: "Patient checks in from their phone.",
    body: "QR code or WhatsApp link at reception. No app download, no form filling. Works on any device.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={30} height={30}>
        <rect x="6" y="6" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.2"/>
        <rect x="28" y="6" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.2"/>
        <rect x="6" y="28" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M28 28h4M36 28h6M28 36h2M34 36h2M38 36h4M28 42h6M38 42h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="9" y="9" width="8" height="8" rx="1.5" fill="currentColor" opacity=".3"/>
        <rect x="31" y="9" width="8" height="8" rx="1.5" fill="currentColor" opacity=".3"/>
        <rect x="9" y="31" width="8" height="8" rx="1.5" fill="currentColor" opacity=".3"/>
      </svg>
    ),
  },
  {
    num: "02",
    headline: "ClinIQ listens and understands.",
    body: "An adaptive voice interview in the patient's language. CPQRST-guided questions, plus instant OCR of uploaded prescriptions.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={30} height={30}>
        <circle cx="24" cy="20" r="10" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M14 38c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="24" cy="20" r="3.5" fill="currentColor" opacity=".3"/>
        <path d="M18 20h2M28 20h2M24 16v2M24 22v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "03",
    headline: "Physician approves the record.",
    body: "Full SOAP note, ICD-10 mapping, and drug-interaction check delivered before the patient walks in. One tap to approve.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={30} height={30}>
        <rect x="8" y="6" width="28" height="36" rx="5" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="34" cy="34" r="8" fill="white" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M30 34l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(2);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!autoPlay || isMobile) return;
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, isMobile]);

  const handleInteract = (idx: number) => {
    setActive(idx);
    setAutoPlay(false);
  };

  return (
    <section
      id="how-it-works"
      style={{
        position: "relative",
        // On desktop: full-screen. On mobile: auto height so content breathes
        minHeight: isMobile ? "auto" : "100vh",
        overflow: "hidden",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "80px 0 72px" : "0",
      }}
    >
      {/* bg blobs — desktop only */}
      {!isMobile && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{
            position: "absolute", width: "50vw", height: "50vw", borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(2,132,199,0.05) 0%, transparent 70%)",
            top: "-10%", left: "-5%",
            animation: "hiw-blob-a 18s ease-in-out infinite alternate",
          }} />
          <div style={{
            position: "absolute", width: "40vw", height: "40vw", borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(13,148,136,0.04) 0%, transparent 70%)",
            bottom: "0%", right: "0%",
            animation: "hiw-blob-a 14s ease-in-out infinite alternate-reverse",
          }} />
        </div>
      )}

      {/* max-width container */}
      <div style={{
        position: "relative", zIndex: 2,
        width: "min(1160px, calc(100% - 32px))",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isMobile ? 40 : 56,
      }}>

        {/* heading */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            color: "#0F172A",
            fontSize: "clamp(32px, 5vw, 64px)",
            fontWeight: 800, letterSpacing: "-0.07em", lineHeight: 1.02,
            margin: 0,
          }}>
            Setup in 10 min.
            <br />
            <span style={{ color: "#94A3B8" }}>Each patient in 5.</span>
          </h2>
        </div>

        {/* cards — grid on desktop, accordion-style stack on mobile */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                onClick={() => handleInteract(i)}
                style={{
                  padding: "28px 24px 32px",
                  borderRadius: 20,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.90)",
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 2px 12px -4px rgba(15,23,42,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  position: "relative",
                }}
              >
                {/* always-visible top accent bar */}
                <div style={{
                  position: "absolute", top: 0, left: 24, right: 24, height: 2,
                  background: "linear-gradient(90deg, transparent, #0284C7, transparent)",
                  borderRadius: "0 0 2px 2px",
                }} />

                {/* icon + step num */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ color: "#0284C7" }}>{step.icon}</div>
                  <span style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#0284C7",
                  }}>
                    {step.num}
                  </span>
                </div>

                <h3 style={{
                  fontSize: 18, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.2,
                  color: "#0F172A", marginBottom: 10,
                }}>
                  {step.headline}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "#475569", margin: 0 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              width: "100%",
            }}>
              {STEPS.map((step, i) => {
                const isActive = i === active;
                return (
                  <div
                    key={step.num}
                    onClick={() => handleInteract(i)}
                    onMouseEnter={() => handleInteract(i)}
                    style={{
                      position: "relative",
                      padding: "36px 32px 40px",
                      borderRadius: 24,
                      cursor: "pointer",
                      background: isActive ? "rgba(255,255,255,0.90)" : "rgba(248,250,252,0.6)",
                      backdropFilter: "blur(16px) saturate(1.8)",
                      WebkitBackdropFilter: "blur(16px) saturate(1.8)",
                      border: `1px solid ${isActive ? "rgba(2,132,199,0.18)" : "rgba(15,23,42,0.06)"}`,
                      boxShadow: isActive
                        ? "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px -8px rgba(2,132,199,0.14), 0 20px 48px -12px rgba(15,23,42,0.08)"
                        : "inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 12px -4px rgba(15,23,42,0.06)",
                      transition: "all 0.38s cubic-bezier(0.16,1,0.3,1)",
                      transform: isActive ? "translateY(-3px)" : "translateY(0)",
                      display: "flex", flexDirection: "column", gap: 0,
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: "absolute", top: 0, left: 24, right: 24, height: 2,
                        background: "linear-gradient(90deg, transparent, #0284C7, transparent)",
                        borderRadius: "0 0 2px 2px",
                      }} />
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                      <div style={{ color: isActive ? "#0284C7" : "rgba(15,23,42,0.18)", transition: "color 0.35s ease" }}>
                        {step.icon}
                      </div>
                      <span style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                        color: isActive ? "#0284C7" : "rgba(15,23,42,0.15)",
                        transition: "color 0.35s ease",
                      }}>
                        {step.num}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: "clamp(16px,1.5vw,21px)",
                      fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.18,
                      color: isActive ? "#0F172A" : "rgba(15,23,42,0.22)",
                      marginBottom: 14,
                      transition: "color 0.35s ease",
                    }}>
                      {step.headline}
                    </h3>

                    <p style={{
                      fontSize: 14, lineHeight: 1.75,
                      color: isActive ? "#475569" : "rgba(15,23,42,0.18)",
                      margin: 0,
                      transition: "color 0.35s ease",
                    }}>
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* progress dots — desktop only */}
            <div style={{ display: "flex", gap: 8 }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => handleInteract(i)}
                  onMouseEnter={() => handleInteract(i)}
                  style={{
                    width: active === i ? 28 : 8, height: 8,
                    borderRadius: 999, cursor: "pointer",
                    background: active === i ? "#0284C7" : "rgba(15,23,42,0.12)",
                    transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes hiw-blob-a {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(4%,6%) scale(1.08); }
        }
      `}</style>
    </section>
  );
}

export default HowItWorks;
