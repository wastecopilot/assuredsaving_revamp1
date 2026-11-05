"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { sectionId, type StageName } from "@/lib/store";

/** A step card: white, 1px border, 12px radius. `dark` = navy. No step numbers (as on the official site). */
export function Section({ stage, children, className, dark }: { stage: StageName; children: ReactNode; className?: string; dark?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={sectionId(stage)}
      aria-labelledby={`${sectionId(stage)}-h`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.32, ease: [0.2, 0, 0, 1] }}
      className={clsx("scroll-mt-32", className)}
    >
      <div className={clsx("rounded-xl p-5 sm:p-8", dark ? "on-dark bg-navy text-on-dark" : "border border-line bg-surface shadow-sm")}>
        {children}
      </div>
    </motion.section>
  );
}

/** Section heading: optional eyebrow, a title with one highlighted phrase, a subtitle. */
export function Heading({ id, eyebrow, a, b, after, sub, dark }: { id: string; eyebrow?: string; a: string; b?: string; after?: string; sub?: string; dark?: boolean }) {
  return (
    <div>
      {eyebrow && <p className={clsx("mb-1.5 text-xs font-semibold uppercase tracking-wider", dark ? "text-accent" : "text-muted")}>{eyebrow}</p>}
      <h2 id={id} tabIndex={-1} className={clsx("text-2xl font-bold leading-tight outline-none sm:text-[1.875rem]", dark ? "text-white" : "text-ink")}>
        {a} {b && <span className={dark ? "text-accent" : "text-primary"}>{b}</span>}
        {after}
      </h2>
      {sub && <p className={clsx("mt-2 max-w-2xl text-base", dark ? "text-on-dark-muted" : "text-muted")}>{sub}</p>}
    </div>
  );
}
