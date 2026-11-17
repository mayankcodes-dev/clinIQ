"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

interface LoaderCopy {
  heading: string;
  preparing: (seconds: number) => string;
}

const LOCALIZED_COPY: Record<string, LoaderCopy> = {
  en: {
    heading: "Preparing your next question…",
    preparing: (seconds) => `Ready in ${seconds}s`,
  },
  hi: {
    heading: "अगला सवाल तैयार हो रहा है…",
    preparing: (seconds) => `${seconds} सेकंड में तैयार`,
  },
  bn: {
    heading: "পরবর্তী প্রশ্ন প্রস্তুত হচ্ছে…",
    preparing: (seconds) => `${seconds} সেকেন্ডে প্রস্তুত`,
  },
  ta: {
    heading: "அடுத்த கேள்வி தயாராகிறது…",
    preparing: (seconds) => `${seconds} விநாடிகளில் தயார்`,
  },
  te: {
    heading: "తదుపరి ప్రశ్న సిద్ధమవుతోంది…",
    preparing: (seconds) => `${seconds} సెకన్లలో సిద్ధం`,
  },
  mr: {
    heading: "पुढचा प्रश्न तयार होत आहे…",
    preparing: (seconds) => `${seconds} सेकंदात तयार`,
  },
  gu: {
    heading: "આગળનો પ્રશ્ન તૈयार થઈ રહ્યો છે…",
    preparing: (seconds) => `${seconds} સેકન્ડમાં તૈYAR`,
  },
  kn: {
    heading: "ಮುಂದಿನ ಪ್ರಶ್ನೆ ತಯಾರಾಗುತ್ತಿದೆ…",
    preparing: (seconds) => `${seconds} ಸೆಕೆಂಡ್‌ನಲ್ಲಿ ಸಿದ್ಧ`,
  },
  ml: {
    heading: "അടുത്ത ചോദ്യം തയ്യാറാകുന്നു…",
    preparing: (seconds) => `${seconds} സെക്കൻഡിൽ തയ്യാർ`,
  },
  pa: {
    heading: "ਅਗਲਾ ਸਵਾਲ ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ…",
    preparing: (seconds) => `${seconds} ਸਕਿੰਟਾਂ ਵਿੱਚ ਤਿਆਰ`,
  },
  ur: {
    heading: "اگلا سوال تیار ہو رہا ہے…",
    preparing: (seconds) => `${seconds} سیکنڈ میں تیار`,
  },
};

const DEFAULT_COPY = LOCALIZED_COPY.en;

export interface InterQuestionLoaderProps {
  lang: string;
  customStatusText?: string;
}

export default function InterQuestionLoader({
  lang,
  customStatusText,
}: InterQuestionLoaderProps) {
  const copy = LOCALIZED_COPY[lang] ?? DEFAULT_COPY;
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    setSecondsRemaining(3);
    const countdownTimer = window.setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(1, seconds - 1));
    }, 1000);

    return () => window.clearInterval(countdownTimer);
  }, [lang, customStatusText]);

  return (
    <div className="bg-[#f4f5f7] rounded-3xl p-4 sm:p-8 flex items-center justify-center min-h-[420px]">
      <div className="max-w-[540px] w-full min-h-[360px] bg-white border border-slate-200/90 rounded-[24px] shadow-[0_2px_12px_rgba(15,23,42,0.03)] px-8 py-16 flex flex-col items-center justify-center text-center gap-6">
        {/* Animated ring + icon */}
        <div className="relative w-16 h-16">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="28"
              fill="none" stroke="#e2e8f0" strokeWidth="4"
            />
            <circle
              cx="32" cy="32" r="28"
              fill="none" stroke="#0d9488" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="175.9"
              strokeDashoffset={175.9 * (secondsRemaining / 3)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={24} className="text-teal-600" strokeWidth={1.5} />
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
            {customStatusText?.trim() || copy.heading}
          </h2>
          <p className="text-sm text-slate-500" role="status" aria-live="polite">
            {copy.preparing(secondsRemaining)}
          </p>
        </div>
      </div>
    </div>
  );
}
