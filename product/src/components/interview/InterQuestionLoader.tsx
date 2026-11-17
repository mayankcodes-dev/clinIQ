"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface LoaderCopy {
  heading: string;
  preparing: (seconds: number) => string;
}

const LOCALIZED_COPY: Record<string, LoaderCopy> = {
  en: {
    heading: "Curating a personalized question based on your symptoms",
    preparing: (seconds) => `Preparing next question in ${seconds} seconds...`,
  },
  hi: {
    heading: "------------ --------------------- ------ ------------ ------ ------------ ------------------ --------------- ------------ ------ --------- ------",
    preparing: (seconds) => `${seconds} --------------- --------- ------------ ------------------ --------------- ------------...`,
  },
  bn: {
    heading: "--------------- ------------------------ ------------------------ --------------------- ------------------ ------------ --------- ---------------",
    preparing: (seconds) => `${seconds} --------------------------- --------------- --------------------- ------------------ ------------------------ ---------...`,
  },
  ta: {
    heading: "------------------ ------------------------------------ ------------------------------------ ------------------ ------------------ ------------------------------------------------------",
    preparing: (seconds) => `${seconds} --------------------------------- ------------------ ------------------ ---------------------------...`,
  },
  te: {
    heading: "------ --------------------- --------------------- ------------------ ------------------ ------------------ ---------------------------------",
    preparing: (seconds) => `${seconds} ------------------------ ------------------ ------------------ ---------------------------------------...`,
  },
  mr: {
    heading: "--------------------- --------------------------- ------------------ --------------- ------------------ ------------ ------------ --------- ---------",
    preparing: (seconds) => `${seconds} ------------------------ --------------- ------------------ ------------ ------------...`,
  },
  gu: {
    heading: "--------------- ------------------------ --------------- --------------- ------------------ --------------- --------------------- --------- --------------- ------",
    preparing: (seconds) => `${seconds} --------------------------- --------------- ------------------ --------------- ---------...`,
  },
  kn: {
    heading: "--------------- --------------------- --------------- ------------ ------------------ ------------------------------------ ---------------------------------------------------------",
    preparing: (seconds) => `${seconds} --------------------------------------- ------------------ --------------------- ------------------------------------------...`,
  },
  ml: {
    heading: "--------------------------- ------------------------------------ --------------------------------------- ------------------ ------------------ ---------------------------------------------",
    preparing: (seconds) => `${seconds} --------------------------------------------- ------------------ ------------------ ------------------------------...`,
  },
  pa: {
    heading: "------------------ ------------------ ------ ------------ '------ ------------ ------------ ------------ ------------ ------ ------------ ------",
    preparing: (seconds) => `${seconds} --------------------- ------------ ------------ ------------ ------------ ------------------...`,
  },
  ur: {
    heading: "---- ---- ------------ ---- ---------- ---- -------- -------- -------- ------ ---- ------ ----",
    preparing: (seconds) => `${seconds} ---------- ------ -------- -------- -------- --------...`,
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
      <div className="max-w-[540px] w-full min-h-[360px] bg-white border border-slate-200/90 rounded-[24px] shadow-[0_2px_12px_rgba(15,23,42,0.03)] px-8 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 flex items-center justify-center mb-6">
          <CheckCircle2 size={56} className="text-emerald-500" strokeWidth={1.5} />
        </div>

        <h2 className="text-xl sm:text-[22px] font-semibold text-slate-900 mb-3">
          {customStatusText?.trim() || copy.heading}
        </h2>
        <p className="text-sm sm:text-[15px] text-slate-500" role="status" aria-live="polite">
          {copy.preparing(secondsRemaining)}
        </p>
      </div>
    </div>
  );
}
