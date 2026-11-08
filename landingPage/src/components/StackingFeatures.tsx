"use client";

/**
 * StackingFeatures — Scroll-driven sticky dossier-stack deck
 *
 * Mechanics:
 *  - Each card is position:sticky with progressive top offset
 *    so the 32px header strip of buried cards stays visible (medical dossier look)
 *  - A single rAF-based scroll listener on the outer container drives
 *    scroll progress (0→1) per card — no heavy deps
 *  - Cards scale down + dim as the next card approaches
 *  - Incoming card casts an upward shadow
 *  - 2-column layout: copy left, visual + clinical UI overlay right
 */

import { useEffect, useRef, useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface CardData {
  index: number;           // 1-based for display
  tag: string;
  metric: string;          // monospace pill top-right
  headline: string;
  body: string;
  bullets: [string, string];
  image: string;
  imageAlt: string;
  accentColor: string;     // tag pill bg
  accentText: string;      // tag pill text
  overlay: React.ReactNode;
}

// ─── Overlay micro-UIs ────────────────────────────────────────────────────────

function OverlayVoice() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(15,23,42,0.07)",
      borderRadius: 16,
      padding: "14px 16px",
      boxShadow: "0 8px 32px rgba(15,23,42,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minWidth: 220,
    }}>
      {/* Voice bubble */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
        <span style={{
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          width:28, height:28, borderRadius:"50%",
          background:"linear-gradient(135deg,#0284C7,#0D9488)",
          flexShrink:0, fontSize:13,
        }}>🎙️</span>
        <div style={{
          background:"#F0F9FF",
          border:"1px solid #BAE6FD",
          borderRadius:"4px 12px 12px 12px",
          padding:"8px 12px",
          fontSize:12,
          color:"#0F172A",
          fontWeight:500,
          lineHeight:1.5,
        }}>
          मुझे 3 दिन से तेज़ बुखार<br />और सिरदर्द है
        </div>
      </div>
      {/* Arrow + result */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{
          flex:1, height:1,
          background:"linear-gradient(90deg, #BAE6FD, #0284C7)",
        }} />
        <span style={{ fontSize:10, color:"#0284C7", fontWeight:700 }}>ClinIQ AI</span>
        <span style={{
          flex:1, height:1,
          background:"linear-gradient(90deg, #0284C7, #BAE6FD)",
        }} />
      </div>
      <div style={{
        background:"#F0FDF4",
        border:"1px solid #86EFAC",
        borderRadius:8,
        padding:"7px 12px",
        fontSize:11,
        color:"#166534",
        fontWeight:700,
        fontFamily:"'Courier New', monospace",
        letterSpacing:"0.01em",
      }}>
        → Acute febrile illness ×3d
      </div>
    </div>
  );
}

