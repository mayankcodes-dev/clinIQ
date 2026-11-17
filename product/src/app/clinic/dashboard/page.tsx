"use client";

// src/app/clinic/dashboard/page.tsx
// B2B Doctor Triage Console -- Zero-Hardware QR & Live Waiting Room Queue

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import {
  getClinicQueue,
  updateClinicQueueStatus,
  subscribeToClinicQueue,
  type ClinicQueueEntry,
} from "@/lib/clinicQueueStore";
import type { ClinIQClinicalReport } from "@/lib/sessionStore";
import { PrescriptionBuilder, type RxData } from "@/components/clinic/PrescriptionBuilder";
import { PrintablePrescription, type ClinicProfile } from "@/components/clinic/PrintablePrescription";
import {
  buildRecallList,
  calculateClinicROI,
  CHRONIC_TAG_STYLES,
  type ChronicRecallRecord,
  type ClinicROIMetrics,
} from "@/lib/clinicAnalytics";

// --- Constants ----------------------------------------------------------------

const DEFAULT_CLINIC_ID = "pilot-clinic-01";
const DEFAULT_CLINIC_NAME = "ClinIQ Partner Clinic";
const POLL_INTERVAL_MS = 8_000;

// --- Helpers ------------------------------------------------------------------

function buildIntakeUrl(clinicId: string, tokenNumber: number): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.protocol}//${window.location.host}`;
  return `${base}/patient/consent?clinicId=${encodeURIComponent(clinicId)}&token=${tokenNumber}`;
}

function buildWhatsAppLink(url: string, clinicName: string): string {
  const text = `?? Hello! Please complete your health intake form for ${clinicName} before seeing the doctor:\n\n${url}\n\nThis takes about 3--4 minutes and helps your doctor prepare in advance.`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function getUrgencyBadge(entry: ClinicQueueEntry): {
  label: string;
  cls: string;
} {
  if (entry.hasRedFlags) return { label: "?? Red Flag", cls: "bg-red-100 text-red-700 border border-red-200" };
  return { label: "? Stable", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
}

function getStatusBadge(status: ClinicQueueEntry["status"]): {
  label: string;
  cls: string;
} {
  if (status === "in_consultation") return { label: "?? In Room", cls: "bg-blue-100 text-blue-700" };
  if (status === "done") return { label: "? Done", cls: "bg-neutral-100 text-neutral-500" };
  return { label: "? Waiting", cls: "bg-amber-50 text-amber-700" };
}

// --- Sub-components -----------------------------------------------------------

function MetricPill({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center px-4 py-2 rounded-xl border",
      highlight ? "bg-red-50 border-red-200" : "bg-white/10 border-white/20"
    )}>
      <span className={cn("text-xl font-bold", highlight ? "text-red-600" : "text-white")}>{value}</span>
      <span className={cn("text-xs mt-0.5", highlight ? "text-red-500" : "text-white/70")}>{label}</span>
    </div>
  );
}

function QRModal({
  clinicId,
  clinicName,
  nextToken,
  onClose,
}: {
  clinicId: string;
  clinicName: string;
  nextToken: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intakeUrl, setIntakeUrl] = useState("");

  useEffect(() => {
    const url = buildIntakeUrl(clinicId, nextToken);
    setIntakeUrl(url);
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        color: { dark: "#1a365d", light: "#ffffff" },
      }).catch(() => {});
    }
  }, [clinicId, nextToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center gap-4"
      >
        <div className="flex items-center justify-between w-full">
          <h2 className="text-lg font-semibold text-[#1a365d]">Patient Intake Link</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Token badge */}
        <div className="bg-[#1a365d] text-white rounded-xl px-5 py-2 text-center">
          <div className="text-xs opacity-70 uppercase tracking-wider">Token Number</div>
          <div className="text-3xl font-bold"># {nextToken}</div>
        </div>

        {/* QR Code */}
        <div className="p-3 border-2 border-[#1a365d]/10 rounded-xl bg-white">
          <canvas ref={canvasRef} className="block" />
        </div>

        <p className="text-xs text-neutral-500 text-center px-2">
          Patient scans this QR to start their AI health intake on their own phone.
        </p>

        {/* URL copy */}
        <div className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-neutral-600 truncate flex-1">{intakeUrl}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(intakeUrl).catch(() => {}); }}
            className="text-xs font-semibold text-[#0d9488] shrink-0 hover:underline"
          >
            Copy
          </button>
        </div>

        {/* WhatsApp button */}
        <a
          href={buildWhatsAppLink(intakeUrl, clinicName)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-3 font-semibold text-sm hover:bg-[#1ebe5d] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Send via WhatsApp
        </a>
      </motion.div>
    </div>
  );
}

