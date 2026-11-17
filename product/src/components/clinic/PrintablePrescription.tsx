"use client";

// src/components/clinic/PrintablePrescription.tsx
// Print-optimised letterhead view for ClinIQ prescriptions.
// Clicking "Approve & Print Rx (PDF)" triggers window.print().
// Everything inside #cliniq-rx-print is printed; the modal chrome is screen-only.

import { useCallback } from "react";
import type { ClinIQClinicalReport } from "@/lib/sessionStore";
import type { ClinicQueueEntry } from "@/lib/clinicQueueStore";
import type { RxData, RxMedication } from "./PrescriptionBuilder";

// --- Types -------------------------------------------------------------------

export interface ClinicProfile {
  clinicName: string;
  doctorName: string;
  qualification: string;
  regNo: string;
  address: string;
  phone?: string;
}

interface PrintablePrescriptionProps {
  entry: ClinicQueueEntry;
  report: Partial<ClinIQClinicalReport>;
  rx: RxData;
  clinicProfile: ClinicProfile;
  onClose: () => void;
}

// --- Helpers -----------------------------------------------------------------

function today(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildWhatsAppRxText(
  entry: ClinicQueueEntry,
  rx: RxData,
  profile: ClinicProfile
): string {
  const meds = rx.medications
    .map(
      (m: RxMedication, i: number) =>
        `${i + 1}. ${m.name} - ${m.dosage} ${m.timing} - ${m.duration}`
    )
    .join("\n");

  const text = [
    `?? *Prescription - ${profile.clinicName}*`,
    `Doctor: ${profile.doctorName} (${profile.qualification})`,
    `Date: ${today()} | Token #${entry.tokenNumber}`,
    ``,
    `*Patient:* ${entry.patientName}${entry.patientAge ? `, ${entry.patientAge}` : ""}${entry.patientGender ? ` / ${entry.patientGender}` : ""}`,
    ``,
    `*Diagnosis:* ${rx.finalDiagnosis || rx.chiefComplaintEdited}`,
    ``,
    `*Medications:*`,
    meds || "-",
    ``,
    rx.advice ? `*Advice:* ${rx.advice}` : "",
    rx.followUpDate ? `*Follow-up:* ${rx.followUpDate}` : "",
    ``,
    `_Powered by ClinIQ - AI Pre-Consultation System_`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// --- Component ---------------------------------------------------------------

export function PrintablePrescription({
  entry,
  report,
  rx,
  clinicProfile,
  onClose,
}: PrintablePrescriptionProps) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const whatsappUrl = buildWhatsAppRxText(entry, rx, clinicProfile);

  const vitals = rx.vitals;

  return (
    <>
      {/* -- Print CSS injected as a style tag (screen: modal overlay) -- */}
      <style>{`
        @media print {
          body > *:not(#cliniq-rx-print-portal) { display: none !important; }
          #cliniq-rx-print-portal { display: block !important; position: static !important; }
          #cliniq-rx-print { 
            margin: 0; padding: 20mm 18mm; 
            font-family: 'Times New Roman', serif;
            font-size: 11pt; color: #000;
            page-break-after: avoid;
          }
          .print-hidden { display: none !important; }
          .print-only { display: block !important; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #aaa; padding: 4px 8px; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      {/* -- Screen: modal overlay -- */}
      <div
        id="cliniq-rx-print-portal"
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4"
      >
        {/* Modal chrome (screen-only close / action bar) */}
        <div className="w-full max-w-[720px]">
          {/* Action bar - hidden on print */}
          <div className="print-hidden mb-3 flex items-center justify-between gap-3">
            <h2 className="text-white font-semibold text-sm">
              Prescription Preview - Token #{entry.tokenNumber}
            </h2>
            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share via WhatsApp
              </a>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-[#1a365d] hover:bg-[#1e4080] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Approve &amp; Print Rx (PDF)
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
          </div>

          {/* -- Printable area -- */}
          <div
            id="cliniq-rx-print"
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
          >
            {/* -- Letterhead -- */}
            <div
              style={{
                background: "linear-gradient(135deg, #1a365d 0%, #1e4080 100%)",
                padding: "24px 32px 20px",
                color: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                {/* Left: clinic info */}
                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {clinicProfile.clinicName}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginTop: 4 }}>
                    {clinicProfile.doctorName}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.8, marginTop: 2 }}>
                    {clinicProfile.qualification} &nbsp;|&nbsp; Reg. No:{" "}
                    {clinicProfile.regNo}
                  </div>
                  {clinicProfile.phone && (
                    <div style={{ fontSize: "12px", opacity: 0.75, marginTop: 2 }}>
                      ? {clinicProfile.phone}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", opacity: 0.7, marginTop: 4 }}>
                    {clinicProfile.address}
                  </div>
                </div>

                {/* Right: date + token */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.75,
                      marginBottom: 8,
                    }}
                  >
                    {today()}
                  </div>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: 10,
                      padding: "8px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "10px", opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Queue Token
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>
                      #{entry.tokenNumber}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* -- Patient demographics bar -- */}
            <div
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                padding: "12px 32px",
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                alignItems: "center",
              }}
            >
              <DemoField label="Patient" value={entry.patientName} bold />
              {entry.patientAge && (
                <DemoField label="Age" value={entry.patientAge} />
              )}
              {entry.patientGender && (
                <DemoField label="Gender" value={entry.patientGender} />
              )}
              <DemoField
                label="Language"
                value={entry.language.toUpperCase()}
              />
              <DemoField
                label="DPDP Consent ID"
                value={entry.id.slice(0, 16) + "-"}
                mono
              />
            </div>

            {/* -- Vitals bar -- */}
            <div
              style={{
                borderBottom: "1px solid #e2e8f0",
                padding: "10px 32px",
                display: "flex",
                gap: "32px",
                background: "#fff",
              }}
            >
              {[
                { label: "BP", value: vitals.bp },
                { label: "Pulse", value: vitals.pulse ? `${vitals.pulse} bpm` : "" },
                { label: "Temp", value: vitals.temp ? `${vitals.temp} -F` : "" },
                { label: "SpO2", value: vitals.spo2 ? `${vitals.spo2}%` : "" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: value ? "#0f172a" : "#94a3b8",
                    }}
                  >
                    {value || "-"}
                  </div>
                </div>
              ))}
            </div>

            {/* -- Body -- */}
            <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Chief Complaint */}
              <Section
                title="Chief Complaint"
                accent="#1a365d"
              >
                <p style={{ margin: 0, fontSize: "13px", color: "#0f172a" }}>
                  {rx.chiefComplaintEdited ||
                    report.chiefComplaint ||
                    "-"}
                </p>
              </Section>

              {/* Clinical Summary / HPI */}
              <Section title="Clinical Summary (HPI)" accent="#1a365d">
                <p style={{ margin: 0, fontSize: "13px", color: "#0f172a", lineHeight: 1.65 }}>
                  {rx.hpiEdited ||
                    report.historyOfPresentIllness ||
                    "-"}
                </p>
              </Section>

              {/* Allergies - bold red */}
              {(report.allergies?.length ?? 0) > 0 && (
                <div
                  style={{
                    border: "1px solid #fca5a5",
                    borderRadius: 10,
                    padding: "10px 16px",
                    background: "#fff7f7",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#dc2626",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    ? ALLERGIES
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#b91c1c",
                    }}
                  >
                    {report.allergies!.join(" - ")}
                  </p>
                </div>
              )}

              {/* Diagnosis */}
              {rx.finalDiagnosis && (
                <Section title="Final Diagnosis" accent="#0d9488">
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    {rx.finalDiagnosis}
                  </p>
                </Section>
              )}

              {/* Rx Medication table */}
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1a365d",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: "18px" }}>?</span> Medications
                </div>
                {rx.medications.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
                    No medications prescribed.
                  </p>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "12px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        {["#", "Medicine Name", "Dosage", "Timing", "Duration"].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                border: "1px solid #cbd5e1",
                                padding: "6px 10px",
                                textAlign: "left",
                                fontWeight: 600,
                                color: "#334155",
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rx.medications.map((med: RxMedication, idx: number) => (
                        <tr
                          key={med.id}
                          style={{
                            background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                          }}
                        >
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 10px", color: "#64748b" }}>
                            {idx + 1}
                          </td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 10px", fontWeight: 600, color: "#0f172a" }}>
                            {med.name}
                          </td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 10px", color: "#334155" }}>
                            {med.dosage}
                          </td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 10px", color: "#334155" }}>
                            {med.timing}
                          </td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 10px", color: "#334155" }}>
                            {med.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Advice */}
              {rx.advice && (
                <Section title="Advice & Instructions" accent="#1a365d">
                  <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: 1.6 }}>
                    {rx.advice}
                  </p>
                </Section>
              )}

              {/* Follow-up */}
              {rx.followUpDate && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 10,
                  }}
                >
                  <span style={{ fontSize: "16px" }}>??</span>
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#16a34a",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      Review / Follow-up:
                    </span>{" "}
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                      {rx.followUpDate}
                    </span>
                    {(rx.followUpDays ?? 0) > 0 && (
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {" "}(after {rx.followUpDays} days)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Doctor signature footer */}
              <div
                style={{
                  borderTop: "1px dashed #cbd5e1",
                  paddingTop: 20,
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "55%" }}>
                  <div>?? DPDP Consent ID: <span style={{ fontFamily: "monospace" }}>{(entry.sessionId ?? entry.id).slice(0, 20)}</span></div>
                  <div style={{ marginTop: 3 }}>
                    Generated by ClinIQ AI Pre-Consultation System &mdash; SIH 2026 PS 26047
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      borderBottom: "1.5px solid #334155",
                      paddingBottom: 4,
                      marginBottom: 4,
                      minWidth: 160,
                    }}
                  />
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                    {clinicProfile.doctorName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {clinicProfile.qualification}
                  </div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                    Reg. {clinicProfile.regNo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Small helpers ------------------------------------------------------------

function DemoField({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: bold ? 600 : 500,
          color: "#0f172a",
          fontFamily: mono ? "monospace" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${accent}`,
        paddingLeft: 14,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
