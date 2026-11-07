"use client";

/**
 * Stacking-card animation — faithful port of the ui-layout reference.
 *
 * Key mechanics (must NOT be changed):
 *  - Each card wrapper is   h-screen + sticky top-0
 *  - The outer section is the useScroll target  offset: ['start start', 'end end']
 *  - scale is driven by progress (section-level), range = [i * (1/n), 1]
 *  - targetScale = 1 - (n - i) * 0.05  (cards further back shrink more)
 *  - NO ReactLenis here — it lives at the page root (layout.tsx or page.tsx)
 *
 * CSS prerequisite (globals.css):
 *   .landing-page { overflow-x: clip; }   ← NOT overflow:hidden — that kills sticky
 */

import { useTransform, motion, useScroll, type MotionValue } from "motion/react";import { useRef } from "react";
import Image from "next/image";

// ─── Data shape ───────────────────────────────────────────────────────────────

export interface FeatureCardData {
  tag: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  accentColor?: string;
  color: string; // card background (hex / CSS colour)
}

// ─── Single card ──────────────────────────────────────────────────────────────

interface CardProps {
  i: number;
  feature: FeatureCardData;
  progress: MotionValue<number>; // section-level scrollYProgress
  range: [number, number];
  targetScale: number;
}

function Card({ i, feature, progress, range, targetScale }: CardProps) {
  const container = useRef<HTMLDivElement>(null);

  // Track when this individual card enters the viewport (for image parallax)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "start start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale      = useTransform(progress, range, [1, targetScale]);

  return (
    // The sticky wrapper — h-screen keeps it in flow; sticky top-0 pins it
    <div
      ref={container}
      className="h-screen flex items-center justify-center sticky top-0"
    >
      <motion.div
        style={{
          backgroundColor: feature.color,
          scale,
          // Offset each card down so stacked cards peek from behind
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className="relative -top-[25%] flex flex-col h-[450px] w-[70%] max-w-[1060px] rounded-2xl p-10 origin-top shadow-2xl"
      >
        {/* ── Inner layout: copy left, image right ───────────────────── */}
        <div className="flex h-full gap-10">

          {/* Copy */}
          <div className="w-[40%] flex flex-col justify-start relative top-[10%]">
            <p
              className="text-[10px] font-extrabold uppercase tracking-widest mb-3"
              style={{ color: feature.accentColor ?? "#0d9488" }}
            >
              {feature.tag}
            </p>
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#0f172a] mb-4">
              {feature.title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {feature.body}
            </p>
          </div>

          {/* Image */}
          <div className="relative w-[60%] h-full rounded-xl overflow-hidden">
            <motion.div
              className="absolute inset-0 w-full h-full"
              style={{ scale: imageScale }}
            >
              <Image
                src={feature.image}
                alt={feature.alt}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
              />
            </motion.div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

export interface StackingFeaturesProps {
  features: FeatureCardData[];
}

/**
 * Drop into any page section.
 * The parent must NOT have overflow:hidden (use overflow-x:clip instead).
 */
export function StackingFeatures({ features }: StackingFeaturesProps) {
  const container = useRef<HTMLDivElement>(null);

  // Track the full scroll through this section
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    // This div is the scroll target — its height = sum of all h-screen wrappers
    <div ref={container}>
      {features.map((feature, i) => {
        // Last card stays at scale 1; earlier cards shrink as later ones cover them
        const targetScale = 1 - (features.length - i) * 0.05;

        return (
          <Card
            key={feature.tag}
            i={i}
            feature={feature}
            progress={scrollYProgress}
            // range: start shrinking when this card is "in position", end at full scroll
            range={[i * (1 / features.length), 1]}
            targetScale={targetScale}
          />
        );
      })}
    </div>
  );
}
