import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getClinicQueue,
  publishPatientToClinicQueue,
  updateClinicQueueStatus,
  parseIntakeParams,
} from "@/lib/clinicQueueStore";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}

describe("clinicQueueStore", () => {
  let memStorage: MemoryStorage;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    memStorage = new MemoryStorage();
    // @ts-expect-error mock window for node environment
    globalThis.window = {
      localStorage: memStorage,
      location: {
        search: "?clinicId=city-health&token=42",
        protocol: "http:",
        host: "localhost:3000",
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

  it("publishes patient to clinic queue in localStorage", () => {
    const entry = publishPatientToClinicQueue({
      clinicId: "city-health",
      tokenNumber: 42,
      patientName: "Ananya Rao",
      language: "en",
      chiefComplaint: "Persistent dry cough",
      intakeStartedAt: Date.now() - 120_000,
      report: {
        chiefComplaint: "Persistent dry cough",
        historyOfPresentIllness: "Cough for 2 weeks",
        pastMedicalHistory: "None",
        medications: [],
        allergies: [],
        familyAndSocialHistory: "Non-smoker",
        reviewOfSystems: "Clear lungs",
        redFlags: [],
        icd10Suggestions: ["R05 - Cough"],
        differentialConsiderations: ["Post-viral cough"],
        keyLabFindings: [],
        patientSummaryLocalized: "2 weeks dry cough",
      },
      sessionId: "sess-abc-123",
    });

    expect(entry.id).toBe("city-health::42");
    expect(entry.tokenNumber).toBe(42);
    expect(entry.token).toBe("A-042");
    expect(entry.sessionId).toBe("sess-abc-123");
    expect(entry.status).toBe("waiting");

    const queue = getClinicQueue("city-health");
    expect(queue.length).toBe(1);
    expect(queue[0].patientName).toBe("Ananya Rao");
  });

  it("updates queue status in localStorage", () => {
    publishPatientToClinicQueue({
      clinicId: "city-health",
      tokenNumber: 1,
      patientName: "Patient One",
      language: "hi",
      chiefComplaint: "Fever",
      intakeStartedAt: Date.now(),
      report: {
        chiefComplaint: "Fever",
        historyOfPresentIllness: "Fever for 1 day",
        pastMedicalHistory: "None",
        medications: [],
        allergies: [],
        familyAndSocialHistory: "None",
        reviewOfSystems: "Normal",
        redFlags: [],
        icd10Suggestions: ["R50 - Fever"],
        differentialConsiderations: ["Viral fever"],
        keyLabFindings: [],
        patientSummaryLocalized: "बुखार",
      },
    });

    updateClinicQueueStatus("city-health::1", "in_consultation");

    const queue = getClinicQueue("city-health");
    expect(queue[0].status).toBe("in_consultation");
  });

  it("parses intake parameters from URL query string", () => {
    const params = parseIntakeParams();
    expect(params.clinicId).toBe("city-health");
    expect(params.tokenNumber).toBe(42);
  });
});
