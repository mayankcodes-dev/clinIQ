# ClinIQ — The Master Document
## Hackathon Pitch · Engineering Deep-Dive · Feature Roadmap · Judge Q&A

---

# PART 1: THE PITCH NARRATIVE
## How to Present ClinIQ in 5 Minutes and Own the Room

---

### The Opening Hook (30 seconds — memorize this)

> *"Every day, 2.6 billion doctor consultations happen in India. Each one averages 2 minutes. In those 2 minutes, the doctor must take history, review old records, examine, diagnose, counsel, and prescribe. The part that gets cut first — every single time — is the part that drives 82% of correct diagnoses: the patient history.*
>
> *We didn't build another EHR. We didn't build another symptom checker. We built the AI layer that sits between the patient and the doctor — and makes sure the doctor already knows everything before the patient walks in.*
>
> *That's ClinIQ."*

---

### The Problem (60 seconds)

Frame it as a **systems failure**, not a technology gap:

- The Indian doctor-patient relationship is structurally broken at the first step
- **82% of correct diagnoses** come from history (Hampton et al., BMJ) — yet history-taking is the first casualty of a 2-minute consultation
- This isn't a rural-only problem. AIIMS Delhi sees **14,000 patients/day**. Private clinics in Mumbai see 80-100 patients/day. The math doesn't work anywhere.
- The patient's side: they arrive with a folder of paper prescriptions, handwritten lab reports from 3 different doctors over 5 years — **nobody reads it**. Every visit starts from zero.
- **Existing solutions solve the wrong problem:** EHRs help doctors document AFTER. Ambient scribes record DURING. Symptom checkers are consumer toys. Nobody solves BEFORE.

---

### The Solution (90 seconds)

> *"ClinIQ is a B2B SaaS platform. Clinics subscribe. Patients use it for free in the waiting room."*

**The 5-step story:**
1. Patient arrives → scans QR on clinic tablet / opens WhatsApp link
2. ClinIQ's AI conducts a **clinical interview** — not a form, a conversation — in their own language (22 Indian languages, voice-first, works for illiterate patients)
3. Patient snaps photos of old prescriptions and lab reports → **AI reads them** (handwritten too)
4. **ClinIQ synthesizes everything** into a structured SOAP summary
5. Doctor's screen has the **complete history loaded before the patient walks in**

The doctor's 2 minutes are now 100% diagnosis and care. Zero history-taking. Zero paperwork.

---

### The Business Model (30 seconds)

> *"We sell to clinics, not patients. Clinics pay ₹2,000–15,000/month. Our cost per patient intake is under ₹2. At ₹5/patient charge, we run at 60%+ gross margins from day one. India has 1.5 million registered clinics. Even 1% penetration is a ₹360 crore ARR business."*

---

### The Differentiation (30 seconds)

> *"Every competitor — Practo, Eka.Care, Ada Health — solves at most 2-3 of the 14 capabilities ClinIQ unifies. And none of them — not one — has built the pre-consultation AI layer. We're not competing with EHRs. We're the data source that makes every EHR more useful."*

---

### The Close (30 seconds)

> *"We're not building a feature. We're building a new product category — Pre-Consultation Intelligence. The same way Calendly didn't compete with email, it replaced the meeting-scheduling email thread — ClinIQ doesn't compete with doctors or EHRs. It fills the gap that existed before both of them were useful.*
>
> *The technology is built. The pilot is running. The category is ours to define."*

---

# PART 2: THE ENGINEERING — WHAT MAKES THIS TOP-NOTCH
## This is what you put on your resume and what impresses technical judges

---

## 2.1 — The Core Architecture: Not "AI with API key" — An AI Orchestration System

Most people building "AI products" do this:
```
User Input → OpenAI API → Output
```

That's an API wrapper. ClinIQ does this:

```
User Voice Input
    ↓
[ASR Engine] → Bhashini/AI4Bharat IndicConformer
    ↓
[Language Detection + Normalization]
    ↓
[Dialog State Manager] ← tracks conversation context, patient model
    ↓
[Clinical Intent Classifier] → what category of question is being answered?
    ↓
[RAG Query Engine] → retrieves relevant clinical protocols
    ↓
[LLM Orchestrator] → generates next question grounded in retrieved context
    ↓
[Response Validator] → checks for hallucinations, flags if answer triggers red-flag protocol
    ↓
[TTS Engine] → Bhashini IndicTTS in patient's language
    ↓
Patient hears the next question
```

