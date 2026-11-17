"use client";

import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Wraps page content + Footer.
 * As the footer scrolls into view the white wrapper scales 1->0.86 and
 * grows rounded bottom corners via CSS scroll-driven animation.
 *
 * Key insight: overflow:clip clips the border-radius visually WITHOUT
 * creating a scroll container, so position:sticky inside children still works.
 */
export function FooterScrollWrapper({ children, footer }: Props) {
  return (
    <div style={{ width: "100%", background: "#000000" }}>

      {/* White content — scales + clips via CSS scroll-driven animation */}
      <div
        className="footer-scale-wrapper"
        style={{
          position: "relative",
          width: "100%",
          transformOrigin: "bottom center",
          // overflow:clip clips border-radius without breaking sticky
          overflow: "clip",
        }}
      >
        {children}
      </div>

      {/* Footer lives outside the scaling wrapper */}
      <div className="footer-trigger">
        {footer}
      </div>

      <style>{`
        /* Chrome / Edge 115+ — scroll-driven native */
        @supports (animation-timeline: scroll()) {
          .footer-scale-wrapper {
            animation: footer-shrink linear both;
            animation-timeline: scroll(root);
            animation-range: 0% 100%;
          }

          @keyframes footer-shrink {
            0%   { scale: 1;    border-radius: 0 0 0 0; }
            72%  { scale: 1;    border-radius: 0 0 0 0; }
            90%  { scale: 0.91; border-radius: 0 0 44px 44px; }
            100% { scale: 0.86; border-radius: 0 0 56px 56px; }
          }
        }

        /* Firefox / Safari fallback */
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
