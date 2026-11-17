"use client";

// src/components/clinic/PrescriptionBuilder.tsx
// Editable Final Rx Builder --- doctor approves AI summary and writes prescriptions.
// All state is local; parent receives the finalized RxData via onFinalize().

import { useState, useCallback, useId } from "react";
import { cn } from "@/lib/utils";
import type { ClinIQClinicalReport } from "@/lib/sessionStore";
import type { ClinicQueueEntry } from "@/lib/clinicQueueStore";

// --------- Types ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export interface RxMedication {
  id: string;
  name: string;
  dosage: string;    // e.g. "1-0-1"
  timing: string;   // e.g. "After Food"
  duration: string; // e.g. "5 Days"
  notes: string;
}

export interface RxData {
  finalDiagnosis: string;
  chiefComplaintEdited: string;
  hpiEdited: string;
  medications: RxMedication[];
  advice: string;
  followUpDays: number | null;
  followUpDate: string;
  vitals: { bp: string; pulse: string; temp: string; spo2: string };
  approvedAt: number;
}

interface Props {
  entry: ClinicQueueEntry;
  report: Partial<ClinIQClinicalReport>;
  onFinalize: (rx: RxData) => void;
}

// --------- Quick-fill templates ---------------------------------------------------------------------------------------------------------------------------------------------------------------

const MED_TEMPLATES: Array<{ label: string; name: string; dosage: string; timing: string; duration: string }> = [
  { label: "Tab. Paracetamol 500mg", name: "Tab. Paracetamol 500mg", dosage: "1-0-1", timing: "After Food", duration: "5 Days" },
  { label: "Tab. Amoxicillin 500mg", name: "Tab. Amoxicillin 500mg", dosage: "1-0-1", timing: "After Food", duration: "5 Days" },
  { label: "Tab. Pantoprazole 40mg", name: "Tab. Pantoprazole 40mg", dosage: "1-0-0", timing: "Before Food", duration: "14 Days" },
  { label: "Syp. Cetirizine 5ml", name: "Syp. Cetirizine 5ml", dosage: "0-0-1", timing: "Before Sleep", duration: "5 Days" },
  { label: "Tab. Metformin 500mg", name: "Tab. Metformin 500mg", dosage: "1-0-1", timing: "After Food", duration: "30 Days" },
  { label: "Tab. Amlodipine 5mg", name: "Tab. Amlodipine 5mg", dosage: "1-0-0", timing: "Morning", duration: "30 Days" },
  { label: "Tab. Azithromycin 500mg", name: "Tab. Azithromycin 500mg", dosage: "1-0-0", timing: "After Food", duration: "3 Days" },
  { label: "Cap. Omeprazole 20mg", name: "Cap. Omeprazole 20mg", dosage: "1-0-0", timing: "Before Food", duration: "14 Days" },
];

const FOLLOW_UP_PRESETS = [3, 5, 7, 14, 30] as const;
const TIMING_OPTIONS = ["After Food", "Before Food", "With Food", "Morning", "Night", "Before Sleep", "SOS"] as const;
const DOSAGE_PRESETS = ["1-0-0", "0-0-1", "1-0-1", "1-1-1", "1-1-0", "0-1-1"] as const;

