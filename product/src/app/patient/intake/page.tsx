"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  KioskHeader,
  KioskScreen,
  KioskBody,
  KioskFooter,
} from "@/components/kiosk/KioskLayout";
import { Button } from "@/components/ui/primitives";
import { User, Calendar, Users } from "lucide-react";
import { SessionStore } from "@/lib/sessionStore";

// ── Localised labels ──────────────────────────────────────────────────────────
const L = {
  en: { title: "About You", sub: "Basic information", name: "Full Name", namePh: "e.g. Ravi Kumar", age: "Age (years)", agePh: "e.g. 42", sex: "Sex", male: "Male", female: "Female", other: "Other", cont: "Continue →", skip: "Skip" },
  hi: { title: "आपके बारे में", sub: "बुनियादी जानकारी", name: "पूरा नाम", namePh: "जैसे रवि कुमार", age: "उम्र (वर्ष)", agePh: "जैसे 42", sex: "लिंग", male: "पुरुष", female: "महिला", other: "अन्य", cont: "आगे बढ़ें →", skip: "छोड़ें" },
  bn: { title: "আপনার সম্পর্কে", sub: "মৌলিক তথ্য", name: "পুরো নাম", namePh: "যেমন রবি কুমার", age: "বয়স (বছর)", agePh: "যেমন 42", sex: "লিঙ্গ", male: "পুরুষ", female: "মহিলা", other: "অন্যান্য", cont: "এগিয়ে যান →", skip: "এড়িয়ে যান" },
  ta: { title: "உங்களைப் பற்றி", sub: "அடிப்படை தகவல்", name: "முழு பெயர்", namePh: "எ.கா. ரவி குமார்", age: "வயது (ஆண்டுகள்)", agePh: "எ.கா. 42", sex: "பாலினம்", male: "ஆண்", female: "பெண்", other: "மற்றவை", cont: "தொடரவும் →", skip: "தவிர்" },
  te: { title: "మీ గురించి", sub: "ప్రాథమిక సమాచారం", name: "పూర్తి పేరు", namePh: "ఉదా. రవి కుమార్", age: "వయసు (సంవత్సరాలు)", agePh: "ఉదా. 42", sex: "లింగం", male: "పురుషుడు", female: "మహిళ", other: "ఇతర", cont: "కొనసాగించు →", skip: "దాటవేయి" },
  mr: { title: "तुमच्याबद्दल", sub: "मूलभूत माहिती", name: "पूर्ण नाव", namePh: "उदा. रवि कुमार", age: "वय (वर्षे)", agePh: "उदा. 42", sex: "लिंग", male: "पुरुष", female: "स्त्री", other: "इतर", cont: "पुढे जा →", skip: "वगळा" },
  gu: { title: "તમારા વિશે", sub: "મૂળભૂત માહિતી", name: "પૂરું નામ", namePh: "ઉ.દા. રવિ કુમાર", age: "ઉંમર (વર્ષ)", agePh: "ઉ.દા. 42", sex: "જાતિ", male: "પુરુષ", female: "સ્ત્રી", other: "અન્ય", cont: "આગળ વધો →", skip: "છોડો" },
  kn: { title: "ನಿಮ್ಮ ಬಗ್ಗೆ", sub: "ಮೂಲ ಮಾಹಿತಿ", name: "ಪೂರ್ಣ ಹೆಸರು", namePh: "ಉದಾ. ರವಿ ಕುಮಾರ್", age: "ವಯಸ್ಸು (ವರ್ಷ)", agePh: "ಉದಾ. 42", sex: "ಲಿಂಗ", male: "ಪುರುಷ", female: "ಮಹಿಳೆ", other: "ಇತರ", cont: "ಮುಂದುವರಿಸಿ →", skip: "ಬಿಡಿ" },
  ml: { title: "നിങ്ങളെ കുറിച്ച്", sub: "അടിസ്ഥാന വിവരം", name: "മുഴുവൻ പേര്", namePh: "ഉദാ. രവി കുമാർ", age: "പ്രായം (വർഷം)", agePh: "ഉദാ. 42", sex: "ലിംഗം", male: "പുരുഷൻ", female: "സ്ത്രീ", other: "മറ്റുള്ളവ", cont: "തുടരുക →", skip: "ഒഴിവാക്കുക" },
  pa: { title: "ਤੁਹਾਡੇ ਬਾਰੇ", sub: "ਮੁੱਢਲੀ ਜਾਣਕਾਰੀ", name: "ਪੂਰਾ ਨਾਮ", namePh: "ਜਿਵੇਂ ਰਵੀ ਕੁਮਾਰ", age: "ਉਮਰ (ਸਾਲ)", agePh: "ਜਿਵੇਂ 42", sex: "ਲਿੰਗ", male: "ਪੁਰਸ਼", female: "ਇਸਤਰੀ", other: "ਹੋਰ", cont: "ਅੱਗੇ ਵਧੋ →", skip: "ਛੱਡੋ" },
  ur: { title: "آپ کے بارے میں", sub: "بنیادی معلومات", name: "پورا نام", namePh: "مثلاً رavi کمار", age: "عمر (سال)", agePh: "مثلاً 42", sex: "جنس", male: "مرد", female: "عورت", other: "دیگر", cont: "آگے بڑھیں →", skip: "چھوڑیں" },
};

