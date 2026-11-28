// src/app/summary/page.tsx - ClinIQ AI Clinical Intake Record
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";
import {
  KioskHeader,
  KioskScreen,
  KioskBody,
  KioskFooter,
} from "@/components/kiosk/KioskLayout";
import { Button } from "@/components/ui/primitives";
import ClinIQLoader from "@/components/ClinIQLoader";
import type { StructuredSummary } from "@/app/api/history/chat/route";
import type { ExtractedDoc } from "@/app/api/scan/extract/route";
import {
  User, Mic, Hand, FileText, Clock, Activity,
  AlertTriangle, CheckCircle2, Leaf, Pill, FlaskConical,
  Building2, ScanLine, FileSearch, AlertCircle, Lock,
  ChevronRight,
} from "lucide-react";

type SummaryStatus = "generating" | "ready";

const LANG_NAMES: Record<string, string> = {
  hi: "हिंदी", en: "English", bn: "বাংলা", ta: "தமிழ்", te: "తెలుగు",
  mr: "मराठी", gu: "ગુજરાતી", kn: "ಕನ್ನಡ", ml: "മലയാളം", pa: "ਪੰਜਾਬੀ", ur: "اردو",
};

const PLACEHOLDER_SUMMARY: StructuredSummary = {
  chiefComplaint: "—",
  hpi: "—",
  pastHistory: "—",
  drugAllergy: "—",
  familyHistory: "—",
  personalHistory: "—",
  reviewOfSystems: "—",
  currentMedications: "—",
  suggestedICD10: "",
  redFlags: [],
  ayushNote: "",
};

type RawMsg = { role: "ai" | "patient"; text: string; stage?: string };
function buildSummaryFromSessionMessages(messages: RawMsg[]): StructuredSummary {
  const byStage = (stg: string): string => {
    const msgs = messages.filter((m) => m.role === "patient" && m.stage === stg);
    return msgs.map((m) => m.text).join("; ") || "—";
  };

  const cc       = byStage("chief_complaint");
  const hpi      = byStage("hpi");
  const past     = byStage("past_history");
  const drug     = byStage("drug_allergy");
  const family   = byStage("family_history");
  const personal = byStage("personal_history");
  const ros      = byStage("review_of_systems");
  const prakriti = byStage("ayush_prakriti");
  const vikriti  = byStage("ayush_vikriti");
  const agni     = byStage("ayush_agni");
  const koshtha  = byStage("ayush_koshtha");
  const ahara    = byStage("ayush_ahara_vihara");
  const nidana   = byStage("ayush_nidana");
  const samprapti= byStage("ayush_samprapti");
  const sara     = byStage("ayush_sara");
  const samhanana= byStage("ayush_samhanana");
  const satmya   = byStage("ayush_satmya");
  const pramana  = byStage("ayush_pramana");
  const sattva   = byStage("ayush_sattva");
  const aharaShakti  = byStage("ayush_ahara_shakti");
  const vyayamaShakti= byStage("ayush_vyayama_shakti");
  const vaya     = byStage("ayush_vaya");

  const allText = messages.map((m) => m.text).join(" ").toLowerCase();
  const redFlags: string[] = [];

  if (/chest pain/.test(allText)) redFlags.push("EMERGENCY: Chest pain — possible cardiac event, urgent triage required");
  if (/palpitation/.test(allText)) redFlags.push("Palpitations reported — cardiac evaluation recommended");
  if (/stroke|facial droop|arm weakness|slurred speech|sudden headache|paralysis/.test(allText)) redFlags.push("EMERGENCY: Stroke symptoms (FAST) — immediate neurological triage");
  if (/breathless|dyspnoea|dyspnea|wheezing|asthma attack/.test(allText)) redFlags.push("URGENT: Breathing difficulty — assess SpO2 and respiratory status");
  if (/hematemesis|melena|hematuria/.test(allText)) redFlags.push("Bleeding reported — assess volume and urgency");
  if (/unconscious|seizure|convulsion|fitting|fainting/.test(allText)) redFlags.push("EMERGENCY: Altered consciousness / seizure — immediate triage");
  if (/anaphylaxis/.test(allText)) redFlags.push("EMERGENCY: Possible anaphylaxis — epinephrine may be needed");
  if (/high fever/.test(allText)) redFlags.push("High fever reported — assess for infection source and hydration");
  if (/suicid|self.harm/.test(allText)) redFlags.push("EMERGENCY: Self-harm risk — immediate psychiatric consultation");
  if (/severe.*abdomen|severe.*stomach/.test(allText)) redFlags.push("Severe abdominal pain — assess for surgical emergency");

  const hasAyush = [prakriti, vikriti, agni, koshtha, ahara, nidana, samprapti, sara, samhanana, satmya, pramana, sattva, aharaShakti, vyayamaShakti, vaya].some(v => v !== "—");

  return {
    chiefComplaint: cc,
    hpi,
    pastHistory: past,
    drugAllergy: drug,
    familyHistory: family,
    personalHistory: personal,
    reviewOfSystems: ros,
    currentMedications: drug !== "—" ? drug : "—",
    suggestedICD10: "",
    redFlags,
    ayushNote: hasAyush
      ? `Prakriti: ${prakriti}. Vikriti: ${vikriti}. Agni: ${agni}. Koshtha: ${koshtha}.`
      : "",
    ...(hasAyush ? { prakriti, vikriti, agniType: agni, koshtha, aharaVihara: ahara, nidana, samprapti, sara, samhanana, satmya, pramana, sattva, aharaShakti, vyayamaShakti, vaya } : {}),
  };
}