**This is an AI orchestration pipeline, not an API call.**

---

## 2.2 — The RAG Engine (This is your technical moat)

### What standard RAG looks like:
```
Query → Embed → Vector Search → Retrieve chunks → Stuff into LLM prompt → Answer
```

### What ClinIQ's Clinical RAG looks like:

```
Patient utterance: "सीने में दर्द है, सांस लेने में तकलीफ"
    ↓
[Multilingual Entity Extractor]
    → Symptom: chest_pain, dyspnea
    → Body location: chest
    → Severity: not specified → need to elicit
    ↓
[Clinical Protocol Router]
    → Routes to: Cardiovascular symptom protocol
    → Activates: SOCRATES framework
    → Activates: ACS red-flag checklist
    → Activates: Wells' Criteria for PE
    ↓
[Multi-index RAG Query]
    → Query 1 → ICMR ACS Standard Treatment Guidelines
    → Query 2 → SNOMED CT: chest_pain concepts + associated conditions
    → Query 3 → StatPearls: differential diagnosis for chest pain + dyspnea
    → Query 4 → Drug interaction database (if patient already on medications)
    ↓
[Context Fusion Layer]
    → Merges retrieved chunks with patient's conversation history
    → Injects current patient model (age, gender, known conditions)
    → Deduplicates and ranks by clinical relevance
    ↓
[Constrained Generation]
    → LLM prompted with: retrieved context + patient model + conversation state
    → Constrained to: ask ONE specific follow-up question
    → Guardrail: output must be a question, not a diagnosis
    → Hallucination check: every clinical claim must be grounded in retrieved context
    ↓
Next question: "यह दर्द कब से है? और क्या यह बाएं हाथ या जबड़े तक फैलता है?"
(How long has this pain been there? Does it radiate to the left arm or jaw?)
```

### The Knowledge Bases (Multi-index RAG):

| Index | Source | Content | Size |
|---|---|---|---|
| **Clinical Protocols** | ICMR Standard Treatment Guidelines | 700+ conditions, treatment protocols | ~50K chunks |
| **Medical Ontology** | SNOMED CT + ICD-10/11 | Symptom → condition mappings | ~200K chunks |
| **Evidence Base** | StatPearls, PubMed abstracts | Clinical decision support | ~500K chunks |
| **AYUSH Knowledge** | Charaka Samhita, Ashtanga Hridayam | Ayurvedic assessment frameworks | ~30K chunks |
| **Drug Database** | Indian drug formulary + interaction tables | Medication safety | ~80K chunks |
| **Lab Reference** | Normal ranges, critical values | Lab interpretation | ~10K chunks |

**This is NOT "upload PDFs to a vector DB." This is a curated, structured, clinically-validated knowledge graph embedded in a vector store.**

---

## 2.3 — The Dialog State Manager (The brain nobody else builds)

This is what makes ClinIQ an AI **interviewer** and not a chatbot.

```typescript
interface PatientModel {
  demographics: { age?: number; gender?: string; language: string }
  chiefComplaint: string[]
  activeSymptoms: Symptom[]
  coveredDomains: ClinicalDomain[]  // what we've already asked about
  pendingProtocols: Protocol[]       // what protocols are queued
  redFlagStatus: 'clear' | 'monitor' | 'alert'
  documentExtracted: MedicalRecord[]
  conversationTurns: DialogTurn[]
}

class DialogStateManager {
  // Tracks what has been asked, what was answered, what needs follow-up
  // Decides what to ask NEXT based on clinical completeness score
  // Knows when to STOP (history is complete) vs when to PROBE DEEPER
  // Manages BRANCHING: chest pain → follow SOCRATES → if 10/10 severity → emergency protocol
}
```

**Most AI chatbots have no memory of the conversation structure. ClinIQ maintains a full patient model that updates with every turn and drives the next question.**

---

## 2.4 — The Document AI Pipeline

