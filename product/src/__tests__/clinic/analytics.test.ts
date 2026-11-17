import { describe, it, expect } from "vitest";
import {
  detectChronicConditions,
  buildRecallRecord,
  buildRecallList,
  calculateClinicROI,
} from "@/lib/clinicAnalytics";
import type { ClinicQueueEntry } from "@/lib/clinicQueueStore";

function mockEntry(overrides?: Partial<ClinicQueueEntry>): ClinicQueueEntry {
  return {
    id: "clinic-1::1",
    clinicId: "clinic-1",
    tokenNumber: 1,
    token: "A-001",
    patientName: "Ramesh Sharma",
    patientAge: "58",
    patientGender: "Male",
    language: "hi",
    chiefComplaint: "High blood sugar and fatigue",
    redFlags: [],
    hasRedFlags: false,
    icd10Suggestions: ["E11 - Type 2 diabetes mellitus"],
    intakeStartedAt: Date.now() - 300_000,
    intakeCompletedAt: Date.now(),
    avgIntakeMins: 5.0,
    status: "waiting",
    report: {
      chiefComplaint: "High blood sugar and fatigue",
      historyOfPresentIllness: "Patient reports elevated fasting glucose for 3 months",
      pastMedicalHistory: "Hypertension for 5 years",
      medications: ["Metformin 500mg", "Telmisartan 40mg"],
      allergies: [],
      familyAndSocialHistory: "Father had diabetes",
      reviewOfSystems: "No chest pain",
      redFlags: [],
      icd10Suggestions: ["E11 - Type 2 diabetes mellitus", "I10 - Essential hypertension"],
      differentialConsiderations: ["Uncontrolled T2DM"],
      keyLabFindings: ["HbA1c 8.4%"],
      patientSummaryLocalized: "मधुमेह और उच्च रक्तचाप की जांच",
    },
    ...overrides,
  };
}

describe("clinicAnalytics", () => {
  it("detects chronic conditions from ICD-10 and clinical keywords", () => {
    const entry = mockEntry();
    const conditions = detectChronicConditions(entry);
    expect(conditions).toContain("Diabetes");
    expect(conditions).toContain("Hypertension");
  });

  it("builds a localized WhatsApp recall record for Hindi patient", () => {
    const entry = mockEntry({ language: "hi" });
    const record = buildRecallRecord(entry, "https://test.cliniq.health");
    expect(record).not.toBeNull();
    expect(record?.patientName).toBe("Ramesh Sharma");
    expect(record?.primaryTag).toBe("Diabetes");
    expect(record?.recallDays).toBe(30);
    expect(record?.whatsappUrl).toContain("https%3A%2F%2Ftest.cliniq.health%2Fpatient%2Fconsent");
    expect(record?.whatsappUrl).toContain("%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"); // नमस्ते
  });

  it("builds a localized WhatsApp recall record for English patient", () => {
    const entry = mockEntry({ language: "en" });
    const record = buildRecallRecord(entry, "https://test.cliniq.health");
    expect(record).not.toBeNull();
    expect(record?.whatsappUrl).toContain("Hello%20Ramesh%20Sharma");
    expect(record?.whatsappUrl).toContain("Follow-Up%20Reminder");
  });

  it("calculates clinic ROI metrics correctly", () => {
    const entry1 = mockEntry({ id: "c1::1", avgIntakeMins: 4.0 });
    const entry2 = mockEntry({
      id: "c1::2",
      tokenNumber: 2,
      patientName: "Sunita Devi",
      avgIntakeMins: 6.0,
      hasRedFlags: true,
      redFlags: ["Severe dyspnea"],
    });

    const queue = [entry1, entry2];
    const recallList = buildRecallList(queue, "https://test.cliniq.health");
    const roi = calculateClinicROI(queue, recallList);

    expect(roi.totalIntakes).toBe(2);
    expect(roi.completedIntakes).toBe(2);
    expect(roi.avgIntakeLatencyMins).toBe(5.0);
    // 2 intakes * 6.5 min / 60 = 0.2 hrs
    expect(roi.doctorHoursSaved).toBe(0.2);
    expect(roi.chronicPatientsCount).toBe(2);
    expect(roi.redFlagsDetected).toBe(1);
    expect(roi.projectedMonthlyRevenueLift).toBeGreaterThan(0);
    expect(roi.estimatedAnnualRevenueLift).toBe(roi.projectedMonthlyRevenueLift * 12);
  });

  it("handles empty queue without NaN or errors", () => {
    const roi = calculateClinicROI([], []);
    expect(roi.totalIntakes).toBe(0);
    expect(roi.completedIntakes).toBe(0);
    expect(roi.doctorHoursSaved).toBe(0);
    expect(roi.avgIntakeLatencyMins).toBe(0);
    expect(roi.projectedMonthlyRevenueLift).toBe(0);
  });
});