function DocTypeLabel(type: string): string {
  const m: Record<string, string> = {
    prescription: "Prescription",
    lab_report: "Lab Report",
    discharge_summary: "Discharge Summary",
    xray_report: "X-Ray / Radiology",
    other: "Other Document",
  };
  return m[type] ?? type;
}

type LucideIcon = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

function DocTypeIconEl({ type }: { type: string }) {
  const iconMap: Record<string, LucideIcon> = {
    prescription: Pill,
    lab_report: FlaskConical,
    xray_report: ScanLine,
    discharge_summary: Building2,
  };
  const Icon = iconMap[type] ?? FileText;
  return <Icon size={18} className="text-neutral-500 shrink-0" />;
}

function SectionCard({ Icon, label, value, mono = false }: {
  Icon: LucideIcon;
  label: string;
  value?: string;
  mono?: boolean;
}) {
  if (!value || value === "—" || value === "Not reported") return null;
  if (value.toLowerCase().includes("unintelligible") || value.toLowerCase().includes("undisclosed")) return null;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        <Icon size={12} className="shrink-0" /> {label}
      </p>
      <p className={cn("text-xs text-neutral-700 leading-relaxed", mono && "font-mono text-brand-600")}>{value}</p>
    </div>
  );
}

function AyushRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-neutral-100 last:border-0">
      <span className="text-xs font-bold text-green-700 w-28 shrink-0 uppercase pt-0.5">{label}</span>
      <span className="text-xs text-neutral-700 flex-1">{value ?? "Not assessed"}</span>
    </div>
  );
}