```
Photo of handwritten prescription
    ↓
[Image Preprocessing]
    → Deskew, denoise, enhance contrast
    → Detect document type: prescription / lab report / discharge summary
    ↓
[Vision-Language Model]
    → Google Gemini Flash / Azure Document Intelligence
    → Raw text extraction (handles handwriting at 85-94% char accuracy)
    ↓
[Medical NER (Named Entity Recognition)]
    → Extracts: drug names, dosages, frequencies, diagnoses, lab values
    → Maps to: SNOMED CT / ICD-10 / RxNorm codes
    ↓
[Temporal Parser]
    → Assigns dates to each extracted record
    → Builds chronological medical timeline
    ↓
[Drug Interaction Engine]
    → Checks extracted medications against each other
    → Flags: contraindications, duplicate therapy, dose alerts
    ↓
[Structured Output]
    → FHIR R4 MedicationStatement, Condition, Observation resources
    → Feeds into patient model for RAG context
```

---

## 2.5 — The AI Orchestration Layer (What you say in interviews)

> *"We built a multi-agent AI orchestration system where specialized agents hand off to each other based on clinical state, not just conversation turns."*

```
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATION LAYER                     │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐ │
│  │ Intake   │   │ Document │   │ Summary          │ │
│  │ Agent    │   │ Agent    │   │ Generation Agent │ │
│  │          │   │          │   │                  │ │
│  │ Conducts │   │ Processes│   │ Synthesizes all  │ │
│  │ clinical │   │ uploaded │   │ sources into     │ │
│  │ interview│   │ documents│   │ SOAP format      │ │
│  └────┬─────┘   └────┬─────┘   └────────┬─────────┘ │
│       │              │                   │           │
│       └──────────────┴───────────────────┘           │
│                       │                              │
│              ┌────────▼────────┐                     │
│              │  Patient Model  │                     │
│              │  (shared state) │                     │
│              └────────┬────────┘                     │
│                       │                              │
│              ┌────────▼────────┐                     │
│              │  Red Flag Agent │  ← runs in parallel │
│              │  (always active)│    monitors every  │
│              └─────────────────┘    turn for danger  │
└─────────────────────────────────────────────────────┘
```

**Four specialized agents, one shared patient model, parallel execution where possible, sequential where clinical logic requires it.**

This is **agentic AI** — not a single LLM call. This is what LangGraph and CrewAI are built for, and we're building on top of it.

---

## 2.6 — Tech Stack — The Real Explanation

| Layer | Technology | Why This Specifically |
|---|---|---|
| **Frontend** | Next.js 15 + React 19 + TypeScript + Tailwind + PWA | SSR for fast first load, Service Worker for offline, PWA = no app store needed |
| **Voice ASR** | Bhashini IndicConformer (AI4Bharat) | Lowest WER for Indian languages and accents. Not Google/Azure — sovereign Indian AI |
| **Voice TTS** | Bhashini IndicTTS + ElevenLabs fallback | Natural-sounding responses in 22 languages |
| **Translation** | IndicTrans2 (AI4Bharat) | State-of-the-art Indian language translation, open-source, runs on-premise |
| **LLM** | GPT-4o / Gemini 1.5 Pro (primary) + Llama 3.1 (edge fallback) | Cloud for quality, local model for offline/low-bandwidth |
| **Orchestration** | LangGraph | Stateful multi-agent graph execution. Not LangChain (too simple) — LangGraph for complex state machines |
| **RAG Vector Store** | Qdrant | Production-grade, supports payload filtering, sparse+dense hybrid search |
| **Embeddings** | text-embedding-3-large + BGE-M3 (multilingual) | BGE-M3 for Indian language queries, OpenAI for English clinical content |
| **Document AI** | Gemini Flash Vision + Azure Document Intelligence | Gemini for handwritten prescriptions, Azure for structured lab reports |
| **Backend** | FastAPI + Node.js | FastAPI for AI/ML endpoints, Node.js for real-time WebSocket |
| **Database** | PostgreSQL + Redis | Postgres for patient records (FHIR structured), Redis for session state + caching |
| **ABDM** | ABHA V3 APIs + FHIR R4 (NRCeS profiles) | Health record interoperability |
| **Offline** | Sherpa-onnx (ASR) + CTranslate2 (LLM) + Piper TTS | Full offline stack on edge device — no cloud needed |
| **Deployment** | Docker + Kubernetes + GitHub Actions CI/CD | Container-native, auto-scaling |
| **Security** | AES-256 + TLS 1.3 + RBAC + audit logs | DPDP Act 2023 compliant |

---

# PART 3: FEATURE ROADMAP

