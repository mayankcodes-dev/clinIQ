"use client";

import { useEffect, useRef } from "react";

export function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const emailRef  = useRef<HTMLDivElement>(null);
  const brandRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const email  = emailRef.current;
    const brand  = brandRef.current;
    if (!footer || !email || !brand) return;

    let rafId = 0;

    const update = () => {
      const rect     = footer.getBoundingClientRect();
      const vh       = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));

      // email: slides up + fades in
      const eTY   = (1 - progress) * 52;
      const eOpac = Math.min(1, progress * 2.6);
      email.style.transform = `translateY(${eTY}px)`;
      email.style.opacity   = String(eOpac);

      // brand: slides up with slight delay
      const bProgress = Math.max(0, (progress - 0.06) / 0.94);
      const bTY   = (1 - bProgress) * 80;
      const bOpac = Math.min(1, bProgress * 2.8);
      brand.style.transform = `translateY(${bTY}px)`;
      brand.style.opacity   = String(bOpac);

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <footer
      ref={footerRef}
      style={{
        width: "100%",
        height: "100vh",
        minHeight: 580,
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        /* overflow visible so the giant brand doesn't clip */
        overflow: "hidden",
      }}
    >
      {/* email — centred vertically, sits above the brand */}
      <div
        ref={emailRef}
        style={{
          opacity: 0,
          transform: "translateY(52px)",
          willChange: "transform, opacity",
          textAlign: "center",
          /* push email above centre so brand fills the bottom */
          marginBottom: "clamp(20px, 4vw, 48px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <a
          href="mailto:admin@mayankcodes.dev"
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(13px, 1.3vw, 17px)",
            fontWeight: 400,
            letterSpacing: "0.01em",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          admin@mayankcodes.dev
        </a>
      </div>

      {/* giant brand — absolutely anchored to bottom so it never clips */}
      <div
        ref={brandRef}
        aria-hidden="true"
        style={{
          opacity: 0,
          transform: "translateY(80px)",
          willChange: "transform, opacity",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          lineHeight: 1,
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <span
          style={{
            display: "block",
            fontWeight: 900,
            /* 
              lineHeight 1 + bottom:0 anchors the text baseline to the footer base.
              Use vw-based size; cap so it never overflows width.
            */
            fontSize: "clamp(4rem, 19.5vw, 100vw)",
            lineHeight: 0.82,
            color: "#ffffff",
            letterSpacing: "-0.045em",
            whiteSpace: "nowrap",
          }}
        >
          ClinIQ
        </span>
      </div>
    </footer>
  );
}

export default SiteFooter;
