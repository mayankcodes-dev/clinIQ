/**
 * Curated, India-focused clinical protocol snippets used when the hosted
 * pgvector index is unavailable.  The entries are intentionally structured so
 * the interview and report routes can consume the same safety guidance.
 *
 * Sources are kept at protocol-family level rather than presenting this data
 * as a substitute for clinician judgement: ICMR/NCDC India-aligned workflows,
 * standard primary-care triage, WHO ICD-10, and classical AYUSH Dashavidha
 * Pariksha rubrics.
 */

export interface ICD10Mapping {
  code: string;
  description: string;
}

export interface ClinicalGuidelineChunk {
  id: string;
  symptomCluster: string;
  title: string;
  keywords: string[];
  mandatoryFollowUpQuestions: string[];
  redFlagSymptoms: string[];
  ayushCorrelates: string[];
  icd10Mappings: ICD10Mapping[];
  source: string;
  score?: number;
  retrievalMethod?: "supabase" | "local";
}

export const SYSTEMIC_RED_FLAG_SYMPTOMS = [
  "Altered sensorium, new confusion, seizure, or inability to stay awake",
  "Shock features: fainting, cold clammy skin, severe weakness, or very low urine output",
  "Severe breathing difficulty, cyanosis, or inability to speak in complete sentences",
  "Persistent vomiting with inability to retain fluids or signs of severe dehydration",
  "Active bleeding, black stools, vomiting blood, or rapidly spreading non-blanching rash",
  "Sudden severe pain, rapidly worsening symptoms, or a patient who appears critically unwell",
] as const;

const ICMR_ACUTE_FEVER_SOURCE =
  "ICMR/NCDC India-aligned acute febrile illness, dengue and malaria triage workflow; WHO ICD-10";
const PRIMARY_CARE_SOURCE =
  "Indian primary-care clinical triage workflow; WHO ICD-10; clinician review required";
const AYUSH_SOURCE =
  "AYUSH Dashavidha Pariksha and Nidana Panchaka rubrics; clinician review required";

/**
 * Twelve high-frequency Indian OPD clusters. Keep this array data-only and
 * deterministic: it is used in request paths where a network or embedding
 * service may not be available.
 */