---

## TIER 1 — BARE MINIMUM MVP (What you must have to demo)

These are non-negotiable. Without these, there is no product.

| # | Feature | Why It's MVP |
|---|---|---|
| 1 | **AI voice interview in Hindi + English** | Core product. Everything else is built on this. |
| 2 | **Adaptive follow-up questioning** | This is what makes it an AI interviewer not a form. Must work. |
| 3 | **Structured SOAP summary output** | The output the doctor sees. If this is wrong, nothing else matters. |
| 4 | **Document photo upload + basic OCR** | Even if accuracy is 80%, it's better than zero. |
| 5 | **Doctor's summary view (web)** | The paying customer must see value. |
| 6 | **ABHA/OTP login** | Authentication. Required. |
| 7 | **Red flag detection** | Non-negotiable for patient safety. If AI misses a heart attack, game over. |
| 8 | **Offline basic mode** | Core differentiator. Must work in demo. |

**MVP = 8 features. Everything else is growth.**

---

## TIER 2 — SHOULD ADD (Before first paying customer)

| # | Feature | Impact |
|---|---|---|
| 1 | **4 more regional languages** (Tamil, Telugu, Bengali, Marathi) | Covers 70%+ of India's population |
| 2 | **Clinic dashboard** (queue, completion status, patient list) | Clinic admin needs this to manage the workflow |
| 3 | **Doctor mobile app** (review summary on phone) | Doctors don't sit at desktops between patients |
| 4 | **WhatsApp intake link** (patient completes before arriving) | Game-changer. Patient arrives, intake is done. |
| 5 | **AYUSH Dashavidha Pariksha mode** | Unlocks 4 lakh+ AYUSH practitioner market |
| 6 | **Drug interaction flagging** | Adds clinical safety layer, justifies premium pricing |
| 7 | **Subscription billing + clinic onboarding flow** | Required to charge money |
| 8 | **Audit trail + consent logging** | DPDP Act 2023 compliance for enterprise |

---

## TIER 3 — ADDITIONAL FEATURES (Build if you can)

| # | Feature | Why It Matters |
|---|---|---|
| 1 | **All 22 Indian languages** | Full market coverage |
| 2 | **Smart triage queue** (AI estimates consultation time) | Clinic optimization, reduces overbooking |
| 3 | **Post-consultation follow-up** (WhatsApp reminders for medications, follow-ups) | Patient retention → clinic revenue |
| 4 | **Multi-branch management** | Required for clinic chains (Apollo, Fortis) |
| 5 | **Abnormal lab value flagging with trend analysis** | "Your HbA1c has been rising for 3 visits" |
| 6 | **White-label mode** | Enterprise deals where hospital wants their own branding |
| 7 | **Clinic analytics dashboard** | "Top 10 conditions this month", peak hours, avg intake time |
| 8 | **API for teleconsult platforms** | Practo, 1mg embed ClinIQ as intake widget → platform revenue |

---

## TIER 4 — FUTURE SCOPE (This is where you blow minds)

### 4.1 — Predictive Health Intelligence
> *"We have intake data from 10,000 patients at 500 clinics. We start seeing patterns nobody else can see."*

- **Epidemic early warning:** When 20 patients in the same area describe fever + rash + joint pain in 3 days → alert district health officer (dengue/chikungunya cluster)
- **Referral prediction:** AI detects from intake data that patient needs specialist — auto-suggests referral before doctor even sees them
- **Chronic disease progression:** Track how patient's HbA1c, BP, symptoms evolve over multiple visits → alert doctor before the crisis

### 4.2 — The Research Data Layer
> *"Every intake is a structured, consented, FHIR-formatted clinical data point. At scale, this is one of the largest real-world clinical datasets in India."*

- Partner with pharma companies for **real-world evidence studies**
- Partner with medical colleges for **research datasets** (anonymized, consented)
- This is the **data flywheel** — more clinics → more data → better AI → better product → more clinics

### 4.3 — Global Expansion
> *"The 2-minute consultation problem is not Indian. It's global."*

- Southeast Asia: Indonesia, Bangladesh, Vietnam — same doctor shortage, same language diversity
- Africa: Same problem, similar demographics
- **IndicTrans2 is already multilingual** — adding Swahili or Bahasa Indonesia is a model fine-tune, not a rebuild