function QueueCard({
  entry,
  isSelected,
  onSelect,
}: {
  entry: ClinicQueueEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const urgency = getUrgencyBadge(entry);
  const statusBadge = getStatusBadge(entry.status);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3.5 rounded-xl border transition-all",
        isSelected
          ? "bg-[#1a365d] border-[#1a365d] text-white shadow-lg"
          : "bg-white border-neutral-200 hover:border-[#0d9488] hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
            isSelected ? "bg-white/20 text-white" : "bg-[#1a365d]/10 text-[#1a365d]"
          )}>
            #{entry.tokenNumber}
          </span>
          <span className={cn("text-sm font-semibold truncate max-w-[110px]", isSelected ? "text-white" : "text-neutral-800")}>
            {entry.patientName}
          </span>
        </div>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", urgency.cls,
          isSelected && entry.hasRedFlags ? "bg-red-200 text-red-700 border-red-300" : ""
        )}>
          {entry.hasRedFlags ? "??" : "?"}
        </span>
      </div>

      <p className={cn(
        "text-xs mt-1.5 truncate",
        isSelected ? "text-white/80" : "text-neutral-500"
      )}>
        {entry.chiefComplaint}
      </p>

      <div className="flex items-center justify-between mt-2">
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          isSelected ? "bg-white/15 text-white/80" : statusBadge.cls
        )}>
          {statusBadge.label}
        </span>
        {entry.redFlags.length > 0 && (
          <span className={cn(
            "text-[10px] font-semibold",
            isSelected ? "text-red-300" : "text-red-500"
          )}>
            {entry.redFlags.length} red flag{entry.redFlags.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </motion.button>
  );
}


// --- ROI KPI Card ----------------------------------------------------------
function KPICard({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 flex flex-col gap-1 shadow-sm">
      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold ${accent ?? "text-[#1a365d]"}`}>{value}</div>
      {sub && <div className="text-xs text-neutral-400">{sub}</div>}
    </div>
  );
}

// --- ROI + Recall Panel -------------------------------------------------------
function RecallPanel({
  roi,
  recallList,
}: {
  roi: ClinicROIMetrics;
  recallList: ChronicRecallRecord[];
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-6">
      {/* KPI Grid */}
      <div>
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
          ?? Live Pilot ROI Metrics
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KPICard
            label="Doctor Time Saved"
            value={`${roi.doctorHoursSaved} hrs`}
            sub={`${roi.completedIntakes} intakes -- 6.5 min`}
            accent="text-[#0d9488]"
          />
          <KPICard
            label="Avg Intake Latency"
            value={`${roi.avgIntakeLatencyMins} min`}
            sub="Per completed intake"
          />
          <KPICard
            label="Chronic Patients"
            value={String(roi.chronicPatientsCount)}
            sub="Auto-identified today"
            accent="text-orange-600"
          />
          <KPICard
            label="Projected Monthly Revenue"
            value={`?${roi.projectedMonthlyRevenueLift.toLocaleString("en-IN")}`}
            sub="From recall follow-ups"
            accent="text-emerald-600"
          />
        </div>
        {/* Secondary row */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
          <KPICard
            label="Red Flags Detected"
            value={String(roi.redFlagsDetected)}
            sub="Requiring urgent attention"
            accent={roi.redFlagsDetected > 0 ? "text-red-600" : "text-neutral-400"}
          />
          <KPICard
            label="Follow-Ups Queued"
            value={String(roi.chronicFollowUpsQueued)}
            sub="30-day WhatsApp recalls"
            accent="text-[#1a365d]"
          />
          <KPICard
            label="Est. Annual Revenue Lift"
            value={`?${roi.estimatedAnnualRevenueLift.toLocaleString("en-IN")}`}
            sub="Pilot projection"
            accent="text-purple-600"
          />
        </div>
      </div>

      {/* Recall Table */}
      <div>
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
          ?? 30-Day Smart Recall Queue
        </h2>

        {recallList.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-neutral-400">
            <div className="text-4xl mb-3">??</div>
            <p className="text-sm font-medium text-neutral-500">No chronic patients identified yet.</p>
            <p className="text-xs text-neutral-400 mt-1">
              Recall records appear automatically once patients complete their AI intake.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-0 bg-neutral-50 border-b border-neutral-200 px-4 py-2">
              {["Patient", "Condition(s)", "Recall Date", "Language", "Action"].map((h) => (
                <div key={h} className="text-xs font-semibold text-neutral-500 uppercase tracking-wider py-1">
                  {h}
                </div>
              ))}
            </div>

            {/* Table rows */}
            {recallList.map((rec, idx) => {
              const style = CHRONIC_TAG_STYLES[rec.primaryTag];
              const isLast = idx === recallList.length - 1;
              return (
                <div
                  key={rec.entryId}
                  className={`grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-0 px-4 py-3 items-center ${
                    !isLast ? "border-b border-neutral-100" : ""
                  } hover:bg-neutral-50/60 transition-colors`}
                >
                  {/* Patient */}
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 leading-tight">
                      {rec.patientName}
                    </div>
                    <div className="text-xs text-neutral-400">
                      Token #{rec.tokenNumber}
                      {rec.patientAge ? ` -- ${rec.patientAge}` : ""}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1">
                    {rec.conditions.slice(0, 3).map((tag) => {
                      const s = CHRONIC_TAG_STYLES[tag];
                      return (
                        <span
                          key={tag}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                    {rec.conditions.length > 3 && (
                      <span className="text-[11px] text-neutral-400 px-1">
                        +{rec.conditions.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Recall date */}
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">{rec.scheduledLabel}</div>
                    <div className="text-xs text-neutral-400">In {rec.recallDays} days</div>
                  </div>

                  {/* Language */}
                  <div>
                    <span className="text-xs font-semibold uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {rec.language.toUpperCase().slice(0, 3)}
                    </span>
                  </div>

                  {/* Action */}
                  <div>
                    <a
                      href={rec.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send Recall
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
const DEFAULT_CLINIC_PROFILE: ClinicProfile = {
  clinicName: "ClinIQ Partner Clinic",
  doctorName: "Dr. Attending Physician",
  qualification: "MBBS, MD",
  regNo: "MCI-XXXXX",
  address: "Clinic Address, City, State",
};

function SOAPWorkspace({
  entry,
  onStatusChange,
}: {
  entry: ClinicQueueEntry;
  onStatusChange: (id: string, status: ClinicQueueEntry["status"]) => void;
}) {
  const report: Partial<ClinIQClinicalReport> = entry.report ?? {};
  const urgency = getUrgencyBadge(entry);
  const [rxData, setRxData] = useState<RxData | null>(null);
  const [showPrint, setShowPrint] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Patient header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1a365d] text-white flex items-center justify-center font-bold text-lg shrink-0">
            {entry.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-neutral-900">{entry.patientName}</h2>
              {entry.patientAge && (
                <span className="text-xs text-neutral-500">{entry.patientAge}{entry.patientGender ? ` -- ${entry.patientGender}` : ""}</span>
              )}
              <span className="text-xs font-semibold text-[#1a365d] bg-[#1a365d]/10 px-2 py-0.5 rounded-full">
                Token #{entry.tokenNumber}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">Intake: {entry.avgIntakeMins}m -- Lang: {entry.language.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entry.status === "waiting" && (
            <button
              onClick={() => onStatusChange(entry.id, "in_consultation")}
              className="px-4 py-2 rounded-xl bg-[#0d9488] text-white text-sm font-semibold hover:bg-[#0f766e] transition-colors"
            >
              ?? Call In
            </button>
          )}
          {entry.status === "in_consultation" && (
            <button
              onClick={() => onStatusChange(entry.id, "done")}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              ? Mark Done
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4">
        {/* Red Flags banner */}
        {entry.hasRedFlags && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">??</span>
              <h3 className="text-sm font-bold text-red-700">Red Flags Detected</h3>
            </div>
            <ul className="space-y-1">
              {entry.redFlags.map((flag, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">--</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Urgency + ICD-10 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", urgency.cls)}>
            {urgency.label}
          </span>
          {entry.icd10Suggestions.map((code, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {code}
            </span>
          ))}
        </div>

        {/* SOAP sections */}
        {[
          { label: "Chief Complaint", value: report.chiefComplaint, icon: "??" },
          { label: "History of Present Illness", value: report.historyOfPresentIllness, icon: "??" },
          { label: "Past Medical History", value: report.pastMedicalHistory, icon: "???" },
          { label: "Family & Social History", value: report.familyAndSocialHistory, icon: "????????" },
          { label: "Review of Systems", value: report.reviewOfSystems, icon: "??" },
        ].map(({ label, value, icon }) => value && value !== "Not reported" ? (
          <div key={label} className="bg-white border border-neutral-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span>{icon}</span>{label}
            </h3>
            <p className="text-sm text-neutral-800 leading-relaxed">{value}</p>
          </div>
        ) : null)}

        {/* Medications & Allergies */}
        {((report.medications?.length ?? 0) > 0 || (report.allergies?.length ?? 0) > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {(report.medications?.length ?? 0) > 0 && (
              <div className="bg-white border border-neutral-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">?? Medications</h3>
                <ul className="space-y-1">
                  {report.medications!.map((m, i) => (
                    <li key={i} className="text-xs text-neutral-700">-- {m}</li>
                  ))}
                </ul>
              </div>
            )}
            {(report.allergies?.length ?? 0) > 0 && (
              <div className="bg-white border border-amber-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">?? Allergies</h3>
                <ul className="space-y-1">
                  {report.allergies!.map((a, i) => (
                    <li key={i} className="text-xs text-amber-700">-- {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* OCR Lab Findings */}
        {(report.keyLabFindings?.length ?? 0) > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">?? Lab Findings (OCR)</h3>
            <ul className="space-y-1">
              {report.keyLabFindings!.map((f, i) => (
                <li key={i} className="text-xs text-blue-700">-- {f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Differentials */}
        {(report.differentialConsiderations?.length ?? 0) > 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">?? Differential Considerations</h3>
            <ul className="space-y-1">
              {report.differentialConsiderations!.map((d, i) => (
                <li key={i} className="text-xs text-neutral-700">-- {d}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Patient Consent Summary */}
        {report.patientSummaryLocalized && (
          <div className="bg-[#1a365d]/5 border border-[#1a365d]/15 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#1a365d] uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <span>???</span> Patient Consent Summary (DPDP Act 2023)
            </h3>
            <p className="text-xs text-[#1a365d]/80 leading-relaxed">{report.patientSummaryLocalized}</p>
          </div>
        )}

        {/* B2B Feature 2: Prescription Builder */}
        {entry.report && (
          <PrescriptionBuilder
            entry={entry}
            report={report}
            onFinalize={(rx) => {
              setRxData(rx);
              setShowPrint(true);
            }}
          />
        )}

        {/* Empty state */}
        {!entry.report && (
          <div className="text-center py-16 text-neutral-400">
            <div className="text-4xl mb-3">??</div>
            <p className="text-sm">SOAP report will appear here once the patient completes their intake.</p>
          </div>
        )}
      </div>

      {/* Printable Prescription Overlay */}
      {showPrint && rxData && (
        <PrintablePrescription
          entry={entry}
          report={report}
          rx={rxData}
          clinicProfile={DEFAULT_CLINIC_PROFILE}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}

// --- Main Dashboard -----------------------------------------------------------

export default function ClinicDashboard() {
  const [clinicId, setClinicId] = useState(DEFAULT_CLINIC_ID);
  const [clinicName] = useState(DEFAULT_CLINIC_NAME);
  const [queue, setQueue] = useState<ClinicQueueEntry[]>([]);
  const [selected, setSelected] = useState<ClinicQueueEntry | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [nextToken, setNextToken] = useState(1);
  const [activeTab, setActiveTab] = useState<"queue" | "recall">("queue");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // -- Chronic recall + ROI (memoised - recomputed only when queue changes) --
  const baseUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.protocol + '//' + window.location.host;
  }, []);
  const recallList = useMemo(() => buildRecallList(queue, baseUrl), [queue, baseUrl]);
  const roi = useMemo(() => calculateClinicROI(queue, recallList), [queue, recallList]);

  // -- Sorted queue: red flags first, then by token -------------------------
  const sortedQueue = [...queue].sort((a, b) => {
    if (a.hasRedFlags !== b.hasRedFlags) return a.hasRedFlags ? -1 : 1;
    return a.tokenNumber - b.tokenNumber;
  });

  const stats = {
    waiting: queue.filter((e) => e.status === "waiting").length,
    inConsultation: queue.filter((e) => e.status === "in_consultation").length,
    redFlags: queue.filter((e) => e.hasRedFlags && e.status !== "done").length,
    avgIntakeMins: queue.length > 0
      ? Math.round((queue.reduce((s, e) => s + e.avgIntakeMins, 0) / queue.length) * 10) / 10
      : 0,
  };

  // -- Load from URL params + localStorage ----------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("clinicId")?.trim() || DEFAULT_CLINIC_ID;
    setClinicId(id);

    const localQueue = getClinicQueue(id);
    setQueue(localQueue);
    if (localQueue.length > 0) {
      setNextToken(Math.max(...localQueue.map((e) => e.tokenNumber)) + 1);
    }
  }, []);

  // -- Fetch from server + cross-tab subscription ---------------------------
  const fetchServerQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinic/queue?clinicId=${encodeURIComponent(clinicId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json() as { queue: ClinicQueueEntry[] };
      if (Array.isArray(data.queue)) {
        setQueue(data.queue);
        if (data.queue.length > 0) {
          setNextToken(Math.max(...data.queue.map((e) => e.tokenNumber)) + 1);
        }
      }
    } catch { /* non-critical */ }
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) return;
    void fetchServerQueue();
    pollRef.current = setInterval(fetchServerQueue, POLL_INTERVAL_MS);
    const unsub = subscribeToClinicQueue(clinicId, setQueue);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      unsub();
    };
  }, [clinicId, fetchServerQueue]);

  // Keep selected in sync when queue updates
  useEffect(() => {
    if (selected) {
      const updated = queue.find((e) => e.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [queue, selected]);

  // -- Status change handler -------------------------------------------------
  const handleStatusChange = useCallback(async (id: string, status: ClinicQueueEntry["status"]) => {
    updateClinicQueueStatus(id, status);
    setQueue((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    try {
      await fetch("/api/clinic/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch { /* non-critical */ }
  }, []);

  // -------------------------------------------------------------------------

  return (
    <div className="h-screen flex flex-col bg-neutral-100 overflow-hidden">
      {/* -- Top Bar -------------------------------------------------------- */}
      <header className="bg-[#1a365d] text-white px-5 py-3 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Clinic badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0d9488] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">{clinicName}</div>
            <div className="text-[11px] text-white/60">ID: {clinicId} -- ClinIQ Live Queue</div>
          </div>
        </div>

        {/* Center: Metrics */}
        <div className="hidden sm:flex items-center gap-2">
          <MetricPill label="Waiting" value={stats.waiting} />
          <MetricPill label="Avg Intake" value={`${stats.avgIntakeMins}m`} />
          <MetricPill label="Red Flags" value={stats.redFlags} highlight={stats.redFlags > 0} />
          <MetricPill label="Chronic" value={roi.chronicPatientsCount} />
        </div>

        {/* Right: QR button */}
        <button
          onClick={() => setShowQRModal(true)}
          className="flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <circle cx="17.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
            <path d="M14 14h3v3M14 17.5h1.5M17.5 14v1.5M17.5 17.5v3M20.5 14v3h-3" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Generate QR / WhatsApp</span>
          <span className="sm:hidden">QR</span>
        </button>
      </header>

      {/* -- Split Pane ----------------------------------------------------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane -- 28% -- Live Waiting Room Queue */}
        <aside className="w-[28%] min-w-[220px] max-w-[320px] bg-neutral-50 border-r border-neutral-200 flex flex-col overflow-hidden">
          <>
          {/* Tab switcher */}
          <div className="flex border-b border-neutral-200 bg-white shrink-0">
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === "queue"
                  ? "text-[#1a365d] border-b-2 border-[#1a365d]"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              ?? Live Queue
            </button>
            <button
              onClick={() => setActiveTab("recall")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                activeTab === "recall"
                  ? "text-[#0d9488] border-b-2 border-[#0d9488]"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              ?? ROI & Recalls
              {recallList.length > 0 && (
                <span className="absolute top-1.5 right-2 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {recallList.length}
                </span>
              )}
            </button>
          </div>
          {activeTab === "queue" && (
          <div className="px-4 py-2 border-b border-neutral-100 bg-neutral-50 shrink-0">
            <span className="text-[11px] text-neutral-400">
              {sortedQueue.filter((e) => e.status !== "done").length} active -- {sortedQueue.filter(e => e.status === "done").length} done
            </span>
          </div>
          )}
          </>

          {activeTab === "queue" ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence mode="popLayout">
              {sortedQueue.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-4xl mb-3">??</div>
                  <p className="text-xs text-neutral-400">No patients yet.</p>
                  <p className="text-xs text-neutral-400 mt-1">Share the QR to start intake.</p>
                </motion.div>
              ) : (
                sortedQueue.map((entry) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    isSelected={selected?.id === entry.id}
                    onSelect={() => setSelected(entry)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
          ) : (
          <div className="flex-1 overflow-y-auto">
            <RecallPanel roi={roi} recallList={recallList} />
          </div>
          )}
        </aside>

        {/* Right Pane -- 72% -- Active SOAP Workspace */}
        <main className="flex-1 overflow-hidden">
          {selected ? (
            <SOAPWorkspace
              entry={selected}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-4 p-8">
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-500">Select a patient from the queue</p>
                <p className="text-xs text-neutral-400 mt-1">Their AI-generated SOAP note will appear here</p>
              </div>
              <button
                onClick={() => setShowQRModal(true)}
                className="mt-2 flex items-center gap-2 border border-[#0d9488] text-[#0d9488] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0d9488]/5 transition-colors"
              >
                Share intake QR with patients ?
              </button>
            </div>
          )}
        </main>
      </div>

      {/* -- QR Modal ------------------------------------------------------- */}
      <AnimatePresence>
        {showQRModal && (
          <QRModal
            clinicId={clinicId}
            clinicName={clinicName}
            nextToken={nextToken}
            onClose={() => setShowQRModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
