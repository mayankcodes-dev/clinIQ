"use client";

/**
 * InteractiveSoapSandbox — Patient Voice-to-SOAP live preview
 *
 * 4 language pills → clicking any updates both panes with a smooth
 * cross-fade transition (CSS opacity + transform, zero deps).
 *
 * Left pane:  Patient waiting-room input
 *   - Native-script symptom statement
 *   - Animated voice waveform (SVG)
 *   - Prior prescription scan tag
 *
 * Right pane: Doctor's screen (<1s)
 *   - Standardised English CC
 *   - HPI (OPQRST)
 *   - ICMR Clinical RAG prompt
 *   - Monospace telemetry footer
 */

import { useState, useEffect, useRef } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface LangData {
  code: string;
  nativeName: string;
  englishName: string;
  patientStatement: string;
  transliteration: string;
  priorRx: string;
  cc: string;
  hpi: {
    onset: string;
    duration: string;
    quality: string;
    severity: string;
    timing: string;
    modifying: string;
  };
  ragPrompt: string;
  latency: string;
}

const LANGUAGES: LangData[] = [
  {
    code: "hi",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    patientStatement: "मुझे 3 दिन से तेज़ बुखार और तेज़ सिरदर्द है। कभी-कभी ठंड भी लगती है।",
    transliteration: "Mujhe 3 din se tez bukhar aur tez sar dard hai.",
    priorRx: "Tab Paracetamol 650mg · SOS (3 months ago)",
    cc: "High-grade fever with severe headache × 3 days",
    hpi: {
      onset:     "Sudden onset, 3 days ago",
      duration:  "Continuous, worsening at night",
      quality:   "Throbbing headache, thermometer 103°F",
      severity:  "7 / 10",
      timing:    "Worse in evening, slight relief with paracetamol",
      modifying: "No rigors, no rash, no neck stiffness reported",
    },
    ragPrompt: "ICMR DDx: Viral fever vs Dengue vs Typhoid — order CBC, NS1 Ag, Widal",
    latency: "487MS",
  },
  {
    code: "ta",
    nativeName: "தமிழ்",
    englishName: "Tamil",
    patientStatement: "எனக்கு 2 நாட்களாக வயிற்று வலியும் வாந்தியும் இருக்கிறது. சாப்பிட முடியவில்லை.",
    transliteration: "Enakku 2 naalagaaga vayiru valiyum vaandiyum irukkirathu.",
    priorRx: "Tab Pantoprazole 40mg · OD (last month)",
    cc: "Abdominal pain with vomiting × 2 days, unable to tolerate oral feeds",
    hpi: {
      onset:     "2 days ago, sudden onset post meals",
      duration:  "Persistent, 3–4 vomiting episodes per day",
      quality:   "Colicky epigastric pain, non-radiating",
      severity:  "8 / 10",
      timing:    "Worse 30 min after eating",
      modifying: "No fever, no diarrhoea, prior PPI use noted",
    },
    ragPrompt: "ICMR DDx: Acute gastritis vs GERD vs Peptic ulcer — USG abdomen, H.pylori Ag",
    latency: "512MS",
  },
  {
    code: "bn",
    nativeName: "বাংলা",
    englishName: "Bengali",
    patientStatement: "আমার বুকে ব্যথা হচ্ছে এবং শ্বাস নিতে কষ্ট হচ্ছে। গত 1 ঘণ্টা ধরে।",
    transliteration: "Amar bukey bytha hochhe ebong shash nite koshto hochhe.",
    priorRx: "Tab Atorvastatin 10mg · OD (ongoing)",
    cc: "Acute chest pain with dyspnoea × 1 hour",
    hpi: {
      onset:     "Sudden onset 1 hour ago at rest",
      duration:  "Continuous, not relieved by position change",
      quality:   "Pressure-like, central chest, radiating to left arm",
      severity:  "9 / 10",
      timing:    "Constant since onset",
      modifying: "No prior similar episodes; on statin",
    },
    ragPrompt: "⚠ ICMR URGENT: Suspect ACS — STEMI protocol. 12-lead ECG, Troponin-I, aspirin 325mg STAT",
    latency: "398MS",
  },
  {
    code: "hinglish",
    nativeName: "Hinglish",
    englishName: "Hinglish",
    patientStatement: "Mujhe last 1 week se joint pain hai, mostly knees mein. Seedha khada hona bhi mushkil ho gaya hai.",
    transliteration: "Code-switching: Hindi + English mixed",
    priorRx: "Cap Calcium + D3 · OD (6 months ago)",
    cc: "Progressive bilateral knee joint pain × 1 week with restricted mobility",
    hpi: {
      onset:     "Gradual onset over past week",
      duration:  "Worsening, morning stiffness lasting >30 min",
      quality:   "Dull aching, bilateral knees, crepitus noted",
      severity:  "6 / 10",
      timing:    "Worse on climbing stairs and rising from sitting",
      modifying: "No swelling, no redness, prior calcium deficiency",
    },
    ragPrompt: "ICMR DDx: Osteoarthritis vs RA vs Vitamin D deficiency — X-ray knees, Vit D, RA Factor",
    latency: "521MS",
  },
];