type Sex = "male" | "female" | "other" | "";

export default function IntakePage() {
  const router = useRouter();
  const [lang, setLang] = useState("hi");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("");

  useEffect(() => {
    setLang(sessionStorage.getItem("mk_lang") ?? "hi");
    // Pre-fill if patient came back
    try {
      const saved = JSON.parse(sessionStorage.getItem("mk_patient") ?? "{}");
      if (saved.name) setName(saved.name as string);
      if (saved.age) setAge(String(saved.age));
      if (saved.gender) setSex(saved.gender as Sex);
    } catch { /**/ }
  }, []);

  const lc = L[lang as keyof typeof L] ?? L.hi;
  const canContinue = name.trim().length >= 2 && age.trim() && sex;

  function handleContinue(skip = false) {
    const patient = skip ? {} : {
      name: name.trim() || null,
      gender: sex || null,
      age: age.trim() || null,
      yearOfBirth: age.trim() ? String(new Date().getFullYear() - parseInt(age)) : null,
    };
    sessionStorage.setItem("mk_patient", JSON.stringify(patient));
    SessionStore.updateSession({ patient });
    router.push("/patient/opd-select");
  }

  return (
    <KioskScreen>
      <KioskHeader
        title={lc.title}
        subtitle={lc.sub}
        onBack={() => router.push("/patient/consent")}
        progress={20}
        stepLabel="3 / 7"
      />

      <KioskBody className="space-y-5">
        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-1.5"
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <User size={15} className="text-brand-600" />
            {lc.name}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lc.namePh}
            maxLength={80}
            className="w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3
                       text-base font-medium text-neutral-900 placeholder:text-neutral-400
                       focus:border-brand-500 focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Age */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-1.5"
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <Calendar size={15} className="text-brand-600" />
            {lc.age}
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder={lc.agePh}
            min={1}
            max={120}
            className="w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3
                       text-base font-medium text-neutral-900 placeholder:text-neutral-400
                       focus:border-brand-500 focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Sex */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-1.5"
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <Users size={15} className="text-brand-600" />
            {lc.sex}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["male", "female", "other"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className={`py-3 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95
                  ${sex === s
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-200"
                  }`}
              >
                {lc[s]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Mandatory notice */}
        <p className="text-xs text-neutral-400 text-center pt-1">
          Name · Age · Sex are needed for the doctor&apos;s record.
        </p>
      </KioskBody>

      <KioskFooter className="space-y-2">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          disabled={!canContinue}
          onClick={() => handleContinue(false)}
        >
          {lc.cont}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={() => handleContinue(true)}
        >
          {lc.skip}
        </Button>
      </KioskFooter>
    </KioskScreen>
  );
}