### 4.4 — The Platform Play
> *"ClinIQ stops being a product and becomes the infrastructure layer."*

- **Any teleconsult platform** (Practo, 1mg, Tata 1mg) embeds ClinIQ API for pre-consultation
- **Any hospital EHR** (Bahmni, OpenMRS, Oracle Health) uses ClinIQ as the intake layer
- **Insurance companies** use ClinIQ intake data for underwriting and pre-auth
- This is the **AWS moment** — you start as a service, you become the infrastructure

---

# PART 4: JUDGE Q&A PREP
## Every hard question, with the answer that wins

---

**Q: "Why would a clinic pay ₹2,000/month for this? They're already managing fine."**

> "A clinic seeing 50 patients/day with ClinIQ can see 60-80 patients/day — same staff, same hours. At ₹300 average consultation fee, that's ₹3,000-9,000 additional revenue per day. Our ₹2,000/month subscription costs less than one extra patient per month. The ROI calculation closes in day one. We're not asking clinics to invest — we're showing them how to make more money."

---

**Q: "What happens if the AI asks the wrong question or misses something critical?"**

> "Two things. First, the AI never asks questions outside its knowledge base — every question is grounded in retrieved clinical protocols. Second, and more importantly, the physician summary is always marked as 'AI-generated draft' and requires the doctor to review, edit, and approve before it becomes part of the medical record. ClinIQ is a clinical decision support tool, not an autonomous diagnostic system. The doctor is always in the loop. We improve the starting point — we never replace the physician's judgment."

---

**Q: "Isn't this just a fancy form? How is this different from a digital questionnaire?"**

> "A form asks the same questions to every patient in the same order. ClinIQ's AI interview adapts in real time. If a patient mentions chest pain, ClinIQ doesn't move to the next fixed question — it activates the SOCRATES framework, checks for ACS red flags, asks about radiation, severity, associated symptoms. It branches exactly like a senior clinician would. This requires a multi-turn dialog state manager, a clinical protocol RAG engine, and a constrained generation layer. It's an AI orchestration system, not a form with branching logic."

---

**Q: "Bhashini might not always work. What's your fallback?"**

> "We have a three-tier architecture. Tier 1: Bhashini cloud APIs (primary, best quality). Tier 2: Locally hosted AI4Bharat models via Sherpa-onnx (runs on a ₹15,000 mini-PC, no internet needed). Tier 3: Typed input fallback with native-script keyboard. The system gracefully degrades — it never stops working. We've tested this specifically because rural clinics have unreliable connectivity."

---

**Q: "What about patient data privacy? DPDP Act?"**

> "Three things. One: we collect explicit, language-appropriate informed consent before the first question — the patient hears their rights in their own language. Two: all health data is encrypted at rest (AES-256) and in transit (TLS 1.3), with zero-trust architecture — even our own engineers cannot read patient records. Three: we are ABDM-certified, which means we follow NRCeS FHIR profiles, Fidelius end-to-end encryption for health record exchange, and DPDP Act 2023 Sections 6, 8, 9 for consent, security safeguards, and data principal rights. We built compliance in from day one — it's not an afterthought."

---

**Q: "OpenAI / Google could build this tomorrow. What's your moat?"**

> "Four moats. First: clinical protocol RAG — we've spent months curating, structuring, and embedding ICMR guidelines, SNOMED CT, Charaka Samhita, drug databases. This isn't a weekend project. Second: dialog state manager — the clinical interview logic that knows what to ask next, when to probe deeper, when to stop, how to handle contradictory answers. Third: the multilingual voice stack tuned for Indian clinical vocabulary. Fourth, and most important: clinic relationships and patient data. OpenAI can build a better LLM. They can't build the trust of 500 clinics and the structured clinical dataset that comes from it. The technology is the starting line — the data and relationships are the moat."

---

**Q: "What's your go-to-market? How do you get the first 100 clinics?"**

> "Phase 1: Free 30-day pilots with 10 clinics in our home city. We sit in the clinic, watch patients use it, fix every friction point. Phase 2: 50 paid pilots at ₹1,000/month introductory rate — prove willingness to pay. Phase 3: Pharma rep channel. A pharma rep visits 15-20 clinics daily and has existing trust relationships with doctors. We pay them ₹500-1,000 per signed clinic. This is how Practo scaled, this is how Eka.Care scaled. We're not reinventing GTM — we're using the channel that already exists."