function uid(): string {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : `med_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function formatFollowUpDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// --------- Sub-components ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full text-sm text-neutral-800 border border-neutral-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition-colors bg-white"
    />
  );
}

function MedRow({
  med,
  idx,
  onChange,
  onRemove,
}: {
  med: RxMedication;
  idx: number;
  onChange: (id: string, field: keyof RxMedication, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-start bg-white border border-neutral-200 rounded-xl p-3">
      {/* Medicine name */}
      <div>
        <FieldLabel>Medicine</FieldLabel>
        <input
          value={med.name}
          onChange={(e) => onChange(med.id, "name", e.target.value)}
          placeholder="e.g. Tab. Paracetamol 500mg"
          className="w-full text-sm border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] bg-white"
        />
      </div>
      {/* Dosage */}
      <div>
        <FieldLabel>Dosage</FieldLabel>
        <select
          value={DOSAGE_PRESETS.includes(med.dosage as typeof DOSAGE_PRESETS[number]) ? med.dosage : "custom"}
          onChange={(e) => { if (e.target.value !== "custom") onChange(med.id, "dosage", e.target.value); }}
          className="w-full text-sm border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
        >
          {DOSAGE_PRESETS.map((d) => <option key={d} value={d}>{d}</option>)}
          <option value="custom">Custom</option>
        </select>
        {!DOSAGE_PRESETS.includes(med.dosage as typeof DOSAGE_PRESETS[number]) && (
          <input
            value={med.dosage}
            onChange={(e) => onChange(med.id, "dosage", e.target.value)}
            placeholder="e.g. 1-1-1"
            className="mt-1 w-full text-sm border border-neutral-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
          />
        )}
      </div>
      {/* Timing */}
      <div>
        <FieldLabel>Timing</FieldLabel>
        <select
          value={med.timing}
          onChange={(e) => onChange(med.id, "timing", e.target.value)}
          className="w-full text-sm border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
        >
          {TIMING_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {/* Duration */}
      <div>
        <FieldLabel>Duration</FieldLabel>
        <input
          value={med.duration}
          onChange={(e) => onChange(med.id, "duration", e.target.value)}
          placeholder="e.g. 5 Days"
          className="w-full text-sm border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 bg-white"
        />
      </div>
      {/* Remove */}
      <button
        onClick={() => onRemove(med.id)}
        className="mt-5 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors shrink-0"
        aria-label={`Remove medication ${idx + 1}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// --------- Main Component ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export function PrescriptionBuilder({ entry, report, onFinalize }: Props) {
  const formId = useId();

  const [finalDiagnosis, setFinalDiagnosis] = useState(
    report.differentialConsiderations?.[0] ?? report.chiefComplaint ?? ""
  );
  const [chiefComplaintEdited, setChiefComplaintEdited] = useState(
    report.chiefComplaint ?? ""
  );
  const [hpiEdited, setHpiEdited] = useState(
    report.historyOfPresentIllness ?? ""
  );
  const [medications, setMedications] = useState<RxMedication[]>(() => {
    // Pre-populate from AI if medications exist
    if (report.medications && report.medications.length > 0) {
      return report.medications.map((m) => ({
        id: uid(),
        name: m,
        dosage: "1-0-1",
        timing: "After Food",
        duration: "5 Days",
        notes: "",
      }));
    }
    return [{ id: uid(), name: "", dosage: "1-0-1", timing: "After Food", duration: "5 Days", notes: "" }];
  });
  const [advice, setAdvice] = useState(
    "Rest adequately. Stay well hydrated. Avoid junk food. Return immediately if symptoms worsen."
  );
  const [followUpDays, setFollowUpDays] = useState<number | null>(5);
  const [vitals, setVitals] = useState({ bp: "", pulse: "", temp: "", spo2: "" });
  const [showTemplates, setShowTemplates] = useState(false);

  const addMed = useCallback(() => {
    setMedications((prev) => [
      ...prev,
      { id: uid(), name: "", dosage: "1-0-1", timing: "After Food", duration: "5 Days", notes: "" },
    ]);
  }, []);

  const removeMed = useCallback((id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const changeMed = useCallback((id: string, field: keyof RxMedication, value: string) => {
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
  }, []);

  const applyTemplate = useCallback((tpl: typeof MED_TEMPLATES[number]) => {
    setMedications((prev) => [
      ...prev,
      { id: uid(), name: tpl.name, dosage: tpl.dosage, timing: tpl.timing, duration: tpl.duration, notes: "" },
    ]);
    setShowTemplates(false);
  }, []);

  const handleFinalize = useCallback(() => {
    const rxData: RxData = {
      finalDiagnosis,
      chiefComplaintEdited,
      hpiEdited,
      medications: medications.filter((m) => m.name.trim()),
      advice,
      followUpDays,
      followUpDate: followUpDays ? formatFollowUpDate(followUpDays) : "",
      vitals,
      approvedAt: Date.now(),
    };
    onFinalize(rxData);
  }, [finalDiagnosis, chiefComplaintEdited, hpiEdited, medications, advice, followUpDays, vitals, onFinalize]);

  return (
    <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-5 space-y-5" id={formId}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1a365d] flex items-center gap-2">
            <span className="text-lg">---</span>
            Doctor's Final Diagnosis & Prescription
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Review AI summary, edit if needed, then approve to generate printable Rx</p>
        </div>
      </div>

      {/* Vitals bar */}
      <div>
        <FieldLabel>Patient Vitals (optional --- recorded at reception)</FieldLabel>
        <div className="grid grid-cols-4 gap-2">
          {(["bp", "pulse", "temp", "spo2"] as const).map((key) => (
            <div key={key}>
              <span className="block text-[10px] text-neutral-400 mb-0.5 uppercase font-semibold">
                {key === "bp" ? "BP (mmHg)" : key === "pulse" ? "Pulse (bpm)" : key === "temp" ? "Temp (--F)" : "SpO--- (%)"}
              </span>
              <input
                type="text"
                value={vitals[key]}
                onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                placeholder={key === "bp" ? "120/80" : key === "pulse" ? "78" : key === "temp" ? "98.6" : "98%"}
                className="w-full text-sm border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Final Diagnosis */}
      <div>
        <FieldLabel>Final Diagnosis / Clinical Impression</FieldLabel>
        <input
          value={finalDiagnosis}
          onChange={(e) => setFinalDiagnosis(e.target.value)}
          placeholder="e.g. Acute viral fever, Dengue suspect --- awaiting NS1"
          className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition-colors"
        />
      </div>

      {/* Editable Chief Complaint + HPI */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Chief Complaint (editable)</FieldLabel>
          <TextArea
            value={chiefComplaintEdited}
            onChange={setChiefComplaintEdited}
            rows={2}
            placeholder="Patient's main presenting complaint---"
          />
        </div>
        <div>
          <FieldLabel>History Summary (editable)</FieldLabel>
          <TextArea
            value={hpiEdited}
            onChange={setHpiEdited}
            rows={2}
            placeholder="Brief HPI for the prescription note---"
          />
        </div>
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel>--- Medications</FieldLabel>
          <div className="flex items-center gap-2">
            {/* Quick templates */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates((v) => !v)}
                className="text-xs text-[#0d9488] font-semibold hover:underline"
              >
                Quick-fill template ---
              </button>
              {showTemplates && (
                <div className="absolute right-0 top-6 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 min-w-[220px]">
                  {MED_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      onClick={() => applyTemplate(tpl)}
                      className="w-full text-left text-xs px-3 py-2 hover:bg-neutral-50 text-neutral-700"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={addMed}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-[#0d9488] hover:bg-[#0f766e] px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>+</span> Add Medicine
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {medications.map((med, idx) => (
            <MedRow
              key={med.id}
              med={med}
              idx={idx}
              onChange={changeMed}
              onRemove={removeMed}
            />
          ))}
          {medications.length === 0 && (
            <p className="text-xs text-neutral-400 text-center py-4 border border-dashed border-neutral-200 rounded-xl">
              No medications added yet. Use "+ Add Medicine" or a template.
            </p>
          )}
        </div>
      </div>

      {/* Advice */}
      <div>
        <FieldLabel>Advice / Instructions</FieldLabel>
        <TextArea
          value={advice}
          onChange={setAdvice}
          rows={2}
          placeholder="Diet, activity, red-flag signs to watch for---"
        />
      </div>

      {/* Follow-up */}
      <div>
        <FieldLabel>Follow-up</FieldLabel>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-500">Review after:</span>
          {FOLLOW_UP_PRESETS.map((days) => (
            <button
              key={days}
              onClick={() => setFollowUpDays(days)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors",
                followUpDays === days
                  ? "bg-[#1a365d] text-white border-[#1a365d]"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0d9488]"
              )}
            >
              {days} days
            </button>
          ))}
          <button
            onClick={() => setFollowUpDays(null)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors",
              followUpDays === null
                ? "bg-[#1a365d] text-white border-[#1a365d]"
                : "bg-white text-neutral-600 border-neutral-200"
            )}
          >
            No follow-up
          </button>
          {followUpDays && (
            <span className="text-xs text-[#0d9488] font-semibold">
              --- {formatFollowUpDate(followUpDays)}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleFinalize}
          className="flex items-center gap-2 bg-[#1a365d] hover:bg-[#152c4a] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Approve & Generate Prescription
        </button>
        <p className="text-xs text-neutral-400">Review carefully before printing --- this becomes the official Rx.</p>
      </div>
    </div>
  );
}
