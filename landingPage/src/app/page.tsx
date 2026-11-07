export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}
    >
      {/* Top-left logo */}
      <header style={{ padding: "28px 36px" }}>
        <a
          href="/"
          style={{
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.07em",
            color: "#0f172a",
            textDecoration: "none",
          }}
        >
          Cliniq<span style={{ color: "#0284c7" }}>.</span>
        </a>
      </header>

      {/* Centred content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
          gap: "20px",
        }}
      >
        {/* Subtle pulse dot */}
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#0d9488",
            boxShadow: "0 0 0 0 rgba(13,148,136,0.4)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(26px, 5vw, 44px)",
            fontWeight: 800,
            letterSpacing: "-0.065em",
            color: "#0f172a",
            lineHeight: 1.1,
          }}
        >
          We&apos;re making things better.
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: 440,
            fontSize: "clamp(14px, 2vw, 17px)",
            lineHeight: 1.75,
            color: "#64748b",
            fontWeight: 500,
          }}
        >
          ClinIQ is currently undergoing a quick update.
          We&apos;ll be back shortly, usually within the hour.
        </p>

        <a
          href="mailto:admin@mayankcodes.dev"
          style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: "#0284c7",
            textDecoration: "none",
            letterSpacing: "0.01em",
          }}
        >
          Questions? admin@mayankcodes.dev
        </a>
      </main>

      {/* Subtle footer */}
      <footer
        style={{
          padding: "24px 36px",
          textAlign: "center",
          fontSize: 11,
          color: "#94a3b8",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        © 2026 ClinIQ · Built for care teams
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap');
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(13,148,136,0.45); }
          50%       { box-shadow: 0 0 0 10px rgba(13,148,136,0); }
        }
      `}</style>
    </div>
  );
}
