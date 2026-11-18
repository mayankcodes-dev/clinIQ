"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { t } from "@/lib/translations";
import { KioskScreen, KioskBody } from "@/components/kiosk/KioskLayout";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Armchair, Bell, ClipboardList, Leaf, CheckCircle,
  RefreshCw,
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
        // Save token to session
        sessionStorage.setItem("mk_token", JSON.stringify(data));
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

        {/* AYUSH branding strip */}
        <div className="w-full bg-green-50 border border-green-100 rounded-2xl
                        px-4 py-3 flex items-center gap-3">
          <Leaf className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-xs font-bold text-green-800">AYUSH Health Record</p>
            <p className="text-xs text-green-600">
              आपका स्वास्थ्य इतिहास ABHA में सुरक्षित है
            </p>
          </div>
        </div>

        {/* WhatsApp Share — sends the H&P report stored from /report page */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="w-full"
        >
          <WhatsAppShareButton lang={lang} />
        </motion.div>

        {/* New session button */}
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={() => {
            sessionStorage.clear();
            router.push("/");
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" /> {t(lang, "newPatient")}
        </Button>
      </KioskBody>
    </KioskScreen>
  );
}

// ── WhatsApp Share Button ───────────────────────────────────────────────────
// Reads the generated H&P from SessionStore and builds a WhatsApp deep-link.
// Falls back to summary data if full report is not yet generated.
function WhatsAppShareButton({ lang }: { lang: string }) {
  const SESSION_KEY = "cliniq_active_patient_session_v1";

  function buildWhatsAppText(): string {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const session = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      const report = session.generatedReport as Record<string, unknown> | undefined;
      const summary = session.summary as Record<string, unknown> | undefined;

      const name = (session.patientName as string) ??
        ((session.patient as Record<string, unknown>)?.name as string) ?? "Patient";
      const age = (session.patientAge as string) ?? "";
      const gender = (session.patientGender as string) ??
        ((session.patient as Record<string, unknown>)?.gender as string) ?? "";
      const language = (session.language as string) ?? lang;

      // Use report if available, else fall back to summary
      const chiefComplaint =
        (report?.chiefComplaint as string) ??
        (summary?.chiefComplaint as string) ??
        "Not recorded";
      const hpi =
        (report?.historyOfPresentIllness as string) ??
        (summary?.hpi as string) ?? "";
      const pastHistory =
        (report?.pastMedicalHistory as string) ??
        (summary?.pastHistory as string) ?? "";

      const lines = [
        `*ClinIQ — History & Physical*`,
        `Patient: ${name}${age ? ` | Age: ${age}` : ""}${gender ? ` | Sex: ${gender}` : ""}`,
        `Date: ${new Date().toLocaleDateString("en-IN")} | Language: ${language.toUpperCase()}`,
        ``,
        `*CHIEF COMPLAINT*`,
        chiefComplaint,
      ];

      if (hpi) { lines.push(``, `*HISTORY OF PRESENT ILLNESS*`, hpi); }
      if (pastHistory && pastHistory !== "Not reported") {
        lines.push(``, `*PAST MEDICAL HISTORY*`, pastHistory);
      }

      if (report) {
        lines.push(
          ``,
          `*MEDICATIONS*`,
          Array.isArray(report.medications) && (report.medications as string[]).length > 0
            ? (report.medications as string[]).join(", ")
            : "None reported",
          ``,
          `*ALLERGIES*`,
          Array.isArray(report.allergies) && (report.allergies as string[]).length > 0
            ? (report.allergies as string[]).join(", ")
            : "NKDA",
        );

        const redFlags = Array.isArray(report.redFlags) ? (report.redFlags as string[]) : [];
        if (redFlags.length > 0) {
          lines.push(``, `*RED FLAGS*`, redFlags.join("; "));
        }

        const icd10s = Array.isArray(report.icd10Suggestions)
          ? (report.icd10Suggestions as string[])
          : [];
        if (icd10s.length > 0) {
          lines.push(``, `*ICD-10*`, icd10s.join(", "));
        }
      }

      lines.push(
        ``,
        `_Generated by ClinIQ AI. For physician review only. Not a clinical diagnosis._`
      );
      return lines.join("\n");
    } catch {
      return `*ClinIQ Patient Record*\nShared from ClinIQ AI kiosk.\n_For physician review only._`;
    }
  }

  const text = buildWhatsAppText();
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full rounded-2xl
                 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold
                 py-3.5 text-sm transition-colors shadow-sm"
    >
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      Share Report on WhatsApp
    </a>
  );
}
