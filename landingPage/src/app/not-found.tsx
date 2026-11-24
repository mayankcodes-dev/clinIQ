"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.cliniq.mayankcodes.dev";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // small delay so the entrance animation fires after hydration
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        .notfound-root {
          font-family: 'Manrope', system-ui, sans-serif;
          min-height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* ambient glow blobs */
        .nf-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          opacity: 0;
          transition: opacity 1.6s ease;
        }
        .nf-blob-1 {
          width: min(60vw, 480px); height: min(60vw, 480px);
          background: radial-gradient(circle, rgba(2,132,199,0.22) 0%, transparent 70%);
          top: -15%; left: -10%;
        }
        .nf-blob-2 {
          width: min(50vw, 400px); height: min(50vw, 400px);
          background: radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 70%);
          bottom: -10%; right: -5%;
        }
        .mounted .nf-blob { opacity: 1; }

        /* giant 404 */
        .nf-code {
          font-size: clamp(96px, 22vw, 240px);
          font-weight: 900;
          letter-spacing: -0.08em;
          line-height: 0.85;
          color: transparent;
          background: linear-gradient(135deg, #1e3a5f 0%, #0284C7 45%, #0D9488 100%);
          -webkit-background-clip: text;
          background-clip: text;
          user-select: none;
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .mounted .nf-code {
          opacity: 1;
          transform: translateY(0);
        }

        /* content card */
        .nf-card {
          margin-top: 40px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: clamp(32px, 5vw, 52px) clamp(28px, 6vw, 64px);
          text-align: center;
          max-width: 520px;
          width: 100%;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s 0.18s ease, transform 0.7s 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .mounted .nf-card {
          opacity: 1;
          transform: translateY(0);
        }

        .nf-eyebrow {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #0284C7;
          margin-bottom: 16px;
        }

        .nf-heading {
          font-size: clamp(22px, 4vw, 32px);
          font-weight: 800;
          letter-spacing: -0.055em;
          line-height: 1.15;
          color: #fff;
          margin-bottom: 14px;
        }

        .nf-body {
          font-size: 15px;
          line-height: 1.75;
          color: rgba(255,255,255,0.45);
          margin-bottom: 36px;
        }

        .nf-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nf-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 28px;
          height: 48px;
          border-radius: 9999px;
          background: #0F172A;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .nf-btn-primary:hover {
          background: #0284C7;
          border-color: #0284C7;
          transform: translateY(-2px);
        }

        .nf-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 24px;
          height: 48px;
          border-radius: 9999px;
          background: transparent;
          color: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.2s, border-color 0.2s, transform 0.2s;
        }
        .nf-btn-ghost:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.3);
          transform: translateY(-1px);
        }

        /* ECG line decoration */
        .nf-ecg {
          margin: 28px auto 0;
          display: block;
          opacity: 0.18;
        }
        .nf-ecg-line {
          fill: none;
          stroke: #0284C7;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-dasharray: 320;
          stroke-dashoffset: 320;
          animation: nf-ecg-draw 2.4s 0.6s linear forwards;
        }
        @keyframes nf-ecg-draw {
          to { stroke-dashoffset: 0; }
        }

        /* brand wordmark at bottom */
        .nf-brand {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-weight: 900;
          font-size: clamp(3rem, 14vw, 140px);
          letter-spacing: -0.045em;
          line-height: 0.78;
          color: rgba(255,255,255,0.03);
          user-select: none;
          pointer-events: none;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .nf-actions { flex-direction: column; align-items: stretch; }
          .nf-btn-primary, .nf-btn-ghost { width: 100%; }
        }
      `}</style>

      <div className={`notfound-root${mounted ? " mounted" : ""}`}>
        {/* ambient glows */}
        <div className="nf-blob nf-blob-1" aria-hidden="true" />
        <div className="nf-blob nf-blob-2" aria-hidden="true" />

        {/* giant 404 */}
        <div className="nf-code" aria-hidden="true">404</div>

        {/* content card */}
        <div className="nf-card">
          <span className="nf-eyebrow">Page not found</span>
          <h1 className="nf-heading">
            This page doesn&apos;t exist.<br />
            Your patient&apos;s record does.
          </h1>
          <p className="nf-body">
            Looks like you&apos;ve wandered off the chart. Head back to the
            landing page or open the ClinIQ app.
          </p>
          <div className="nf-actions">
            <Link href="/" className="nf-btn-primary">
              ← Back to home
            </Link>
            <a href={APP_URL} className="nf-btn-ghost">
              Open ClinIQ ↗
            </a>
          </div>

          {/* decorative ECG */}
          <svg
            className="nf-ecg"
            viewBox="0 0 320 48"
            width="260"
            height="38"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="nf-ecg-line"
              d="M0,24 L48,24 L60,24 L66,8 L72,40 L78,4 L84,44 L90,24 L102,24 L160,24 L172,24 L178,8 L184,40 L190,4 L196,44 L202,24 L214,24 L320,24"
            />
          </svg>
        </div>

        {/* ghost brand */}
        <div className="nf-brand" aria-hidden="true">ClinIQ</div>
      </div>
    </>
  );
}
