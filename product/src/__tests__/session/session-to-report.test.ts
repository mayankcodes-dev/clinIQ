import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SessionStore,
  messagesFromLegacy,
  sessionTurnsToLegacyMessages,
  type InterviewTurn,
  ACTIVE_SESSION_KEY,
} from "@/lib/sessionStore";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}

describe("Localhost Session Recording & Report Retrieval", () => {
  let memStorage: MemoryStorage;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    memStorage = new MemoryStorage();
    // @ts-expect-error mock window with sessionStorage
    globalThis.window = {
      sessionStorage: memStorage,
      localStorage: memStorage,
      crypto: {
        randomUUID: () => "test-uuid-1234",
      },
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    vi.restoreAllMocks();
  });

  it("records interview responses turn-by-turn in localhost and retrieves them", () => {
    const rawMessages = [
      { role: "ai", text: "आपकी मुख्य समस्या क्या है?", stage: "chief_complaint" },
      { role: "patient", text: "मुझे 3 दिन से तेज बुखार और खांसी है", stage: "chief_complaint" },
      { role: "ai", text: "क्या आपको सांस लेने में तकलीफ है?", stage: "hpi" },
      { role: "patient", text: "हाँ, सीढ़ियाँ चढ़ते समय सांस फूलती है", stage: "hpi" },
      { role: "ai", text: "क्या आप कोई दवा ले रहे हैं?", stage: "medications_allergies" },
      { role: "patient", text: "पैरासिटामोल 650mg ली थी, एलर्जी नहीं है", stage: "medications_allergies" },
    ];

    // 1. Simulate History Interview Page saving to localhost
    const turns = messagesFromLegacy(rawMessages);
    expect(turns.length).toBe(3);
    expect(turns[0].category).toBe("chief_complaint");
    expect(turns[0].answer).toBe("मुझे 3 दिन से तेज बुखार और खांसी है");
    expect(turns[1].category).toBe("hpi_opqrst");
    expect(turns[2].category).toBe("medications_allergies");

    SessionStore.updateSession({
      language: "hi",
      mode: "allopathic",
      turns,
      patient: { name: "Sunil Verma", age: "42", gender: "Male" },
    });

    // 2. Verify it is persisted in storage under ACTIVE_SESSION_KEY
    const rawStored = memStorage.getItem(ACTIVE_SESSION_KEY);
    expect(rawStored).not.toBeNull();
    const parsedStored = JSON.parse(rawStored!);
    expect(parsedStored.turns.length).toBe(3);
    expect(parsedStored.patient.name).toBe("Sunil Verma");

    // 3. Simulate Report Page retrieving session on localhost
    const retrievedSession = SessionStore.getSession();
    expect(retrievedSession.turns.length).toBe(3);
    expect(retrievedSession.patientName).toBe("Sunil Verma");
    expect(retrievedSession.patientAge).toBe("42");
    expect(retrievedSession.turns[0].answer).toBe("मुझे 3 दिन से तेज बुखार और खांसी है");

    // 4. Verify round-trip conversion for report API payload
    const legacyForSummary = sessionTurnsToLegacyMessages(retrievedSession.turns);
    expect(legacyForSummary.length).toBe(6);
    expect(legacyForSummary[1].text).toBe("मुझे 3 दिन से तेज बुखार और खांसी है");
  });

  it("recovers and hydrates turns from legacy mk_history key if ACTIVE_SESSION_KEY had no turns", () => {
    // Simulate older kiosk session or page refresh with only mk_history in sessionStorage
    memStorage.setItem("mk_history", JSON.stringify({
      messages: [
        { role: "ai", text: "Main complaint?", stage: "chief_complaint" },
        { role: "patient", text: "Severe migraine headache", stage: "chief_complaint" },
        { role: "ai", text: "Any allergies?", stage: "drug_allergy" },
        { role: "patient", text: "Allergic to Penicillin", stage: "drug_allergy" },
      ],
      summary: { chiefComplaint: "Severe migraine headache" },
    }));
    memStorage.setItem("mk_patient", JSON.stringify({ name: "Anita Devi", age: "38", gender: "Female" }));
    memStorage.setItem("mk_lang", "en");
    memStorage.setItem("mk_mode", "allopathic");

    // When report page calls SessionStore.getSession()
    const session = SessionStore.getSession();
    expect(session.turns.length).toBe(2);
    expect(session.turns[0].category).toBe("chief_complaint");
    expect(session.turns[0].answer).toBe("Severe migraine headache");
    expect(session.turns[1].category).toBe("medications_allergies");
    expect(session.turns[1].answer).toBe("Allergic to Penicillin");
    expect(session.patientName).toBe("Anita Devi");
  });
});