"use client";

import { useEffect, useRef, useState } from "react";

interface CardData {
  tag: string;
  accentColor: string;
  accentText: string;
  headline: string;
  body: string;
  image: string;
  imageAlt: string;
  depthGradient: string;
}

const CARDS: CardData[] = [
  {
    tag: "Voice Triage",
    accentColor: "#EFF6FF",
    accentText: "#0284C7",
    headline: "Patients speak. ClinIQ listens.",
    body: "An adaptive clinical interview in the patient's own language — voice or touch — before the consultation begins.",
    image: "/feature-voice.png",
    imageAlt: "Patient completing a ClinIQ voice interview",
    depthGradient: "linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(13,148,136,0.08) 100%)",
  },
  {
    tag: "SOAP Engine",
    accentColor: "#F0FDFA",
    accentText: "#0D9488",
    headline: "Structured history. Ready before you sit down.",
    body: "Chief complaint, HPI, medications, allergies, and review of systems arrive as a clean SOAP note — approved in one click.",
    image: "/feature-ai.avif",
    imageAlt: "Clinician reviewing a structured SOAP patient summary",
    depthGradient: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(2,132,199,0.07) 100%)",
  },
  {
    tag: "Document AI",
    accentColor: "#FFF7ED",
    accentText: "#C2410C",
    headline: "Old records become live context.",
    body: "Patients scan prescriptions and lab reports. ClinIQ extracts medications, diagnoses, and key findings — including handwritten scripts.",
    image: "/feature-docs.avif",
    imageAlt: "Medical document being scanned by ClinIQ",
    depthGradient: "linear-gradient(135deg, rgba(194,65,12,0.14) 0%, rgba(234,179,8,0.07) 100%)",
  },
  {
    tag: "Compliance",
    accentColor: "#F5F3FF",
    accentText: "#7C3AED",
    headline: "Built for India's regulatory reality.",
    body: "Patient-language consent, FHIR R4 records, and ABDM-aligned workflows help care teams adopt AI with zero legal risk.",
    image: "/feature-privacy.png",
    imageAlt: "Secure healthcare compliance dashboard",
    depthGradient: "linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(13,148,136,0.07) 100%)",
  },
];

const STICKY_TOP_BASE = 88;
const CARD_STACK_GAP  = 28;

interface SingleCardProps {
  card: CardData;
  idx: number;
  total: number;
  progress: number;
  isMobile: boolean;
}

function SingleCard({ card, idx, total, progress, isMobile }: SingleCardProps) {
  const scale  = isMobile ? 1 : 1 - (total - 1 - idx) * 0.016 * Math.min(progress, 1);
  const bright = isMobile ? 1 : 1 - (total - 1 - idx) * 0.004 * Math.min(progress, 1);
  const top    = STICKY_TOP_BASE + idx * CARD_STACK_GAP;

  return (
    <div
      style={{
        position: isMobile ? "relative" : "sticky",
        top: isMobile ? undefined : top,
        zIndex: isMobile ? undefined : 10 + idx,
        marginBottom: isMobile ? 20 : 20,
        borderRadius: isMobile ? 20 : 28,
        overflow: "hidden",
        transform: isMobile ? undefined : `scale(${scale})`,
        filter: isMobile ? undefined : `brightness(${bright})`,
        transformOrigin: "top center",
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), filter 0.35s ease",
        willChange: isMobile ? undefined : "transform",
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        border: "1px solid rgba(255,255,255,0.78)",
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.95),
          0 -16px 48px -12px rgba(15,23,42,0.06),
          0 12px 40px -8px rgba(15,23,42,0.08)
        `,
      }}
    >
      {/* Mobile: stacked layout. Desktop: 2-col grid */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* image on top for mobile */}
          <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
            <img
              src={card.image}
              alt={card.imageAlt}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center",
              }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: card.depthGradient,
              opacity: 0.35, mixBlendMode: "multiply",
              pointerEvents: "none",
            }} />
          </div>

          {/* text below */}
          <div style={{ padding: "28px 24px 32px", display: "flex", flexDirection: "column", gap: 0 }}>
            <span style={{
              display: "inline-flex", alignSelf: "flex-start",
              alignItems: "center", padding: "4px 12px", borderRadius: 999,
              background: card.accentColor, color: card.accentText,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", marginBottom: 16,
              boxShadow: `0 1px 4px ${card.accentText}22`,
            }}>
              {card.tag}
            </span>
            <h3 style={{
              fontSize: 20, fontWeight: 800,
              letterSpacing: "-0.055em", lineHeight: 1.15,
              color: "#0F172A", marginBottom: 10,
            }}>
              {card.headline}
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: "#64748B" }}>
              {card.body}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 360 }}>
          {/* Left: copy */}
          <div style={{
            padding: "44px 44px 44px 40px",
            display: "flex", flexDirection: "column", justifyContent: "center", gap: 0,
          }}>
            <span style={{
              display: "inline-flex", alignSelf: "flex-start",
              alignItems: "center", padding: "4px 12px", borderRadius: 999,
              background: card.accentColor, color: card.accentText,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", marginBottom: 20,
              boxShadow: `0 1px 4px ${card.accentText}22`,
            }}>
              {card.tag}
            </span>
            <h3 style={{
              fontSize: "clamp(22px,2.2vw,30px)", fontWeight: 800,
              letterSpacing: "-0.055em", lineHeight: 1.1,
              color: "#0F172A", marginBottom: 14,
            }}>
              {card.headline}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#64748B", maxWidth: 380 }}>
              {card.body}
            </p>
          </div>

          {/* Right: image */}
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "0 28px 28px 0" }}>
            <img
              src={card.image}
              alt={card.imageAlt}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center",
              }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: card.depthGradient,
              opacity: 0.35, mixBlendMode: "multiply", pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to right, rgba(255,255,255,0.22) 0%, rgba(0,0,0,0.08) 100%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to right, rgba(255,255,255,0.18) 0%, transparent 32%)",
              pointerEvents: "none",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function StackingFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progresses, setProgresses] = useState<number[]>(CARDS.map(() => 0));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) return; // no sticky scroll tracking needed on mobile
    const container = containerRef.current;
    if (!container) return;
    let rafId = 0;
    const update = () => {
      const rect    = container.getBoundingClientRect();
      const totalH  = rect.height;
      const scrolled = -rect.top;
      const cardH   = totalH / CARDS.length;
      const next    = CARDS.map((_, i) => {
        const raw = (scrolled - cardH * i) / cardH;
        return Math.max(0, Math.min(1, raw));
      });
      setProgresses(next);
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [isMobile]);

  return (
    <div ref={containerRef} style={{ position: "relative", paddingBottom: isMobile ? 0 : 40 }}>
      {CARDS.map((card, i) => (
        <SingleCard
          key={card.tag}
          card={card}
          idx={i}
          total={CARDS.length}
          progress={progresses[i]}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

export default StackingFeatures;
