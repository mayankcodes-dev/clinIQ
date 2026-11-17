"use client";

import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Wraps page content + Footer.
 * As the footer scrolls into view, the white content wrapper scales
 * 1 → 0.86 and grows rounded bottom corners — using CSS scroll-driven
 * animation for zero-jank native GPU compositing.
 * Falls back gracefully in Firefox / older Safari.
 */
export function FooterScrollWrapper({ children, footer }: Props) {
  return (
    <div style={{ width: "100%", background: "#000000" }}>

      {/* ── White content — scales via CSS scroll-driven animation ── */}
      <div
        className="footer-scale-wrapper"
        style={{
          position: "relative",
          width: "100%",
          transformOrigin: "bottom center",
          /* NO overflow here — would break position:sticky in StackingFeatures.
             Rounded corners are achieved by rounding the last child (pilot section). */
        }}
      >
        {children}
      </div>

      {/* ── Footer lives outside the scaling wrapper ── */}
      <div className="footer-trigger">
        {footer}
      </div>

      <style>{`
        /* ── Chrome / Edge 115+ — scroll-driven native ── */
        @supports (animation-timeline: scroll()) {
          .footer-scale-wrapper {
            animation: footer-shrink linear both;
            animation-timeline: scroll(root);
            animation-range: calc(100vh * 0) calc(100% - 0px);
          }

          @keyframes footer-shrink {
            0%   { scale: 1;    border-radius: 0 0 48px 48px; }
            75%  { scale: 1;    border-radius: 0 0 48px 48px; }
            100% { scale: 0.86; border-radius: 0 0 56px 56px; }
          }
        }

        /* ── Firefox / Safari fallback — no scale, just rounded corners ── */
        @supports not (animation-timeline: scroll()) {
          .footer-scale-wrapper {
            scale: 1;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default FooterScrollWrapper;
