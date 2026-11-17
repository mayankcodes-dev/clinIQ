import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  LOCAL_CLINICAL_KNOWLEDGE,
  type ClinicalGuidelineChunk,
} from "@/lib/rag/localClinicalKnowledge";
import { buildSummaryFromMessages, type ChatSummaryMessage } from "@/lib/buildSummary";
import {
  publishPatientToClinicQueue,
  getClinicQueue,
  updateClinicQueueStatus,
  parseIntakeParams,
} from "@/lib/clinicQueueStore";
import {
  detectChronicConditions,
  buildRecallRecord,
  calculateClinicROI,
} from "@/lib/clinicAnalytics";
import { fixOcrDosage } from "@/lib/ocrUtils";

// In-memory localStorage mock for node test runner
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}

describe("E2E Integration: Patient Intake -> RAG Grounding -> Triage -> Rx -> Recall", () => {
  let memStorage: MemoryStorage;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    memStorage = new MemoryStorage();
    // @ts-expect-error mock window
    globalThis.window = {
      localStorage: memStorage,
      location: {
        search: "?clinicId=delhi-opd-09&token=18",
        protocol: "https:",
        host: "app.cliniq.health",
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    vi.restoreAllMocks();
  });

  it("executes the complete clinical lifecycle end-to-end", () => {
    // ── 1. Intake routing from QR / WhatsApp Standee ──
    const intakeParams = parseIntakeParams();
    expect(intakeParams.clinicId).toBe("delhi-opd-09");
    expect(intakeParams.tokenNumber).toBe(18);

    // ── 2. Local Clinical RAG Protocol Matching ──
    // Patient reports acute febrile illness with joint pain
    const feverCluster = LOCAL_CLINICAL_KNOWLEDGE.find(
      (c) => c.symptomCluster === "fever_dengue_malaria"
    );
    expect(feverCluster).toBeDefined();
    expect(
      feverCluster?.redFlagSymptoms.some((s) => s.includes("petechiae/purpura"))
    ).toBe(true);
    expect(feverCluster?.mandatoryFollowUpQuestions.length).toBeGreaterThan(0);
    expect(feverCluster?.icd10Mappings.some((m) => m.code === "A90")).toBe(true); // Dengue fever

    // ── 3. Multilingual AI Interview Turns & Summary Extraction ──
    const turns: ChatSummaryMessage[] = [
      { role: "ai", text: "What primary symptoms are bothering you?" },
      { role: "patient", text: "High fever and severe retro-orbital pain", stage: "chief_complaint" },
      { role: "ai", text: "When did the fever start and do you have chills?" },
      { role: "patient", text: "Started 3 days ago with shaking chills and vomiting", stage: "hpi" },
      { role: "ai", text: "Any known chronic medical conditions?" },
      { role: "patient", text: "Type 2 Diabetes mellitus for 4 years", stage: "past_history" },
      { role: "ai", text: "Are you currently taking any prescription medications?" },
      { role: "patient", text: "Metformin 500mg daily", stage: "drug_allergy" },
    ];

    const structuredSummary = buildSummaryFromMessages(turns);
    expect(structuredSummary.chiefComplaint).toBe("High fever and severe retro-orbital pain");
    expect(structuredSummary.hpi).toContain("Started 3 days ago");
    expect(structuredSummary.pastHistory).toBe("Type 2 Diabetes mellitus for 4 years");
    expect(structuredSummary.currentMedications).toBe("Metformin 500mg daily");

    // ── 4. OCR Lab & Prescription Normalization ──
    // Optical OCR artifact correction: "5OOmg" -> "500mg"
    const correctedDosage = fixOcrDosage("Metformin 5OOmg");
    expect(correctedDosage).toBe("Metformin 500mg");

    // ── 5. Publish to Live Doctor Triage Queue ──
    const queueEntry = publishPatientToClinicQueue({
      clinicId: intakeParams.clinicId,
      tokenNumber: intakeParams.tokenNumber,
      patientName: "Vikram Malhotra",
      patientAge: "46",
      patientGender: "Male",
      language: "hi",
      chiefComplaint: structuredSummary.chiefComplaint,
      intakeStartedAt: Date.now() - 240_000, // 4 minutes ago
      sessionId: "session-dpdp-uuid-98765",
      report: {
        chiefComplaint: structuredSummary.chiefComplaint,
        historyOfPresentIllness: structuredSummary.hpi,
        pastMedicalHistory: structuredSummary.pastHistory,
        medications: ["Metformin 500mg"],
        allergies: [],
        familyAndSocialHistory: "Non-smoker",
        reviewOfSystems: "Retro-orbital headache, chills",
        redFlags: ["High fever reported - assess for infection source and hydration"],
        icd10Suggestions: ["A90 - Dengue fever", "E11 - Type 2 diabetes mellitus"],
        differentialConsiderations: ["Dengue fever", "Malaria", "Viral fever with T2DM"],
        keyLabFindings: ["Platelets: 95,000 /uL (Low)"],
        patientSummaryLocalized: "3 दिन से तेज बुखार और उल्टी",
      },
    });

    expect(queueEntry.id).toBe("delhi-opd-09::18");
    expect(queueEntry.token).toBe("A-018");
    expect(queueEntry.status).toBe("waiting");
    expect(queueEntry.hasRedFlags).toBe(true);
    expect(queueEntry.sessionId).toBe("session-dpdp-uuid-98765");

    // Verify queue retrieval
    const activeQueue = getClinicQueue("delhi-opd-09");
    expect(activeQueue.length).toBe(1);
    expect(activeQueue[0].patientName).toBe("Vikram Malhotra");

    // ── 6. Doctor Consult: Status Progression ──
    updateClinicQueueStatus("delhi-opd-09::18", "in_consultation");
    const updatedQueue1 = getClinicQueue("delhi-opd-09");
    expect(updatedQueue1[0].status).toBe("in_consultation");

    updateClinicQueueStatus("delhi-opd-09::18", "done");
    const updatedQueue2 = getClinicQueue("delhi-opd-09");
    expect(updatedQueue2[0].status).toBe("done");

    // ── 7. Chronic Care WhatsApp Recall Engine & Pilot ROI ──
    const conditions = detectChronicConditions(updatedQueue2[0]);
    expect(conditions).toContain("Diabetes");

    const recallRecord = buildRecallRecord(updatedQueue2[0], "https://app.cliniq.health");
    expect(recallRecord).not.toBeNull();
    expect(recallRecord?.primaryTag).toBe("Diabetes");
    expect(recallRecord?.recallDays).toBe(30);
    expect(recallRecord?.whatsappUrl).toContain("wa.me");
    expect(recallRecord?.whatsappUrl).toContain("delhi-opd-09");

    const roi = calculateClinicROI(updatedQueue2, [recallRecord!]);
    expect(roi.completedIntakes).toBe(1);
    expect(roi.chronicPatientsCount).toBe(1);
    expect(roi.doctorHoursSaved).toBeGreaterThan(0);
    expect(roi.projectedMonthlyRevenueLift).toBe(500); // Diabetes standard recall fee
    expect(roi.estimatedAnnualRevenueLift).toBe(6000);
  });
});