// ─── Animated voice waveform ──────────────────────────────────────────────────

function VoiceWaveform({ active }: { active: boolean }) {
  const bars = [3,6,9,14,10,16,11,7,13,8,15,10,6,12,9,5,13,8,11,6];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3, height:28 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: active ? h * 1.4 : h * 0.5,
            borderRadius: 999,
            background: active
              ? `hsl(${199 + i * 2}, 90%, ${45 + i % 4 * 4}%)`
              : "#CBD5E1",
            transition: `height ${0.3 + i * 0.015}s cubic-bezier(0.16,1,0.3,1) ${i * 0.02}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── OPQRST row ───────────────────────────────────────────────────────────────

function OpqrstRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
      <span style={{
        fontSize:9, fontWeight:800, color:"#0284C7",
        letterSpacing:"0.1em", textTransform:"uppercase",
        fontFamily:"monospace", minWidth:72, paddingTop:2,
      }}>{label}</span>
      <span style={{ fontSize:12, color:"#0F172A", lineHeight:1.5, fontWeight:500 }}>{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InteractiveSoapSandbox() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const prevRef = useRef(0);

  const lang = LANGUAGES[active];

  // Cross-fade on language switch
  const switchLang = (idx: number) => {
    if (idx === active) return;
    setVisible(false);
    setTimeout(() => {
      setActive(idx);
      prevRef.current = idx;
      setVisible(true);
    }, 200);
  };

  // Pulse the waveform
  const [wavePulse, setWavePulse] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setWavePulse(p => !p), 1200);
    return () => clearInterval(id);
  }, []);

  const transition = "opacity 0.2s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)";

  return (
    <section style={{
      background: "#FFFFFF",
      padding: "96px 0 112px",
      borderTop: "1px solid rgba(15,23,42,0.06)",
    }}>
      <div style={{ width: "min(1120px, calc(100% - 48px))", margin: "0 auto" }}>

        {/* ── Section header ── */}
        <div style={{ marginBottom: 56, maxWidth: 680 }}>
          <p style={{
            fontSize:11, fontWeight:800, letterSpacing:"0.14em",
            textTransform:"uppercase", color:"#0D9488", marginBottom:14,
          }}>
            LIVE DEMO · PATIENT VOICE-TO-SOAP
          </p>
          <h2 style={{
            fontSize:"clamp(32px, 4.5vw, 56px)",
            fontWeight:800, letterSpacing:"-0.065em",
            lineHeight:1.04, color:"#0F172A", marginBottom:16,
          }}>
            Every language.<br />One clinical record.
          </h2>
          <p style={{ fontSize:16, lineHeight:1.76, color:"#475569", maxWidth:560 }}>
            Click a language to see ClinIQ convert a patient&apos;s native-script symptom statement into a structured SOAP note — in under 600ms.
          </p>
        </div>

        {/* ── Language pills ── */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:40 }}>
          {LANGUAGES.map((l, i) => (
            <button
              key={l.code}
              onClick={() => switchLang(i)}
              style={{
                display: "inline-flex", alignItems:"center", gap:7,
                padding: "10px 22px", borderRadius: 9999,
                border: active === i ? "1.5px solid #0284C7" : "1.5px solid rgba(15,23,42,0.1)",
                background: active === i ? "#EFF6FF" : "#FFFFFF",
                color: active === i ? "#0284C7" : "#475569",
                fontSize: 13, fontWeight: active === i ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: active === i ? "0 2px 12px rgba(2,132,199,0.15)" : "none",
              }}
            >
              <span style={{ fontSize:16 }}>{l.nativeName}</span>
              <span style={{ fontSize:11, opacity:0.7 }}>{l.englishName}</span>
            </button>
          ))}
        </div>

        {/* ── Two-pane card ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: "1px solid rgba(15,23,42,0.07)",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 8px 48px rgba(15,23,42,0.06)",
          minHeight: 480,
        }}>

          {/* LEFT: Patient waiting room */}
          <div style={{
            padding: "36px 36px 36px 36px",
            background: "#F8FAFC",
            borderRight: "1px solid rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(6px)",
            transition,
          }}>
            {/* Header */}
            <div>
              <span style={{
                fontSize:9, fontWeight:800, letterSpacing:"0.12em",
                textTransform:"uppercase", color:"#64748B",
                fontFamily:"monospace",
              }}>
                🏥 PATIENT WAITING ROOM
              </span>
            </div>

            {/* Language badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              alignSelf:"flex-start",
              background: "#FFFFFF", border:"1px solid rgba(15,23,42,0.08)",
              borderRadius:999, padding:"6px 14px",
              boxShadow:"0 2px 8px rgba(15,23,42,0.04)",
            }}>
              <span style={{ fontSize:14 }}>🌐</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#0F172A" }}>
                {lang.nativeName} · {lang.englishName}
              </span>
            </div>

            {/* Patient statement */}
            <div style={{
              background:"#FFFFFF",
              border:"1px solid rgba(15,23,42,0.07)",
              borderRadius:16,
              padding:"20px 22px",
              boxShadow:"0 2px 12px rgba(15,23,42,0.04)",
            }}>
              <p style={{
                fontSize:15, fontWeight:500, lineHeight:1.7,
                color:"#0F172A", marginBottom:12,
              }}>
                {lang.patientStatement}
              </p>
              <p style={{
                fontSize:11, color:"#94A3B8", fontStyle:"italic",
                lineHeight:1.5,
              }}>
                {lang.transliteration}
              </p>
            </div>

            {/* Voice waveform */}
            <div style={{
              display:"flex", alignItems:"center", gap:14,
              background:"#FFFFFF", border:"1px solid rgba(15,23,42,0.07)",
              borderRadius:12, padding:"12px 18px",
            }}>
              <span style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                width:32, height:32, borderRadius:"50%",
                background:"linear-gradient(135deg,#0284C7,#0D9488)",
                fontSize:15, flexShrink:0,
              }}>🎙️</span>
              <VoiceWaveform active={wavePulse} />
              <span style={{ fontSize:10, fontWeight:700, color:"#0284C7", marginLeft:"auto" }}>
                LIVE
              </span>
            </div>

            {/* Prior prescription */}
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              background:"#FFF7ED", border:"1px solid #FED7AA",
              borderRadius:12, padding:"10px 16px",
            }}>
              <span style={{ fontSize:16 }}>💊</span>
              <div>
                <p style={{ fontSize:9, fontWeight:800, color:"#C2410C", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>PRIOR RX SCANNED</p>
                <p style={{ fontSize:11, fontWeight:600, color:"#431407", fontFamily:"monospace" }}>{lang.priorRx}</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Doctor's screen */}
          <div style={{
            padding: "36px",
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-6px)",
            transition,
          }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{
                fontSize:9, fontWeight:800, letterSpacing:"0.12em",
                textTransform:"uppercase", color:"#64748B", fontFamily:"monospace",
              }}>
                👨‍⚕️ DOCTOR&apos;S SCREEN
              </span>
              <span style={{
                fontSize:9, fontWeight:800, color:"#16A34A",
                background:"#F0FDF4", border:"1px solid #86EFAC",
                borderRadius:999, padding:"3px 10px",
              }}>
                ● LIVE
              </span>
            </div>

            {/* Chief Complaint */}
            <div style={{
              background:"#F8FAFC", border:"1px solid rgba(15,23,42,0.07)",
              borderRadius:12, padding:"14px 18px",
            }}>
              <p style={{ fontSize:9, fontWeight:800, color:"#0284C7", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"monospace", marginBottom:6 }}>CHIEF COMPLAINT</p>
              <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", lineHeight:1.45 }}>{lang.cc}</p>
            </div>

            {/* HPI / OPQRST */}
            <div style={{
              background:"#F8FAFC", border:"1px solid rgba(15,23,42,0.07)",
              borderRadius:12, padding:"14px 18px",
              display:"flex", flexDirection:"column", gap:8,
            }}>
              <p style={{ fontSize:9, fontWeight:800, color:"#0284C7", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"monospace", marginBottom:4 }}>HPI · OPQRST</p>
              <OpqrstRow label="Onset"    value={lang.hpi.onset} />
              <OpqrstRow label="Duration" value={lang.hpi.duration} />
              <OpqrstRow label="Quality"  value={lang.hpi.quality} />
              <OpqrstRow label="Severity" value={lang.hpi.severity} />
              <OpqrstRow label="Timing"   value={lang.hpi.timing} />
              <OpqrstRow label="Modifying" value={lang.hpi.modifying} />
            </div>

            {/* ICMR RAG prompt */}
            <div style={{
              background: lang.code === "bn" ? "#FFF7ED" : "#F0F9FF",
              border: `1px solid ${lang.code === "bn" ? "#FED7AA" : "#BAE6FD"}`,
              borderRadius:12, padding:"12px 18px",
            }}>
              <p style={{ fontSize:9, fontWeight:800, color: lang.code === "bn" ? "#C2410C" : "#0284C7", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"monospace", marginBottom:5 }}>
                {lang.code === "bn" ? "⚠ URGENT CLINICAL FLAG" : "ICMR CLINICAL RAG"}
              </p>
              <p style={{ fontSize:11, fontWeight:600, color: lang.code === "bn" ? "#7C2D12" : "#0F172A", lineHeight:1.55, fontFamily:"monospace" }}>
                {lang.ragPrompt}
              </p>
            </div>

            {/* Telemetry footer */}
            <div style={{
              marginTop:"auto",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"10px 0",
              borderTop:"1px solid rgba(15,23,42,0.06)",
            }}>
              <span style={{
                fontSize:9, fontWeight:800, color:"#94A3B8",
                fontFamily:"monospace", letterSpacing:"0.08em",
              }}>
                LATENCY: {lang.latency} · GROQ LPU · VERIFIED ✓
              </span>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:4,
                fontSize:9, fontWeight:800, color:"#0D9488",
                background:"#F0FDFA", border:"1px solid #99F6E4",
                borderRadius:999, padding:"3px 10px",
              }}>
                🔒 DPDP 2023
              </span>
            </div>
          </div>

        </div>

        {/* ── Bottom tag line ── */}
        <p style={{
          marginTop:28, textAlign:"center",
          fontSize:12, color:"#94A3B8", fontWeight:600,
          letterSpacing:"0.04em",
        }}>
          ClinIQ processes 22 Indian languages · Voice · Touch · Text · Document scan
        </p>

      </div>
    </section>
  );
}

export default InteractiveSoapSandbox;
