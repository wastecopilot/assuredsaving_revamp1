"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { STAGE_NAMES, sectionId, useStore, type StageName } from "@/lib/store";

/**
 * A step card: white, generously rounded, with a gradient step tile and a
 * coloured signature bar. `dark` puts the card on the midnight stage instead.
 */
export function Section({ stage, accent, children, className, dark }: { stage: StageName; accent: string; children: ReactNode; wide?: boolean; className?: string; dark?: boolean }) {
  const reduce = useReducedMotion();
  const { s, t } = useStore();
  const visible = STAGE_NAMES.filter((n) => (n === "usage" ? s.services.includes("internet") : n === "tv" ? s.services.includes("tv") : true));
  const num = visible.indexOf(stage) + 1;
  return (
    <motion.section
      id={sectionId(stage)}
      aria-labelledby={`${sectionId(stage)}-h`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className={clsx("scroll-mt-36", className)}
    >
      <div className={clsx("relative rounded-[28px] shadow-md", dark ? "stage overflow-hidden" : "border border-line bg-surface")}>
        <div className="p-5 sm:p-9">
          <div className="mb-6 flex items-center gap-3">
            <span className="bg-cta flex size-11 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-glow">{num}</span>
            <div className="min-w-0">
              <p className={clsx("text-[11px] font-bold uppercase tracking-[0.16em]", dark ? "text-on-dark-muted" : "text-muted")}>{t("stepOf", { n: num, total: visible.length })}</p>
              <p className={clsx("text-sm font-extrabold", dark ? "text-white" : "text-ink")}>{t(`stage_${stage}`)}</p>
            </div>
            <span aria-hidden className="ml-auto hidden h-2 w-24 rounded-full sm:block" style={{ background: accent }} />
          </div>
          {children}
        </div>
      </div>
    </motion.section>
  );
}

/** Section heading: optional eyebrow, a bold title with one gradient phrase, and a subtitle. */
export function Heading({ id, eyebrow, a, b, sub, as = "h2", dark }: { id: string; eyebrow?: string; a: string; b?: string; sub?: string; as?: "h1" | "h2"; dark?: boolean }) {
  const H = as;
  return (
    <div>
      {eyebrow && <p className={clsx("text-xs font-extrabold uppercase tracking-[0.16em]", dark ? "text-neon" : "text-magenta")}>{eyebrow}</p>}
      <H id={id} tabIndex={-1} className={clsx("mt-1.5 text-[1.75rem] font-extrabold leading-tight tracking-tight outline-none sm:text-[2.25rem]", dark ? "text-white" : "text-ink")}>
        {a} {b && <span className={dark ? "text-neon" : "text-grad"}>{b}</span>}
      </H>
      {sub && <p className={clsx("mt-2 max-w-2xl text-base", dark ? "text-on-dark-muted" : "text-muted")}>{sub}</p>}
    </div>
  );
}