export const LOCAL_CLINICAL_KNOWLEDGE: ClinicalGuidelineChunk[] = [
  {
    id: "acute-febrile-illness-dengue-malaria",
    symptomCluster: "fever_dengue_malaria",
    title: "Acute febrile illness, dengue and malaria",
    keywords: [
      "fever", "febrile", "pyrexia", "dengue", "malaria", "malarial", "chills",
      "rigor", "mosquito", "platelet", "thrombocytopenia", "body ache", "bodyache",
      "viral fever", "typhoid", "enteric", "chikungunya", "leptospirosis", "scrub typhus",
    ],
    mandatoryFollowUpQuestions: [
      "When did the fever start, what is the highest measured temperature, and is the pattern continuous or intermittent?",
      "Are there warning symptoms such as severe abdominal pain, persistent vomiting, bleeding from the nose or gums, black stool, rash, drowsiness, or breathlessness?",
      "Is the patient passing urine normally and able to drink fluids? Ask about dizziness on standing or fainting.",
      "Was there mosquito exposure, travel to a malaria or dengue area, a sick contact, or recent contaminated food or water exposure?",
      "Have any malaria, dengue, blood-count, or other tests been done, and what medicines or antimalarials have already been taken?",
      "Ask about pregnancy, infancy/older age, diabetes, kidney disease, immune suppression, or another high-risk condition.",
    ],
    redFlagSymptoms: [
      "Severe abdominal pain or persistent vomiting during a febrile illness",
      "Mucosal bleeding, haematemesis, melaena, haematuria, or rapidly spreading petechiae/purpura",
      "Cold clammy extremities, fainting, restlessness, altered sensorium, or markedly reduced urine output",
      "Severe breathlessness, jaundice, seizures, or inability to drink",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Vikriti: document the current fever pattern and associated dosha features without using it to replace infection assessment.",
      "Agni/Ahara Shakti and Koshtha: appetite, digestion, bowel pattern, hydration and tolerance of oral intake.",
      "Nidana and Kala: season, mosquito/environmental exposure, recent diet, travel and contact history.",
      "Vaya and Bala: age, frailty and strength modify risk; record Prakriti only as supportive context.",
    ],
    icd10Mappings: [
      { code: "R50.9", description: "Fever, unspecified" },
      { code: "A90", description: "Dengue fever" },
      { code: "A91", description: "Dengue haemorrhagic fever" },
      { code: "B50.9", description: "Plasmodium falciparum malaria, unspecified" },
      { code: "B51.9", description: "Plasmodium vivax malaria, unspecified" },
      { code: "B54", description: "Unspecified malaria" },
      { code: "A01.0", description: "Typhoid fever" },
    ],
    source: ICMR_ACUTE_FEVER_SOURCE,
  },
  {
    id: "chest-pain-cardiac",
    symptomCluster: "chest_pain_cardiac",
    title: "Chest pain and cardiac symptoms",
    keywords: [
      "chest pain", "chest pressure", "chest heaviness", "angina", "heart pain", "cardiac",
      "palpitation", "palpitations", "heart racing", "breathlessness", "shortness of breath",
      "sweating", "heart attack",
    ],
    mandatoryFollowUpQuestions: [
      "When did the chest symptom start, was the onset sudden, and is it present now? Describe pressure, tightness, burning, or sharp pain.",
      "Does it occur with exertion or at rest, and does it radiate to the arm, shoulder, jaw, neck, or back?",
      "Is there breathlessness, cold sweating, nausea, fainting, palpitations, or unusual weakness with it?",
      "Ask about hypertension, diabetes, cholesterol, smoking or tobacco, prior heart disease, stroke, or a family history of early heart disease.",
      "What medicines are being taken, including aspirin, blood-pressure medicines, statins, nitrates, or stimulants?",
    ],
    redFlagSymptoms: [
      "Central crushing or pressure-like chest pain lasting more than 20 minutes or occurring at rest",
      "Pain radiating to the arm, jaw, neck or back with sweating, nausea, or breathlessness",
      "Syncope, severe palpitations, cyanosis, new confusion, or signs of shock",
      "Sudden tearing chest pain to the back or pleuritic pain with haemoptysis and leg swelling",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Vikriti and Prana Vayu/Hridaya symptom description may be recorded as complementary context, never as exclusion of acute coronary disease.",
      "Vyayama Shakti: document exercise tolerance and change from baseline.",
      "Prakriti, Satmya and Ahara Vihara: record diet, tobacco, sleep and stress exposures relevant to the clinical review.",
    ],
    icd10Mappings: [
      { code: "R07.9", description: "Chest pain, unspecified" },
      { code: "I20.9", description: "Angina pectoris, unspecified" },
      { code: "I21.9", description: "Acute myocardial infarction, unspecified" },
      { code: "R00.2", description: "Palpitations" },
      { code: "I10", description: "Essential (primary) hypertension" },
    ],
    source: PRIMARY_CARE_SOURCE,
  },
  {
    id: "acute-gastroenteritis",
    symptomCluster: "acute_gastroenteritis",
    title: "Acute gastroenteritis, diarrhoea and vomiting",
    keywords: [
      "diarrhea", "diarrhoea", "loose stools", "loose motion", "vomiting", "vomit", "gastroenteritis",
      "food poisoning", "stomach infection", "abdominal cramps", "watery stool", "dysentery",
    ],
    mandatoryFollowUpQuestions: [
      "When did the diarrhoea or vomiting start, how many episodes occurred, and is the stool watery, bloody, or black?",
      "Can the patient keep down fluids, and when was the last normal urine? Ask about thirst, dizziness, dry mouth, and lethargy.",
      "Is there fever, severe abdominal pain, persistent vomiting, or abdominal distension?",
      "Ask about unsafe food or water, a similar illness in the household, recent travel, antibiotics, and recent hospitalisation.",
      "Record age, pregnancy, comorbidities, and any oral rehydration, antibiotic, or anti-diarrhoeal medicine already taken.",
    ],
    redFlagSymptoms: [
      "Shock, confusion, extreme lethargy, sunken eyes, or very low urine output",
      "Blood or black stool, haematemesis, severe localized abdominal pain, guarding, or distension",
      "Persistent vomiting with inability to retain oral fluids",
      "High fever, suspected cholera-like profuse watery diarrhoea, or a high-risk infant/older adult",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Agni/Ahara Shakti: appetite, digestion, food tolerance and dehydration risk.",
      "Koshtha and Mala: baseline bowel pattern and current stool frequency/consistency.",
      "Nidana: recent food, water, seasonal and contact exposures; document Vikriti without delaying rehydration.",
    ],
    icd10Mappings: [
      { code: "A09", description: "Infectious gastroenteritis and colitis, unspecified" },
      { code: "R19.7", description: "Diarrhoea, unspecified" },
      { code: "R11.2", description: "Nausea with vomiting, unspecified" },
      { code: "K52.9", description: "Noninfective gastroenteritis and colitis, unspecified" },
    ],
    source: PRIMARY_CARE_SOURCE,
  },
  {
    id: "respiratory-cough",
    symptomCluster: "respiratory_cough",
    title: "Respiratory symptoms, cough and breathlessness",
    keywords: [
      "cough", "cold", "sore throat", "breathlessness", "dyspnea", "dyspnoea", "wheeze", "wheezing",
      "asthma", "pneumonia", "phlegm", "sputum", "hemoptysis", "haemoptysis", "tb", "tuberculosis",
    ],
    mandatoryFollowUpQuestions: [
      "When did the cough or breathing problem start, and is it worsening, sudden, or associated with fever?",
      "Can the patient speak and walk normally, and is breathlessness present at rest or only on exertion?",
      "Is there wheeze, chest pain, noisy breathing, sputum, blood in sputum, night sweats, or weight loss?",
      "Ask about asthma/COPD, tuberculosis exposure, smoking or biomass smoke, allergies, vaccination, and recent travel or infection.",
      "What inhalers, antibiotics, or other medicines have been used, and is an oxygen saturation reading available?",
    ],
    redFlagSymptoms: [
      "Unable to speak in full sentences, severe breathlessness at rest, cyanosis, or silent chest",
      "Stridor, respiratory rate above 30/min, oxygen saturation below 90%, or rapidly worsening distress",
      "Significant haemoptysis, severe chest pain, altered sensorium, or suspected foreign-body obstruction",
      "Fever with confusion, low blood pressure, or high-risk infant/older adult",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Prana Vayu and Vikriti: record the patient's description of breathing and respiratory effort as complementary history only.",
      "Vyayama Shakti: compare current exercise tolerance with baseline.",
      "Nidana and Satmya: smoke, dust, seasonal, dietary and occupational exposures; ask about Kapha-like mucus symptoms without diagnosing dosha.",
    ],
    icd10Mappings: [
      { code: "R05", description: "Cough" },
      { code: "R06.0", description: "Dyspnoea" },
      { code: "J06.9", description: "Acute upper respiratory infection, unspecified" },
      { code: "J18.9", description: "Pneumonia, unspecified organism" },
      { code: "J45.9", description: "Asthma, unspecified" },
      { code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified" },
    ],
    source: PRIMARY_CARE_SOURCE,
  },
  {
    id: "headache-migraine",
    symptomCluster: "headache_migraine",
    title: "Headache, migraine and dizziness",
    keywords: [
      "headache", "head pain", "migraine", "thunderclap", "dizziness", "vertigo", "photophobia",
      "light sensitivity", "aura", "neck stiffness", "worst headache",
    ],
    mandatoryFollowUpQuestions: [
      "Did the headache reach maximum intensity suddenly, or did it build gradually? When did it begin and how often does it recur?",
      "Where is it located, what is its quality, and how severe is it from 0 to 10?",
      "Ask about fever, neck stiffness, vomiting, visual or speech change, weakness, numbness, fainting, or seizure.",
      "Are there migraine triggers or aura, and how much analgesic or caffeine is being used?",
      "Ask about pregnancy/postpartum state, recent head injury, anticoagulants, cancer, immune suppression, or a new headache after age 50.",
    ],
    redFlagSymptoms: [
      "Thunderclap or worst-ever headache, especially at sudden maximum intensity",
      "Headache with fever and neck stiffness, confusion, seizure, focal weakness, speech difficulty, or visual loss",
      "New progressive headache, headache after trauma, pregnancy/postpartum headache, or anticoagulant use",
      "Persistent vomiting, papilloedema symptoms, or severe headache with markedly high blood pressure",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Vikriti and Nidana: note sleep, stress, diet, screen exposure, seasonal and menstrual triggers as supportive history.",
      "Prakriti and Sattva: record baseline temperament and mental stress without using them to dismiss neurological red flags.",
      "Agni/Ahara Shakti: ask about meal skipping, digestion and hydration.",
    ],
    icd10Mappings: [
      { code: "R51", description: "Headache" },
      { code: "G43.9", description: "Migraine, unspecified, not intractable" },
      { code: "G44.2", description: "Tension-type headache" },
      { code: "R42", description: "Dizziness and giddiness" },
    ],
    source: PRIMARY_CARE_SOURCE,
  },
  {
    id: "joint-pain-vata-rakta",
    symptomCluster: "joint_pain_vata_rakta",
    title: "Joint pain, arthritis and Vata-Rakta correlates",
    keywords: [
      "joint pain", "arthritis", "joint swelling", "gout", "uric acid", "knee pain", "back pain",
      "muscle pain", "stiffness", "morning stiffness", "vata rakta", "vatarkta", "rheumatoid",
    ],
    mandatoryFollowUpQuestions: [
      "Which joints are affected, when did the pain start, and is it sudden, recurrent, or gradually progressive?",
      "Is there swelling, warmth, redness, morning stiffness, fever, rash, or inability to bear weight?",
      "Ask about trauma, previous gout or arthritis, psoriasis, bowel disease, recent infection, and family history.",
      "What is the effect on walking, grip, sleep and daily activities, and what medicines or supplements have been taken?",
      "Ask about diet, alcohol, dehydration, kidney disease and medicines that can affect uric acid when clinically relevant.",
    ],
    redFlagSymptoms: [
      "A hot, swollen joint with fever or systemic illness --- urgent assessment for septic arthritis",
      "Inability to bear weight, deformity, severe trauma, rapidly progressive swelling, or neurovascular symptoms",
      "Joint pain with purpura, severe weakness, persistent fever, or unexplained weight loss",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Vikriti and Vata-Rakta correlate: document pain, stiffness, swelling, skin changes and triggers as traditional descriptors, not as a confirmed diagnosis.",
      "Nidana and Satmya: diet, alcohol, activity, climate, sleep and occupational exposures.",
      "Prakriti, Sara, Samhanana and Vaya: baseline build, tissue quality and age can be recorded for AYUSH review.",
    ],
    icd10Mappings: [
      { code: "M25.5", description: "Pain in joint" },
      { code: "M13.9", description: "Arthritis, unspecified" },
      { code: "M10.9", description: "Gout, unspecified" },
      { code: "M06.9", description: "Rheumatoid arthritis, unspecified" },
      { code: "M54.5", description: "Low back pain" },
    ],
    source: `${PRIMARY_CARE_SOURCE}; ${AYUSH_SOURCE}`,
  },
  {
    id: "acid-peptic-disease",
    symptomCluster: "acid_peptic_disease",
    title: "Acid peptic disease, dyspepsia and reflux",
    keywords: [
      "acidity", "heartburn", "dyspepsia", "gastritis", "ulcer", "epigastric", "reflux",
      "indigestion", "burning stomach", "bloating", "sour taste", "gerd", "peptic",
    ],
    mandatoryFollowUpQuestions: [
      "Where is the discomfort, when did it start, and is it related to meals, lying down, or exertion?",
      "Ask about vomiting, blood in vomit, black stool, difficulty swallowing, persistent pain, early satiety, or weight loss.",
      "What painkillers or steroids are being used, especially ibuprofen, diclofenac or aspirin? Ask about alcohol and tobacco.",
      "Has there been previous ulcer disease, H. pylori treatment, anaemia, liver disease, or a similar recurrent episode?",
      "What foods, medicines, position or home remedies make it better or worse, and what treatment has already been tried?",
    ],
    redFlagSymptoms: [
      "Vomiting blood, black tarry stool, fainting, or symptomatic anaemia",
      "Progressive dysphagia, persistent vomiting, unexplained weight loss, or a new persistent symptom at older age",
      "Sudden severe abdominal pain, rigid abdomen, or pain that could represent a cardiac presentation",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Agni/Ahara Shakti: appetite, meal timing, digestion, burning and post-meal heaviness.",
      "Koshtha and Nidana: bowel pattern, food triggers, stress, sleep, caffeine, tobacco and alcohol.",
      "Vikriti and Satmya: document current symptom pattern and food tolerance without replacing investigation of bleeding or weight loss.",
    ],
    icd10Mappings: [
      { code: "R10.13", description: "Epigastric pain" },
      { code: "K21.9", description: "Gastro-oesophageal reflux disease without oesophagitis" },
      { code: "K27.9", description: "Peptic ulcer, site unspecified, unspecified as acute or chronic" },
      { code: "K29.7", description: "Gastritis, unspecified" },
    ],
    source: `${PRIMARY_CARE_SOURCE}; ${AYUSH_SOURCE}`,
  },
  {
    id: "pediatric-fever",
    symptomCluster: "pediatric_fever",
    title: "Pediatric fever and acute illness",
    keywords: [
      "child", "children", "infant", "baby", "newborn", "pediatric", "paediatric", "toddler",
      "child fever", "infant fever", "convulsion", "febrile seizure", "poor feeding",
    ],
    mandatoryFollowUpQuestions: [
      "What is the child's age, weight, measured temperature, and exact duration of fever?",
      "Is the child alert and interacting, feeding normally, passing urine, and breathing comfortably?",
      "Ask about vomiting, diarrhoea, rash, seizures, neck stiffness, ear pain, cough, and localising symptoms.",
      "Is immunisation up to date, and has there been contact with a sick person, unsafe water, mosquito exposure, or recent travel?",
      "Which medicine and dose was given, when was it given, and does the child have a chronic illness or immune problem?",
    ],
    redFlagSymptoms: [
      "Fever in an infant under 3 months, especially with poor feeding or reduced activity",
      "Lethargy, unresponsiveness, convulsion, stiff neck, bulging fontanelle, or persistent inconsolable crying",
      "Severe breathing difficulty, cyanosis, non-blanching rash, shock, or markedly reduced urine",
      "Repeated vomiting, inability to drink, severe dehydration, or rapidly worsening illness",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Vaya and Bala: age, developmental baseline, nutritional status and strength are essential context.",
      "Agni/Ahara Shakti and Koshtha: feeding, digestion, bowel and hydration history.",
      "Prakriti/Vikriti may be documented only as complementary AYUSH context; urgent pediatric triage takes priority.",
    ],
    icd10Mappings: [
      { code: "R50.9", description: "Fever, unspecified" },
      { code: "J06.9", description: "Acute upper respiratory infection, unspecified" },
      { code: "A09", description: "Infectious gastroenteritis and colitis, unspecified" },
      { code: "R56.0", description: "Febrile convulsions" },
    ],
    source: `${ICMR_ACUTE_FEVER_SOURCE}; Indian pediatric triage principles; WHO ICD-10`,
  },
  {
    id: "skin-rash",
    symptomCluster: "skin_rash",
    title: "Skin rash, itching and allergic eruption",
    keywords: [
      "rash", "skin rash", "itch", "itching", "pruritus", "hives", "urticaria", "allergy",
      "eczema", "psoriasis", "blister", "skin lesion", "wound", "pustule", "purpura",
    ],
    mandatoryFollowUpQuestions: [
      "When did the rash start, where did it begin, how quickly has it spread, and is it itchy, painful, or burning?",
      "Is there fever, facial swelling, breathing difficulty, mouth/eye/genital involvement, blisters, skin peeling, or purple spots?",
      "Ask about new medicines, antibiotics, food, cosmetics, detergent, plants, insects, travel, and sick contacts.",
      "Has the patient had a similar rash, eczema, asthma, allergy, diabetes, immune suppression, or recent infection?",
      "What treatment has been applied, and are there photographs or a known trigger available for clinician review?",
    ],
    redFlagSymptoms: [
      "Facial, lip or tongue swelling with wheeze, stridor, faintness, or breathing difficulty",
      "Blisters, skin peeling, painful widespread rash, or erosions of the mouth, eyes or genital area after a medicine",
      "Non-blanching purpura with fever, rapidly spreading painful redness, or signs of sepsis",
      "Eye involvement, severe facial infection, or rash in a very unwell infant",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Vikriti and Nidana: document onset, season, food, medicine, contact and environmental triggers.",
      "Prakriti and Sara: baseline skin characteristics may be recorded for AYUSH review, without assigning causation.",
      "Agni/Ahara Shakti and Satmya: ask about food tolerance and known sensitivities while prioritising anaphylaxis screening.",
    ],
    icd10Mappings: [
      { code: "R21", description: "Rash and other nonspecific skin eruption" },
      { code: "L50.9", description: "Urticaria, unspecified" },
      { code: "L30.9", description: "Dermatitis, unspecified" },
      { code: "B09", description: "Viral infection unspecified with skin lesions" },
    ],
    source: `${PRIMARY_CARE_SOURCE}; ${AYUSH_SOURCE}`,
  },
  {
    id: "urinary-symptoms",
    symptomCluster: "urinary_symptoms",
    title: "Urinary symptoms, UTI and renal colic",
    keywords: [
      "urine", "urinary", "dysuria", "burning urination", "burning urine", "frequency", "urgency",
      "uti", "urinary infection", "blood in urine", "hematuria", "haematuria", "flank pain", "loin pain",
      "kidney stone", "renal colic", "poor urine", "anuria",
    ],
    mandatoryFollowUpQuestions: [
      "When did burning, frequency, urgency, reduced urine, or pain begin, and is it getting worse?",
      "Is there fever, chills, flank pain, vomiting, blood in urine, inability to pass urine, or genital discharge?",
      "Ask about pregnancy, sex, age, diabetes, kidney disease, prior stones, recurrent UTI, catheter use, and recent antibiotics.",
      "What is the urine volume and colour, and has the patient had similar symptoms or a urine test before?",
      "What medicines, analgesics, antibiotics or traditional remedies have already been taken?",
    ],
    redFlagSymptoms: [
      "Fever with flank pain, rigors, vomiting, confusion, or shock --- possible upper urinary infection/sepsis",
      "Inability to pass urine, anuria/marked oliguria, severe colicky pain, or a solitary kidney",
      "Gross haematuria with clots, severe bleeding, pregnancy with pain/fever, or testicular pain",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Mutra vaha symptom history may be recorded as an AYUSH correlate, while infection, obstruction and pregnancy are assessed medically.",
      "Agni/Ahara Shakti, hydration, Satmya and Nidana: fluid intake, diet, heat exposure and recurrent triggers.",
      "Vikriti and Vaya: current urinary pattern and age-specific risk factors.",
    ],
    icd10Mappings: [
      { code: "R30.0", description: "Dysuria" },
      { code: "N39.0", description: "Urinary tract infection, site not specified" },
      { code: "N20.0", description: "Calculus of kidney" },
      { code: "R31.9", description: "Haematuria, unspecified" },
    ],
    source: PRIMARY_CARE_SOURCE,
  },
  {
    id: "fatigue-anemia",
    symptomCluster: "fatigue_anemia",
    title: "Fatigue, weakness and possible anemia",
    keywords: [
      "fatigue", "tired", "weakness", "weak", "anemia", "anaemia", "pallor", "low hemoglobin",
      "haemoglobin", "breathless on exertion", "heavy periods", "bleeding", "exhaustion", "lethargy",
    ],
    mandatoryFollowUpQuestions: [
      "When did fatigue begin, is it constant or exertional, and how has it affected work, walking, sleep and daily activities?",
      "Ask about breathlessness, palpitations, dizziness, fainting, chest pain, pallor, fever, night sweats, and weight loss.",
      "Ask about diet, heavy or irregular menstrual bleeding, pregnancy, blood in stool/urine, black stool, and other bleeding.",
      "What chronic diseases, infections, kidney problems, medicines, supplements, sleep issues, or mood symptoms are present?",
      "Are any haemoglobin, CBC, ferritin, glucose, thyroid, kidney or other test results available?",
    ],
    redFlagSymptoms: [
      "Syncope, chest pain, severe breathlessness at rest, confusion, or very rapid heartbeat",
      "Active heavy bleeding, haematemesis, melaena, or severe pallor with circulatory symptoms",
      "Fatigue with persistent fever, night sweats, unexplained weight loss, or rapidly worsening weakness",
      "Pregnancy with significant weakness, bleeding, breathlessness or fainting",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Bala, Sara and Pramana: baseline strength, tissue quality, nutrition and body measurements.",
      "Agni/Ahara Shakti and Satmya: appetite, digestion, diet quality, food tolerance and adaptation.",
      "Vyayama Shakti and Sattva: exercise tolerance, sleep, stress and mental strength as complementary context.",
    ],
    icd10Mappings: [
      { code: "R53", description: "Malaise and fatigue" },
      { code: "D64.9", description: "Anaemia, unspecified" },
      { code: "D50.9", description: "Iron deficiency anaemia, unspecified" },
      { code: "R53.1", description: "Weakness" },
    ],
    source: `${PRIMARY_CARE_SOURCE}; ${AYUSH_SOURCE}`,
  },
  {
    id: "diabetes-hypertension-follow-up",
    symptomCluster: "diabetes_hypertension_follow_up",
    title: "Diabetes and hypertension follow-up",
    keywords: [
      "diabetes", "diabetic", "sugar", "glucose", "hba1c", "insulin", "hypertension", "blood pressure",
      "bp", "high bp", "follow up", "follow-up", "checkup", "check-up", "hypertensive", "metformin",
    ],
    mandatoryFollowUpQuestions: [
      "What are the diagnosis, duration, recent home glucose or blood-pressure readings, and most recent HbA1c or renal results?",
      "Ask about missed doses, side effects, diet, exercise, tobacco/alcohol, sleep, and all prescribed or over-the-counter medicines.",
      "Screen for hypoglycaemia, excessive thirst or urination, weight change, chest pain, breathlessness, headache, and visual symptoms.",
      "Ask about foot wounds or numbness, kidney disease, urine changes, eye review, cardiovascular disease, and prior stroke.",
      "What is the reason for today's follow-up, and what monitoring or treatment change was previously advised?",
    ],
    redFlagSymptoms: [
      "Severe hypoglycaemia with confusion, seizure, inability to swallow, or loss of consciousness",
      "Vomiting, abdominal pain, deep breathing, severe dehydration, or altered sensorium with high glucose",
      "Blood pressure at or above 180/120 mmHg with chest pain, breathlessness, neurological deficit, severe headache, or visual loss",
      "New stroke symptoms, acute coronary symptoms, rapidly worsening kidney function, or infected foot wound",
      ...SYSTEMIC_RED_FLAG_SYMPTOMS,
    ],
    ayushCorrelates: [
      "Prakriti, Vikriti, Ahara Shakti and Nidana: diet, activity, sleep, stress and treatment adherence as complementary history.",
      "Vyayama Shakti and Pramana: functional capacity, weight trend and body measurements.",
      "Satmya and Vaya: food adaptation, age, polypharmacy and patient preferences for shared clinical review.",
    ],
    icd10Mappings: [
      { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
      { code: "I10", description: "Essential (primary) hypertension" },
      { code: "E11.8", description: "Type 2 diabetes mellitus with unspecified complications" },
      { code: "Z09", description: "Follow-up examination after treatment for conditions other than malignant neoplasm" },
    ],
    source: `${PRIMARY_CARE_SOURCE}; ${AYUSH_SOURCE}`,
  },
];

/** Safe generic triage context for an unfamiliar complaint. */
export const GENERAL_OPD_SAFETY_GUIDELINE: ClinicalGuidelineChunk = {
  id: "general-opd-safety",
  symptomCluster: "general_opd",
  title: "General OPD symptom safety screen",
  keywords: [],
  mandatoryFollowUpQuestions: [
    "When did the main problem start, is it worsening, and how severe is it today?",
    "What other symptoms are present, and what medicines or home treatments have already been used?",
    "Ask about pregnancy, major chronic illness, allergies, recent travel, infection exposure, and relevant test results.",
    "Screen for severe breathing difficulty, altered sensorium, fainting, active bleeding, persistent vomiting, and markedly reduced urine.",
  ],
  redFlagSymptoms: [...SYSTEMIC_RED_FLAG_SYMPTOMS],
  ayushCorrelates: [
    "If AYUSH mode is enabled, record Prakriti, Vikriti, Vaya, Agni/Ahara Shakti and relevant Nidana as complementary history.",
  ],
  icd10Mappings: [],
  source: PRIMARY_CARE_SOURCE,
};
