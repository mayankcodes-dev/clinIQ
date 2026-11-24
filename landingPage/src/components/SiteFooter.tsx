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
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / vh));

      const eTY   = (1 - progress) * 48;
      const eOpac = Math.min(1, progress * 2.4);
      email.style.transform = `translateY(${eTY}px)`;
      email.style.opacity   = String(eOpac);

      const bProgress = Math.max(0, (progress - 0.05) / 0.95);
      const bTY   = (1 - bProgress) * 72;
      const bOpac = Math.min(1, bProgress * 2.6);
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
        minHeight: 480,
        maxHeight: 900,
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* email */}
      <div
        ref={emailRef}
        style={{
          opacity: 0,
          transform: "translateY(48px)",
          willChange: "transform, opacity",
          textAlign: "center",
          marginBottom: "clamp(20px, 4vw, 48px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <a
          href="mailto:admin@mayankcodes.dev"
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(13px, 1.6vw, 18px)",
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

      {/* giant brand anchored to footer floor */}
      <div
        ref={brandRef}
        aria-label="ClinIQ"
        style={{
          opacity: 0,
          transform: "translateY(72px)",
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
             * On mobile 360px wide: 28vw = 100px — big enough to be dramatic.
             * Max caps at 320px so it never overflows on wide screens.
             */
            fontSize: "clamp(4.5rem, 28vw, 320px)",
            lineHeight: 0.78,
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
