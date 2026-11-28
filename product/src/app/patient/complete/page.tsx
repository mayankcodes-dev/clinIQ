"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { t } from "@/lib/translations";
import { KioskScreen, KioskBody } from "@/components/kiosk/KioskLayout";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Armchair, Bell, ClipboardList, CheckCircle,
} from "lucide-react";

interface TokenInfo {
  token: string;
  tokenIndex: number;
  position: number;
  estimatedWaitMins: number;
}


export default function CompletePage() {
  const router = useRouter();
  const [lang, setLang] = useState("hi");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const submitToQueue = useCallback(async () => {
    try {
      // ---- Read session data: prefer SessionStore, fall back to legacy keys ----
      const SESSION_KEY = "cliniq_active_patient_session_v1";
      const sessionRaw = sessionStorage.getItem(SESSION_KEY);
      const session = sessionRaw ? JSON.parse(sessionRaw) : {};

      const docsRaw = sessionStorage.getItem("mk_docs");
      const langCode =
        sessionStorage.getItem("mk_lang") ?? session.language ?? "hi";

      // Patient info: SessionStore.patient > legacy mk_patient key
      const patientLegacyRaw = sessionStorage.getItem("mk_patient");
      const legacyPatient = patientLegacyRaw
        ? JSON.parse(patientLegacyRaw)
        : {};
      const patient =
        session.patient && typeof session.patient === "object"
          ? (session.patient as Record<string, unknown>)
          : legacyPatient;

      // Generated report provides the richest clinical data
      const report = session.generatedReport ?? {};

      // Summary fallback from SessionStore.summary or legacy mk_history.summary
      const sessionSummary =
        session.summary && typeof session.summary === "object"
          ? (session.summary as Record<string, unknown>)
          : {};

      const chiefComplaint =
        (report.chiefComplaint as string) ??
        (sessionSummary.chiefComplaint as string) ??
        "Not specified";

      const redFlags: string[] = Array.isArray(report.redFlags)
        ? (report.redFlags as string[])
        : Array.isArray(sessionSummary.redFlags)
          ? (sessionSummary.redFlags as string[])
          : [];

      const icd10 = Array.isArray(report.icd10Suggestions)
        ? (report.icd10Suggestions as string[]).join(", ")
        : (sessionSummary.suggestedICD10 as string) ?? "";

      const hasDocs =
        (session.scannedDocuments?.length ?? 0) > 0 ||
        (docsRaw ? JSON.parse(docsRaw).length > 0 : false);

      const res = await fetch("/api/queue/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: langCode,
          loginMethod: (patient.loginMethod as string) ?? "anonymous",
          patientName:
            (patient.name as string) ??
            (session.patientName as string) ??
            undefined,
          chiefComplaint,
          severity: (sessionSummary.severity as string) ?? "moderate",
          suggestedICD10: icd10,
          redFlags,
          ayushNote: (sessionSummary.ayushNote as string) ?? undefined,
          hasDocuments: hasDocs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTokenInfo(data);
        // Save token before clearing other session keys
        sessionStorage.setItem("mk_token", JSON.stringify(data));
        // Clear patient session so next patient starts fresh
        [
          "mk_history", "mk_touch", "mk_docs", "mk_consent",
          "mk_patient", "mk_lang", "mk_mode", "mk_summary_submitted",
          "cliniq_active_patient_session_v1",
        ].forEach((k) => sessionStorage.removeItem(k));
      } else {
        setError("Could not join queue. Please see staff.");
      }
    } catch {
      setError("Network error. Please see staff at the desk.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLang(sessionStorage.getItem("mk_lang") ?? "hi");
    submitToQueue();
  }, [submitToQueue]);

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <KioskScreen>
        <KioskBody className="flex flex-col items-center justify-center gap-6 py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="h-14 w-14 rounded-full border-4 border-brand-100 border-t-brand-600"
          />
          <p className="text-neutral-500 font-semibold">कतार में जोड़ा जा रहा है…</p>
          <p className="text-xs text-neutral-400">Adding to doctor&apos;s queue…</p>
        </KioskBody>
      </KioskScreen>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <KioskScreen>
        <KioskBody className="flex flex-col items-center justify-center gap-4 py-16">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <p className="text-base font-bold text-neutral-900 text-center">{error}</p>
          <Button variant="primary" size="lg" onClick={() => router.push("/")}>
            नया सत्र शुरू करें · New Session
          </Button>
        </KioskBody>
      </KioskScreen>
    );
  }

  // ── Success ───────────────────────────────────────────────────
  const wait = tokenInfo?.estimatedWaitMins ?? 0;
  const pos = tokenInfo?.position ?? 1;

  return (
    <KioskScreen className="bg-gradient-to-b from-brand-50 to-white">
      <KioskBody className="flex flex-col items-center gap-5 py-6">
        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center
                     text-white shadow-lg"
        >
          <CheckCircle className="h-10 w-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-1"
        >
          <h1 className="text-2xl font-black text-neutral-900">
            {t(lang, "allDone")}
          </h1>
          <p className="text-sm text-neutral-400">
            You're in the queue · कतार में आ गए हैं
          </p>
        </motion.div>

        {/* Big token card */}
        {tokenInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="w-full bg-brand-600 text-white rounded-3xl p-6 text-center
                       shadow-xl shadow-brand-200"
          >
            <p className="text-sm font-semibold opacity-70 mb-1">
              आपका टोकन नंबर · Your Token
            </p>
            <p className="text-7xl font-black tracking-wider mb-2">
              {tokenInfo.token}
            </p>
            <div className="flex justify-center gap-6 text-sm opacity-80">
              <div>
                <p className="text-xs opacity-60">Queue position</p>
                <p className="font-bold text-lg">#{pos}</p>
              </div>
              <div className="border-l border-white/30" />
              <div>
                <p className="text-xs opacity-60">Est. wait</p>
                <p className="font-bold text-lg">
                  {wait < 1 ? "Now" : `~${wait} min`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-2.5"
        >
          {[
            { Icon: Armchair,     hi: "बैठ जाएं और अपना टोकन याद रखें", en: "Take a seat and remember your token" },
            { Icon: Bell,         hi: "डॉक्टर आपको टोकन नंबर से बुलाएंगे", en: "Doctor will call your token number" },
            { Icon: ClipboardList, hi: "डॉक्टर के पास आपका सारांश पहले से पहुंच गया है", en: "Your medical history is already with the doctor" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.12 }}
              className="flex items-start gap-3 bg-white rounded-2xl
                         border border-neutral-100 px-4 py-3 shadow-sm"
            >
              <item.Icon className="h-5 w-5 shrink-0 text-brand-600 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-900 text-sm">{item.hi}</p>
                <p className="text-xs text-neutral-400">{item.en}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Save PDF — prints the actual /report page HTML captured at render time */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="w-full"
        >
          <SavePDFButton />
        </motion.div>


      </KioskBody>
    </KioskScreen>
  );
}

// ── Save PDF Button ─────────────────────────────────────────────────────────
// Reads the actual /report page H&P HTML captured in sessionStorage,
// opens a print-ready window and triggers the browser print dialog.
function SavePDFButton() {
  function handlePrint() {
    const reportHTML = sessionStorage.getItem("mk_report_html");
    if (!reportHTML) {
      alert("Report not found. Please go back to the report page first.");
      return;
    }
    const win = window.open("", "_blank", "width=900,height=1100");
    if (win) {
      win.document.write(
        `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">` +
        `<title>ClinIQ Clinical Record</title>` +
        `<style>*{box-sizing:border-box;margin:0;padding:0}` +
        `body{font-family:"Georgia","Times New Roman",serif;max-width:800px;margin:0 auto;padding:24px 20px;color:#1a1a1a;line-height:1.5}` +
        `@media print{body{margin:0;padding:12px}}</style>` +
        `</head><body>${reportHTML}</body></html>`
      );
      win.document.close();
      win.onload = () => win.print();
    }
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center justify-center gap-2 w-full rounded-2xl
                 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                 py-3.5 text-sm transition-colors shadow-sm"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Save PDF / Download Report
    </button>
  );
}
