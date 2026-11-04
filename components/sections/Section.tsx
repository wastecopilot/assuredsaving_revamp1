"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { STAGE_NAMES, sectionId, useStore, type StageName } from "@/lib/store";

/**
 * A workspace panel for one step. White card, hairline border, a step chip
 * in the header row and a thin accent rule. Reveals with a short rise.
 */
export function Section({ stage, accent, children, className }: { stage: StageName; accent: string; children: ReactNode; wide?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const { s, t } = useStore();
  const visible = STAGE_NAMES.filter((n) => (n === "usage" ? s.services.includes("internet") : n === "tv" ? s.services.includes("tv") : true));
  const num = visible.indexOf(stage) + 1;
  return (
    <motion.section
      id={sectionId(stage)}
      aria-labelledby={`${sectionId(stage)}-h`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className={clsx("scroll-mt-32", className)}
    >
      <div className="rounded-lg border border-line bg-surface shadow-md">
        <div aria-hidden className="h-1 rounded-t-[15px]" style={{ background: accent }} />
        <div className="p-5 sm:p-8">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface2 px-2.5 py-1 text-xs font-semibold text-muted">
            <span className="flex size-5 items-center justify-center rounded-full bg-navy text-[11px] text-white">{num}</span>
            {t("stepOf", { n: num, total: visible.length })} · {t(`stage_${stage}`)}
          </p>
          {children}
        </div>
      </div>
    </motion.section>
  );
}

/** Section heading: optional eyebrow, a clear title with one accented phrase, and a subtitle. */
export function Heading({ id, eyebrow, a, b, sub, as = "h2" }: { id: string; eyebrow?: string; a: string; b?: string; sub?: string; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}
      <H id={id} tabIndex={-1} className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-ink outline-none sm:text-[2rem]">
        {a} {b && <span className="text-primary">{b}</span>}
      </H>
      {sub && <p className="mt-2 max-w-2xl text-base text-muted">{sub}</p>}
    </div>
  );
}