---

**Q: "The handwritten OCR — you said 85-94% accuracy. Is that good enough for medical records?"**

> "It's not good enough to be autonomous — and we never claim it is. Every document extraction goes through a mandatory physician review step. The doctor sees both the original document image and the extracted text side by side and must approve or correct before it enters the record. We're not replacing the doctor's document review — we're doing the tedious extraction work and giving them a pre-filled form to verify. Even at 85% accuracy, we save the doctor 90% of the work. The 15% correction takes seconds — unassisted reading of a scrawled prescription takes minutes."

---

**Q: "AYUSH mode — is Dashavidha Pariksha actually implementable in an AI conversation?"**

> "We've implemented it. Dashavidha Pariksha has 10 parameters: Prakriti, Vikriti, Sara, Samhanana, Pramana, Satmya, Sattva, Ahara Shakti, Vyayama Shakti, Vaya. Each maps to a structured set of questions we've extracted from Charaka Samhita, Vimanasthana Chapter 8. These are embedded in our AYUSH knowledge index. The AI conducts the assessment conversationally — the patient doesn't need to know Ayurvedic terminology. They just answer questions about their body type, appetite, sleep, stress tolerance, and physical constitution. The AI maps their responses to the Dashavidha framework."

---

# PART 5: THE RESUME ENGINEERING HIGHLIGHTS

When talking to technical interviewers, lead with these:

---

### "I built a multi-agent AI orchestration system for clinical interviews"
- **Intake Agent** + **Document Agent** + **Summary Agent** + **Red Flag Agent** running in parallel on a shared patient state graph using LangGraph
- Not a chatbot. A stateful clinical interview engine with protocol-driven branching

### "I designed a multi-index hybrid RAG pipeline for medical knowledge retrieval"
- 6 knowledge bases (ICMR, SNOMED CT, StatPearls, Charaka Samhita, drug DB, lab reference)
- Hybrid search: dense embeddings (BGE-M3 multilingual) + sparse BM25 for clinical terminology
- Context fusion layer that merges retrieved chunks with patient model state before generation
- Constrained generation with hallucination detection — every clinical claim must be grounded

### "I built a Dialog State Manager that tracks clinical completeness"
- Maintains a structured Patient Model that updates with every conversation turn
- Decides next action based on clinical protocol completion score
- Manages branching: symptom → protocol activation → follow-up → red flag detection
- Knows when the history is complete and when to probe deeper

### "I implemented a multilingual voice AI pipeline with offline fallback"
- Primary: Bhashini ULCA APIs for ASR/TTS in 22 Indian languages
- Edge fallback: Sherpa-onnx + Piper TTS running on a ₹15,000 mini-PC, fully offline
- Client-side VAD (Voice Activity Detection) to reduce false triggers in noisy clinic environments

### "I built a medical document AI pipeline with entity extraction and FHIR output"
- Vision-Language Model (Gemini Flash) for handwritten prescription OCR
- Medical NER to extract and normalize entities to SNOMED CT / ICD-10 / RxNorm
- Temporal parser for chronological medical timeline construction
- FHIR R4 structured output (MedicationStatement, Condition, Observation resources)

---

# PART 6: THE ONE-PARAGRAPH ELEVATOR PITCH
## Memorize this. Use it for everything.

> *"ClinIQ is a B2B SaaS platform that acts as an AI clinical interviewer — it talks to patients in their own language before they see the doctor, reads their old medical documents, and delivers a complete structured history to the doctor's screen before the consultation begins. It's built on a multi-agent AI orchestration system with a clinical RAG engine grounded in ICMR guidelines, SNOMED CT, and Ayurvedic texts. Clinics pay ₹2,000-15,000 per month. Our cost per patient intake is under ₹2. We're creating a new product category — Pre-Consultation Intelligence — in a market with 1.5 million clinics, 2.6 billion annual consultations, and zero direct competitors."*

---

> **Final note:** When judges ask "what's next?" — don't say "we'll add more features." Say: *"We're building the pre-consultation data layer for Indian healthcare. Every structured intake is a FHIR-formatted clinical data point. At scale, ClinIQ becomes the largest real-world clinical dataset in India — and the intelligence layer on top of it becomes more valuable than the intake product itself. That's the endgame."*