function ClinIQCross({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden="true">
      <rect x="10" y="3" width="4" height="18" rx="1.5" fill="white" />
      <rect x="3" y="10" width="18" height="4" rx="1.5" fill="white" />
    </svg>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const [lang, setLang]           = useState("hi");
  const [status, setStatus]       = useState<SummaryStatus>("generating");
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary]     = useState<StructuredSummary>(PLACEHOLDER_SUMMARY);
  const [docs, setDocs]           = useState<ExtractedDoc[]>([]);
  const [isMock, setIsMock]       = useState(false);
  const [patient, setPatient]     = useState<Record<string, string>>({});
  const [intakeMode, setIntakeMode] = useState<string[]>([]);
  const [isAyush, setIsAyush]     = useState(false);

  useEffect(() => {
    const savedMode = sessionStorage.getItem("mk_mode") ?? "hi";
    setLang(sessionStorage.getItem("mk_lang") ?? "hi");
    setIsAyush(savedMode === "ayush" || savedMode === "combined");

    try {
      setPatient(JSON.parse(sessionStorage.getItem("mk_patient") ?? "{}"));
    } catch { /**/ }

    const modes: string[] = [];
    if (sessionStorage.getItem("mk_history"))  modes.push("Voice");
    if (sessionStorage.getItem("mk_touch"))    modes.push("Touch");
    if (sessionStorage.getItem("mk_docs"))     modes.push("Document Scan");
    setIntakeMode(modes.length ? modes : ["Touch"]);

    const saved = sessionStorage.getItem("mk_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasPatientMessages = Array.isArray(parsed.messages) &&
          parsed.messages.some((m: { role: string }) => m.role === "patient");
        if (parsed.summary?.chiefComplaint) {
          setSummary(parsed.summary);
          setIsMock(false);
        } else if (hasPatientMessages) {
          const built = buildSummaryFromSessionMessages(parsed.messages);
          setSummary(built);
          setIsMock(false);
        } else {
          setIsMock(true);
        }
      } catch { setIsMock(true); }
    } else { setIsMock(true); }

    const docsRaw = sessionStorage.getItem("mk_docs");
    if (docsRaw) {
      try {
        const d: ExtractedDoc[] = JSON.parse(docsRaw);
        setDocs(Array.isArray(d) ? d : []);
      } catch { /**/ }
    }

    const timer = setTimeout(() => setStatus("ready"), 2200);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit() {
    setSubmitted(true);
    sessionStorage.setItem("mk_summary_submitted", "true");

    try {
      const historyRaw = sessionStorage.getItem("mk_history");
      const docsRaw    = sessionStorage.getItem("mk_docs");
      const consentRaw = sessionStorage.getItem("mk_consent");

      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          mode: sessionStorage.getItem("mk_mode") ?? "combined",
          patient,
          consent: consentRaw ? JSON.parse(consentRaw) : null,
          history: historyRaw ? JSON.parse(historyRaw) : null,
          docs: docsRaw ? JSON.parse(docsRaw) : [],
        }),
      });
    } catch (e) {
      console.warn("[summary] DB save failed (non-fatal):", e);
    }

    await new Promise((r) => setTimeout(r, 400));
    // NOTE: session is intentionally NOT cleared here — /report page reads it to render the report.
    // Session is cleared in /patient/complete after queue submission succeeds.
    router.push("/report");
  }

  if (status === "generating") {
    return (
      <KioskScreen>
        <KioskBody className="flex flex-col items-center justify-center gap-6 py-16">
          <ClinIQLoader />
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-neutral-900">आपका सारांश तैयार हो रहा है…</h2>
            <p className="text-sm text-neutral-400">Your health record is being prepared</p>
          </div>
          <div className="text-left w-full max-w-xs space-y-2">
            {["Organising symptoms…", "Checking red flags…",
              isAyush ? "Computing Dashavidha Pariksha…" : "Reviewing history…",
              "Merging document data…", "Preparing your record…",
            ].map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.38 }}
                className="flex items-center gap-2 text-sm text-neutral-500">
                <CheckCircle2 size={14} className="text-brand-500 shrink-0" /> {step}
              </motion.div>
            ))}
          </div>
        </KioskBody>
      </KioskScreen>
    );
  }

  const redFlags = summary.redFlags ?? [];
  const abnormal = docs.flatMap((d) => d.labValues?.filter((lv) => lv.flag === "H" || lv.flag === "L") ?? []);
  const allMeds  = Array.from(new Set(docs.flatMap((d) => d.medications?.map((m) => m.name) ?? [])));
  const allDx    = docs.flatMap((d) => d.diagnoses ?? []);

  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const patientAge = patient.yearOfBirth
    ? `${new Date().getFullYear() - parseInt(patient.yearOfBirth)}y` : "";

  const isInvalidText = (v?: string) =>
    !v || v === "—" || v === "Not reported" ||
    v.toLowerCase().includes("unintelligible") ||
    v.toLowerCase().includes("undisclosed");

  const chiefComplaintDisplay = isInvalidText(summary.chiefComplaint) ? null : summary.chiefComplaint;

  return (
    <KioskScreen>
      <KioskHeader
        title={t(lang, "summaryReady")}
        subtitle="आपका स्वास्थ्य सारांश"
        onBack={() => router.push("/patient/scan")}
        progress={90}
        stepLabel="6 / 6"
      />
      <KioskBody className="space-y-3 pb-6">

        {/* 1. HEADER BAR */}
        <div className="bg-brand-700 text-white rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ClinIQCross size={22} />
            </div>
            <div>
              <p className="text-xs text-brand-200 font-medium uppercase tracking-wide">ClinIQ</p>
              <p className="font-bold text-base leading-tight">आपकी जानकारी</p>
              <p className="text-xs text-brand-300 mt-0.5">{now}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20 block">
              डॉक्टर के पास जाएगा
            </span>
          </div>
        </div>

        {/* 2. PATIENT CARD */}
        <div className="bg-neutral-50 rounded-2xl px-4 py-3 flex items-center gap-4 border border-neutral-200">
          <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <User size={28} className="text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-neutral-900 text-base truncate">{patient.name ?? "Patient"}</p>
            {patient.abhaNumber && (
              <p className="text-xs text-brand-600 font-mono mt-0.5">ABHA: {patient.abhaNumber}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {patient.gender && <span className="text-xs text-neutral-500 capitalize">{patient.gender}</span>}
              {patientAge && <span className="text-xs text-neutral-500">{patientAge}</span>}
              <span className="text-xs text-neutral-500">{LANG_NAMES[lang] ?? lang.toUpperCase()}</span>
              {isAyush && (
                <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Leaf size={10} /> AYUSH
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {intakeMode.map((m) => (
              <span key={m} className="text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                {m === "Voice" ? <Mic size={10} /> : m === "Touch" ? <Hand size={10} /> : <FileText size={10} />}
                {m}
              </span>
            ))}
          </div>
        </div>

        {isMock && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Voice history not completed</p>
              <p className="text-xs text-amber-700 mt-0.5">Document data below is still available to the doctor.</p>
            </div>
          </div>
        )}

        {/* 3. HISTORY COLLECTED */}
        {!isMock && (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2">
              <Activity size={12} className="text-neutral-500" />
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                आपकी जानकारी
              </p>
            </div>
            <div className="p-3 space-y-3">
              {/* Chief Complaint */}
              {chiefComplaintDisplay ? (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <FileText size={11} /> मुख्य शिकायत
                  </p>
                  <p className="font-bold text-neutral-900 text-sm leading-snug">{chiefComplaintDisplay}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {summary.severity && (
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                        summary.severity.toLowerCase().includes("severe")
                          ? "bg-red-100 text-red-700"
                          : summary.severity.toLowerCase() === "moderate"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      )}>
                        {summary.severity} severity
                      </span>
                    )}
                    {summary.duration && summary.duration !== "—" && (
                      <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={10} /> {summary.duration}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <FileText size={11} /> मुख्य शिकायत
                  </p>
                  <p className="text-sm text-neutral-500">डॉक्टर से बात करें</p>
                </div>
              )}

              {/* HPI */}
              {!isInvalidText(summary.hpi) && (
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <FileText size={11} /> बीमारी का विवरण
                  </p>
                  <p className="text-xs text-neutral-700 leading-relaxed">{summary.hpi}</p>
                  {summary.character && summary.character !== "—" && (
                    <p className="text-xs text-neutral-500 mt-1"><span className="font-semibold">Character:</span> {summary.character}</p>
                  )}
                  {(summary.associatedSymptoms?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-neutral-400 font-semibold mr-1">Associated:</span>
                      {(summary.associatedSymptoms ?? []).map((s) => (
                        <span key={s} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2-col: Past History | Drug & Allergy */}
              <div className="grid grid-cols-2 gap-2">
                <SectionCard Icon={Building2} label="पुरानी बीमारी" value={summary.pastHistory} />
                <SectionCard Icon={Pill} label="दवाई / एलर्जी" value={summary.drugAllergy} />
              </div>

              {!isInvalidText(summary.currentMedications) && (
                <SectionCard Icon={Pill} label="वर्तमान दवाई" value={summary.currentMedications} />
              )}

              {/* 2-col: Family | Personal */}
              <div className="grid grid-cols-2 gap-2">
                <SectionCard Icon={User} label="पारिवारिक इतिहास" value={summary.familyHistory} />
                <SectionCard Icon={User} label="व्यक्तिगत इतिहास" value={summary.personalHistory} />
              </div>

              {!isInvalidText(summary.reviewOfSystems) && (
                <SectionCard Icon={FileSearch} label="अंग तंत्र समीक्षा" value={summary.reviewOfSystems} />
              )}
            </div>
          </div>
        )}

        {/* 4. AYUSH DASHAVIDHA PARIKSHA */}
        {isAyush && !isMock && (
          <div className="rounded-2xl border-2 border-green-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 bg-green-50 border-b border-green-200 flex items-center gap-2">
              <Leaf size={16} className="text-green-600" />
              <div>
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest">AYUSH Dashavidha Pariksha</p>
                <p className="text-xs text-green-600">Ten-fold Ayurvedic examination</p>
              </div>
            </div>
            <div className="p-3">
              <AyushRow label="Prakriti" value={summary.prakriti} />
              <AyushRow label="Vikriti" value={summary.vikriti} />
              <AyushRow label="Agni" value={summary.agniType} />
              <AyushRow label="Koshtha" value={summary.koshtha} />
              <AyushRow label="Ahara-Vihara" value={summary.aharaVihara} />
              <AyushRow label="Nidana" value={summary.nidana} />
              <AyushRow label="Samprapti" value={summary.samprapti} />
              <AyushRow label="Sara" value={summary.sara} />
              <AyushRow label="Samhanana" value={summary.samhanana} />
              <AyushRow label="Satmya" value={summary.satmya} />
              <AyushRow label="Pramana" value={summary.pramana} />
              <AyushRow label="Sattva" value={summary.sattva} />
              <AyushRow label="Ahara Shakti" value={summary.aharaShakti} />
              <AyushRow label="Vyayama Shakti" value={summary.vyayamaShakti} />
              <AyushRow label="Vaya" value={summary.vaya} />
              {summary.ayushNote && (
                <div className="mt-3 pt-3 border-t border-green-100">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">Clinical Note</p>
                  <p className="text-xs text-green-900 leading-relaxed">{summary.ayushNote}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. DOCUMENTS TABLE */}
        {docs.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2">
              <FileText size={12} className="text-neutral-500" />
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                दस्तावेज़ ({docs.length})
              </p>
            </div>
            <div className="divide-y divide-neutral-100">
              {docs.map((doc, i) => {
                const keyFindings = [
                  ...(doc.diagnoses?.slice(0, 2) ?? []),
                  ...(doc.medications?.slice(0, 2).map((m) => m.name) ?? []),
                  ...(doc.labValues?.slice(0, 3).map((lv) => `${lv.test}: ${lv.value} ${lv.unit}${lv.flag ? ` (${lv.flag})` : ""}`) ?? []),
                ].slice(0, 4);
                return (
                  <div key={i} className="px-4 py-3 grid grid-cols-[auto_1fr_auto] gap-3 items-start">
                    <DocTypeIconEl type={doc.docType} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-800">{DocTypeLabel(doc.docType)}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {doc.date ?? "Date not found"} · {doc.hospitalName ?? "Scanned document"}
                      </p>
                      <div className="mt-1.5 space-y-0.5">
                        {keyFindings.length > 0 ? keyFindings.map((f, j) => (
                          <p key={j} className={cn("text-xs",
                            f.includes("(H)") ? "text-red-600 font-semibold"
                              : f.includes("(L)") ? "text-blue-600 font-semibold"
                              : "text-neutral-600"
                          )}>• {f}</p>
                        )) : (
                          <p className="text-xs text-neutral-400 italic">No key findings extracted</p>
                        )}
                      </div>
                    </div>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                      doc.confidence === "high" ? "bg-green-100 text-green-700"
                        : doc.confidence === "medium" ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {doc.confidence === "high" ? "High" : doc.confidence === "medium" ? "Med" : "Low"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. MEDICAL TIMELINE */}
        {(allDx.length > 0 || abnormal.length > 0) && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Clock size={12} /> पुराने रिकॉर्ड
            </p>
            <div className="relative pl-5">
              <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-neutral-200" />
              {allDx.map((dx, i) => (
                <div key={i} className="relative mb-3 last:mb-0">
                  <div className="absolute -left-3.5 top-1 h-3 w-3 rounded-full bg-brand-500 border-2 border-white" />
                  <p className="text-xs text-neutral-700 font-medium">{dx}</p>
                  <p className="text-xs text-neutral-400">From uploaded document</p>
                </div>
              ))}
              {abnormal.map((lv, i) => (
                <div key={`lv-${i}`} className="relative mb-3 last:mb-0">
                  <div className={cn("absolute -left-3.5 top-1 h-3 w-3 rounded-full border-2 border-white",
                    lv.flag === "H" ? "bg-red-500" : "bg-blue-500"
                  )} />
                  <p className="text-xs font-medium text-neutral-800">
                    {lv.test}: {lv.value} {lv.unit}
                    <span className={cn("ml-1.5 text-xs font-bold", lv.flag === "H" ? "text-red-600" : "text-blue-600")}>
                      [{lv.flag === "H" ? "↑ HIGH" : "↓ LOW"}]
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400">Abnormal lab value</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. MEDICATION SUMMARY (from docs, visible) */}
        {allMeds.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Pill size={12} /> दवाइयाँ (दस्तावेज़ से)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allMeds.map((med) => (
                <span key={med} className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full font-medium">{med}</span>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
              <AlertCircle size={10} /> डॉक्टर से पुष्टि करें
            </p>
          </div>
        )}

        {/* 8. RED FLAG CHECK */}
        <div className={cn("rounded-2xl border p-4",
          redFlags.length > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
        )}>
          <div className="flex items-center justify-between mb-2">
            <p className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-1.5",
              redFlags.length > 0 ? "text-red-600" : "text-green-700"
            )}>
              <AlertTriangle size={12} />
              Red Flag Check
            </p>
            <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full",
              redFlags.length > 1 ? "bg-red-600 text-white"
                : redFlags.length === 1 ? "bg-amber-500 text-white"
                : "bg-green-600 text-white"
            )}>
              {redFlags.length > 1 ? "HIGH RISK" : redFlags.length === 1 ? "MODERATE" : "Low Risk"}
            </span>
          </div>
          {redFlags.length > 0 ? (
            <div className="space-y-1.5">
              {redFlags.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-medium">{f}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-700 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-600" /> No red flags detected — routine consultation
            </p>
          )}
        </div>

      </KioskBody>

      <KioskFooter>
        <Button variant="primary" size="xl" fullWidth loading={submitted} onClick={handleSubmit}>
          {submitted ? "Submitting…" : (
            <span className="flex items-center gap-2">
              <ChevronRight size={18} />
              {t(lang, "generateReport")}
            </span>
          )}
        </Button>
      </KioskFooter>
    </KioskScreen>
  );
}
