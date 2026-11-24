// src/lib/abdmSandbox.ts
// Virtual ABDM Sandbox — 20 synthetic Indian patient records for local dev/testing.
// NOTE: This module is PIPELINE scaffolding only. ABHA/ABDM auth is NOT active in
// the current patient-facing kiosk flow. The /api/abdm/mock route uses this for
// internal testing. No patient data is ever authenticated via ABHA in production.

export interface SandboxPatient {
  abhaId: string;
  /** e.g. "91-1234-5678-0001" */
  abhaNumber: string;
  /** e.g. "ramesh.kumar@abdm" */
  abhaAddress: string;
  name: string;
  /** DD/MM/YYYY format (ABDM API convention) */
  dob: string;
  gender: "M" | "F" | "O";
  mobile: string;
  district: string;
  state: string;
  /** Ayurvedic prakriti (Vata/Pitta/Kapha blend) */
  prakriti?: string;
  /** Known chronic conditions */
  chronicConditions?: string[];
  /** Current medications */
  currentMedications?: string[];
}

// 20 synthetic records — expand to 100 before enabling ABDM pipeline
export const VIRTUAL_SANDBOX_PATIENTS: SandboxPatient[] = [
  { abhaId: "91-1234-5678-0001", abhaNumber: "91-1234-5678-0001", abhaAddress: "ramesh.kumar@abdm",    name: "Ramesh Kumar",       dob: "12/04/1980", gender: "M", mobile: "9876500001", district: "Lucknow",       state: "UP",          prakriti: "Vata-Pitta",  chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0002", abhaNumber: "91-1234-5678-0002", abhaAddress: "sunita.devi@abdm",     name: "Sunita Devi",        dob: "23/08/1975", gender: "F", mobile: "9876500002", district: "Patna",         state: "Bihar",       prakriti: "Kapha",       chronicConditions: ["Diabetes"],             currentMedications: ["Metformin 500mg"] },
  { abhaId: "91-1234-5678-0003", abhaNumber: "91-1234-5678-0003", abhaAddress: "amit.singh@abdm",      name: "Amit Singh",         dob: "15/01/1990", gender: "M", mobile: "9876500003", district: "Jaipur",        state: "Rajasthan",   prakriti: "Pitta",       chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0004", abhaNumber: "91-1234-5678-0004", abhaAddress: "priya.sharma@abdm",    name: "Priya Sharma",       dob: "30/11/1985", gender: "F", mobile: "9876500004", district: "Bhopal",        state: "MP",          prakriti: "Vata",        chronicConditions: ["Hypertension"],         currentMedications: ["Amlodipine 5mg"] },
  { abhaId: "91-1234-5678-0005", abhaNumber: "91-1234-5678-0005", abhaAddress: "vijay.patel@abdm",     name: "Vijay Patel",        dob: "05/06/1968", gender: "M", mobile: "9876500005", district: "Ahmedabad",     state: "Gujarat",     prakriti: "Kapha-Vata",  chronicConditions: ["Diabetes","Hypertension"], currentMedications: ["Metformin","Telmisartan"] },
  { abhaId: "91-1234-5678-0006", abhaNumber: "91-1234-5678-0006", abhaAddress: "meena.reddy@abdm",     name: "Meena Reddy",        dob: "18/03/1992", gender: "F", mobile: "9876500006", district: "Hyderabad",     state: "Telangana",   prakriti: "Pitta-Kapha", chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0007", abhaNumber: "91-1234-5678-0007", abhaAddress: "suresh.nair@abdm",     name: "Suresh Nair",        dob: "25/09/1978", gender: "M", mobile: "9876500007", district: "Kochi",         state: "Kerala",      prakriti: "Vata-Kapha",  chronicConditions: ["Asthma"],               currentMedications: ["Salbutamol inhaler"] },
  { abhaId: "91-1234-5678-0008", abhaNumber: "91-1234-5678-0008", abhaAddress: "anita.joshi@abdm",     name: "Anita Joshi",        dob: "07/12/1983", gender: "F", mobile: "9876500008", district: "Pune",          state: "Maharashtra", prakriti: "Pitta",       chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0009", abhaNumber: "91-1234-5678-0009", abhaAddress: "deepak.yadav@abdm",    name: "Deepak Yadav",       dob: "14/07/1995", gender: "M", mobile: "9876500009", district: "Varanasi",      state: "UP",          prakriti: "Vata",        chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0010", abhaNumber: "91-1234-5678-0010", abhaAddress: "kavitha.rajan@abdm",   name: "Kavitha Rajan",      dob: "28/02/1970", gender: "F", mobile: "9876500010", district: "Chennai",       state: "TamilNadu",   prakriti: "Kapha",       chronicConditions: ["Hypothyroidism"],       currentMedications: ["Levothyroxine"] },
  { abhaId: "91-1234-5678-0011", abhaNumber: "91-1234-5678-0011", abhaAddress: "mukesh.gupta@abdm",    name: "Mukesh Gupta",       dob: "19/05/1987", gender: "M", mobile: "9876500011", district: "Delhi",         state: "Delhi",       prakriti: "Pitta-Vata",  chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0012", abhaNumber: "91-1234-5678-0012", abhaAddress: "rekha.pandey@abdm",    name: "Rekha Pandey",       dob: "02/10/1965", gender: "F", mobile: "9876500012", district: "Allahabad",     state: "UP",          prakriti: "Kapha",       chronicConditions: ["Arthritis"],            currentMedications: ["Ibuprofen 400mg"] },
  { abhaId: "91-1234-5678-0013", abhaNumber: "91-1234-5678-0013", abhaAddress: "ajay.mishra@abdm",     name: "Ajay Mishra",        dob: "11/08/1998", gender: "M", mobile: "9876500013", district: "Kanpur",        state: "UP",          prakriti: "Vata-Pitta",  chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0014", abhaNumber: "91-1234-5678-0014", abhaAddress: "pooja.verma@abdm",     name: "Pooja Verma",        dob: "26/04/1993", gender: "F", mobile: "9876500014", district: "Nagpur",        state: "Maharashtra", prakriti: "Pitta",       chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0015", abhaNumber: "91-1234-5678-0015", abhaAddress: "ravi.shankar@abdm",    name: "Ravi Shankar",       dob: "08/01/1960", gender: "M", mobile: "9876500015", district: "Bangalore",     state: "Karnataka",   prakriti: "Vata-Kapha",  chronicConditions: ["COPD"],                 currentMedications: ["Tiotropium"] },
  { abhaId: "91-1234-5678-0016", abhaNumber: "91-1234-5678-0016", abhaAddress: "lata.kumari@abdm",     name: "Lata Kumari",        dob: "22/06/1988", gender: "F", mobile: "9876500016", district: "Ranchi",        state: "Jharkhand",   prakriti: "Kapha-Pitta", chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0017", abhaNumber: "91-1234-5678-0017", abhaAddress: "sanjay.tiwari@abdm",   name: "Sanjay Tiwari",      dob: "15/03/1972", gender: "M", mobile: "9876500017", district: "Indore",        state: "MP",          prakriti: "Pitta-Kapha", chronicConditions: ["Diabetes"],             currentMedications: ["Glimepiride"] },
  { abhaId: "91-1234-5678-0018", abhaNumber: "91-1234-5678-0018", abhaAddress: "usha.rani@abdm",       name: "Usha Rani",          dob: "04/11/1980", gender: "F", mobile: "9876500018", district: "Coimbatore",    state: "TamilNadu",   prakriti: "Vata",        chronicConditions: [],                       currentMedications: [] },
  { abhaId: "91-1234-5678-0019", abhaNumber: "91-1234-5678-0019", abhaAddress: "prakash.babu@abdm",    name: "Prakash Babu",       dob: "30/08/1976", gender: "M", mobile: "9876500019", district: "Visakhapatnam", state: "AP",          prakriti: "Kapha",       chronicConditions: ["Hypertension"],         currentMedications: ["Losartan 50mg"] },
  { abhaId: "91-1234-5678-0020", abhaNumber: "91-1234-5678-0020", abhaAddress: "shanti.devi@abdm",     name: "Shanti Devi",        dob: "16/05/1962", gender: "F", mobile: "9876500020", district: "Guwahati",      state: "Assam",       prakriti: "Vata-Pitta",  chronicConditions: ["Anaemia"],              currentMedications: ["Ferrous sulfate"] },
];

/**
 * Find a sandbox patient by ABHA ID, name fragment, or mobile number.
 * Case-insensitive partial match on name; exact match on abhaId/mobile.
 */
export function findSandboxPatient(query: string): SandboxPatient | undefined {
  const q = query.trim().toLowerCase();
  return VIRTUAL_SANDBOX_PATIENTS.find(
    (p) =>
      p.abhaId === q ||
      p.abhaNumber === q ||
      p.mobile === q ||
      p.name.toLowerCase().includes(q)
  );
}
