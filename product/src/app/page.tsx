"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

// 13 Tier-1 Indian languages — code matches mk_lang sessionStorage key
const LANGUAGES = [
  { code: "hi", name: "हिन्दी",        english: "Hindi",      script: "देवनागरी" },
  { code: "en", name: "English",        english: "English",    script: "Latin" },
  { code: "bn", name: "বাংলা",          english: "Bengali",    script: "বাংলা" },
  { code: "te", name: "తెలుగు",         english: "Telugu",     script: "తెలుగు" },
  { code: "mr", name: "मराठी",          english: "Marathi",    script: "देवनागरी" },
  { code: "ta", name: "தமிழ்",          english: "Tamil",      script: "தமிழ்" },
  { code: "gu", name: "ગુજરાતી",        english: "Gujarati",   script: "ગુજરાતી" },
  { code: "kn", name: "ಕನ್ನಡ",          english: "Kannada",    script: "ಕನ್ನಡ" },
  { code: "ml", name: "മലയാളം",         english: "Malayalam",  script: "മലയാളം" },
  { code: "pa", name: "ਪੰਜਾਬੀ",         english: "Punjabi",    script: "ਗੁਰਮੁਖੀ" },
  { code: "or", name: "ଓଡ଼ିଆ",          english: "Odia",       script: "ଓଡ଼ିଆ" },
  { code: "ur", name: "اردو",           english: "Urdu",       script: "نستعلیق" },
  { code: "as", name: "অসমীয়া",        english: "Assamese",   script: "অসমীয়া" },
];

export default function LanguageSelect() {
  const router = useRouter();

  function selectLanguage(code: string) {
    sessionStorage.setItem("mk_lang", code);
    router.push("/patient/consent");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-teal-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/cliniq-logo.svg"
            alt="ClinIQ"
            width={100}
            height={32}
            className="h-8 w-auto"
          />
        </div>
        <p className="text-xs text-neutral-400 font-medium">AI Clinical History Platform</p>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-black text-neutral-900 mb-2">
            अपनी भाषा चुनें
          </h1>
          <p className="text-neutral-500 text-base font-medium">
            Choose your language · ਭਾਸ਼ਾ ਚੁਣੋ · மொழியை தேர்வு செய்யவும்
          </p>
        </motion.div>

        {/* Language grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
          {LANGUAGES.map((lang, i) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => selectLanguage(lang.code)}
              className="group relative flex flex-col items-center justify-center gap-1 
                         bg-white border-2 border-neutral-200 rounded-2xl p-4 
                         hover:border-brand-400 hover:bg-brand-50 hover:shadow-md
                         transition-all duration-150 min-h-[88px]"
            >
              <span className="text-2xl font-black text-neutral-900 group-hover:text-brand-700 transition-colors leading-none">
                {lang.name}
              </span>
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-brand-500 transition-colors">
                {lang.english}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-neutral-400 text-center mt-8"
        >
          🔒 आपका डेटा सुरक्षित है · Your data is protected
        </motion.p>
      </div>
    </div>
  );
}