function OverlaySoap() {
  const rows: [string, string][] = [
    ["CC",        "High fever + headache, 3 days"],
    ["HPI",       "Sudden onset, no rigors, no rash"],
    ["Allergies", "None reported"],
    ["ICD-10",    "R50.9 — Fever, unspecified"],
  ];
  return (
    <div style={{
      background:"rgba(255,255,255,0.93)",
      backdropFilter:"blur(16px)",
      border:"1px solid rgba(15,23,42,0.07)",
      borderRadius:16,
      padding:"14px 16px",
      boxShadow:"0 8px 32px rgba(15,23,42,0.08)",
      minWidth:230,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:9, fontWeight:800, color:"#64748B", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"monospace" }}>SOAP NOTE</span>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:4,
          background:"#F0FDF4", border:"1px solid #86EFAC",
          borderRadius:999, padding:"3px 10px",
          fontSize:10, fontWeight:700, color:"#166534",
        }}>✓ Approve Note</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {rows.map(([k,v]) => (
          <div key={k} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{
              fontSize:9, fontWeight:800, color:"#0284C7",
              letterSpacing:"0.08em", textTransform:"uppercase",
              fontFamily:"monospace", minWidth:52, paddingTop:1,
            }}>{k}</span>
            <span style={{ fontSize:11, color:"#0F172A", fontWeight:500, lineHeight:1.45 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverlayOcr() {
  return (
    <div style={{
      background:"rgba(255,255,255,0.93)",
      backdropFilter:"blur(16px)",
      border:"1px solid rgba(15,23,42,0.07)",
      borderRadius:16,
      padding:"14px 16px",
      boxShadow:"0 8px 32px rgba(15,23,42,0.08)",
      minWidth:230,
      display:"flex",
      flexDirection:"column",
      gap:10,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:16 }}>📄</span>
        <span style={{ fontSize:9, fontWeight:800, color:"#64748B", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"monospace" }}>OCR EXTRACTED RX</span>
      </div>
      {[
        "Tab Metformin 500mg · 1-0-1",
        "Tab Glimiperide 2mg · 0-0-1",
        "Cap Pantoprazole 40mg · 1-0-0",
      ].map((rx, i) => (
        <div key={i} style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:"#F8FAFC", borderRadius:8, padding:"7px 12px",
          border:"1px solid rgba(15,23,42,0.06)",
        }}>
          <span style={{ fontSize:11, fontWeight:600, color:"#0F172A", fontFamily:"monospace" }}>{rx}</span>
          <span style={{
            fontSize:9, fontWeight:700, color:"#0D9488",
            background:"#F0FDFA", border:"1px solid #99F6E4",
            borderRadius:999, padding:"2px 8px",
          }}>✓ Extracted</span>
        </div>
      ))}
    </div>
  );
}

function OverlayPrivacy() {
  return (
    <div style={{
      background:"rgba(255,255,255,0.93)",
      backdropFilter:"blur(16px)",
      border:"1px solid rgba(15,23,42,0.07)",
      borderRadius:16,
      padding:"16px 18px",
      boxShadow:"0 8px 32px rgba(15,23,42,0.08)",
      minWidth:230,
      display:"flex",
      flexDirection:"column",
      gap:10,
    }}>
      {[
        { icon:"🔒", label:"DPDP Act 2023", value:"Consent Verified", color:"#166534", bg:"#F0FDF4", border:"#86EFAC" },
        { icon:"🏥", label:"ABHA Integration", value:"Patient Linked", color:"#1D4ED8", bg:"#EFF6FF", border:"#BFDBFE" },
        { icon:"📋", label:"FHIR R4 Export", value:"Ready", color:"#7C3AED", bg:"#F5F3FF", border:"#C4B5FD" },
        { icon:"🛡️", label:"Audit Trail", value:"Immutable Log", color:"#0D9488", bg:"#F0FDFA", border:"#99F6E4" },
      ].map(({ icon, label, value, color, bg, border }) => (
        <div key={label} style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:bg, border:`1px solid ${border}`,
          borderRadius:8, padding:"8px 12px",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>{icon}</span>
            <span style={{ fontSize:10, fontWeight:700, color:"#475569" }}>{label}</span>
          </div>
          <span style={{ fontSize:10, fontWeight:800, color, fontFamily:"monospace" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Card data ────────────────────────────────────────────────────────────────

const CARDS: CardData[] = [
  {
    index: 1,
    tag: "ADAPTIVE AI INTERVIEW",
    metric: "22 INDIAN LANGUAGES",
    headline: "Patients speak. ClinIQ listens.",
    body: "An adaptive clinical interview in the patient's own language — voice or touch — before the consultation begins. No forms. No friction.",
    bullets: [
      "22 Indian languages including Hindi, Tamil, Bengali & Hinglish",
      "Voice-first adaptive questioning, clinically validated OPQRST flow",
    ],
    image: "/feature-voice.png",
    imageAlt: "Patient completing a ClinIQ voice interview",
    accentColor: "#EFF6FF",
    accentText: "#0284C7",
    overlay: <OverlayVoice />,
  },
  {
    index: 2,
    tag: "CLINICAL SOAP ENGINE",
    metric: "<600MS LPU LATENCY",
    headline: "Structured history, ready before you sit down.",
    body: "Chief complaint, HPI, OPQRST, past history, medications, allergies, and review of systems arrive as a clean physician-facing SOAP record.",
    bullets: [
      "Full SOAP + ICMR clinical RAG in under 600ms on Groq LPU",
      "One-click approval flow keeps the physician in control",
    ],
    image: "/feature-ai.avif",
    imageAlt: "Clinician reviewing a structured SOAP patient summary",
    accentColor: "#F0FDFA",
    accentText: "#0D9488",
    overlay: <OverlaySoap />,
  },
  {
    index: 3,
    tag: "MULTIMODAL DOCUMENT AI",
    metric: "HANDWRITTEN + LAB OCR",
    headline: "Old records become live context.",
    body: "Patients scan prescriptions, lab reports, and discharge summaries. ClinIQ extracts medications, diagnoses, and key findings — including handwritten scripts.",
    bullets: [
      "Handwritten prescription OCR + printed lab report parsing",
      "Automatic drug-drug interaction flagging from prior meds",
    ],
    image: "/feature-docs.avif",
    imageAlt: "Medical document being scanned by ClinIQ",
    accentColor: "#FFF7ED",
    accentText: "#C2410C",
    overlay: <OverlayOcr />,
  },
  {
    index: 4,
    tag: "DPDP & ABDM COMPLIANCE",
    metric: "FHIR R4 & DPDP 2023",
    headline: "Built for India's regulatory reality.",
    body: "Patient-language consent, audit-ready data handling, FHIR R4 records, and ABDM-aligned workflows help care teams adopt AI with zero legal risk.",
    bullets: [
      "DPDP Act 2023 consent gates + immutable audit trail",
      "ABHA-linked patient records, FHIR R4 export ready",
    ],
    image: "/feature-privacy.png",
    imageAlt: "Secure healthcare compliance dashboard",
    accentColor: "#F5F3FF",
    accentText: "#7C3AED",
    overlay: <OverlayPrivacy />,
  },
];

// ─── Single card ──────────────────────────────────────────────────────────────

const STICKY_TOP_BASE = 96; // px — below fixed nav (62px) + breathing room
const CARD_HEADER_H   = 36; // px — exposed strip height
const CARD_STACK_GAP  = 32; // px — per-card offset

interface SingleCardProps {
  card: CardData;
  totalCards: number;
  scrollProgress: number; // 0→1 through this card's "active" scroll window
}

function SingleCard({ card, totalCards, scrollProgress }: SingleCardProps) {
  const idx = card.index - 1; // 0-based

  // As later cards approach, this card scales down and dims
  const scale   = 1 - (totalCards - 1 - idx) * 0.018 * Math.min(scrollProgress, 1);
  const bright  = 1 - (totalCards - 1 - idx) * 0.004 * Math.min(scrollProgress, 1);

  const topOffset = STICKY_TOP_BASE + idx * CARD_STACK_GAP;

  return (
    <div
      style={{
        position: "sticky",
        top: topOffset,
        zIndex: 10 + idx,
        marginBottom: 24,
        // Upward shadow on card being approached
        boxShadow: `
          0 -20px 48px -12px rgba(15,23,42,0.07),
          0 12px 32px -8px rgba(15,23,42,0.04)
        `,
        borderRadius: 28,
        overflow: "hidden",
        transform: `scale(${scale})`,
        filter: `brightness(${bright})`,
        transformOrigin: "top center",
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), filter 0.35s ease",
        willChange: "transform",
        background: "#FFFFFF",
        border: "1px solid rgba(15,23,42,0.07)",
      }}
    >
      {/* ── Exposed dossier header strip ── */}
      <div style={{
        height: CARD_HEADER_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid #F1F5F9",
        background: "#FAFAFA",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10,
          fontFamily: "'Courier New', monospace",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#94A3B8",
        }}>
          0{card.index} // {card.tag}
        </span>
        <span style={{
          fontSize: 9,
          fontFamily: "'Courier New', monospace",
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: card.accentText,
          background: card.accentColor,
          border: `1px solid ${card.accentText}22`,
          borderRadius: 999,
          padding: "3px 10px",
        }}>
          {card.metric}
        </span>
      </div>

      {/* ── Card body — 2-column ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: 400,
        gap: 0,
      }}>
        {/* Left: copy */}
        <div style={{
          padding: "36px 40px 40px 36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0,
        }}>
          {/* Tag pill */}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 12px",
            borderRadius: 999,
            background: card.accentColor,
            color: card.accentText,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 18,
            alignSelf: "flex-start",
          }}>
            {card.tag}
          </span>

          {/* Headline */}
          <h3 style={{
            fontSize: "clamp(22px,2.4vw,32px)",
            fontWeight: 800,
            letterSpacing: "-0.055em",
            lineHeight: 1.08,
            color: "#0F172A",
            marginBottom: 16,
          }}>
            {card.headline}
          </h3>

          {/* Body */}
          <p style={{
            fontSize: 15,
            lineHeight: 1.72,
            color: "#475569",
            marginBottom: 24,
            maxWidth: 400,
          }}>
            {card.body}
          </p>

          {/* Bullet highlights */}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {card.bullets.map((b, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#F0FDF4", border: "1px solid #86EFAC",
                  color: "#16A34A", fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 1,
                }}>✓</span>
                <span style={{ fontSize: 13, lineHeight: 1.55, color: "#334155", fontWeight: 500 }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: image + floating clinical overlay */}
        <div style={{ position: "relative", overflow: "hidden", background: "#F8FAFC" }}>
          {/* Image fills the right pane */}
          <img
            src={card.image}
            alt={card.imageAlt}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Soft gradient vignette so overlay pops */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.0) 60%)",
            pointerEvents: "none",
          }} />
          {/* Floating clinical UI overlay — bottom-left of image pane */}
          <div style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            right: 24,
            zIndex: 2,
            display: "flex",
            justifyContent: "flex-start",
          }}>
            {card.overlay}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Container with scroll tracking ──────────────────────────────────────────

export function StackingFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  // One progress value per card: 0 = not yet reached, 1 = fully covered by next
  const [progresses, setProgresses] = useState<number[]>(CARDS.map(() => 0));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const totalH = rect.height;
      const scrolled = -rect.top; // px scrolled into the container
      const cardH = totalH / CARDS.length;

      const next = CARDS.map((_, i) => {
        // This card's scroll window starts when card i+1 begins to appear
        const windowStart = cardH * i;
        const windowSize  = cardH;
        const raw = (scrolled - windowStart) / windowSize;
        return Math.max(0, Math.min(1, raw));
      });

      setProgresses(next);
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    // The outer div defines the total scroll real estate
    // Each card is h-screen-ish inside, so 4 cards = ~4 screens of scroll
    <div
      ref={containerRef}
      style={{ position: "relative", paddingBottom: 48 }}
    >
      {CARDS.map((card, i) => (
        <SingleCard
          key={card.tag}
          card={card}
          totalCards={CARDS.length}
          scrollProgress={progresses[i]}
        />
      ))}
    </div>
  );
}

export default StackingFeatures;
