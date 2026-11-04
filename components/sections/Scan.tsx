"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeDollarSign, Check, ListOrdered, Loader2, Radar, Sparkles } from "lucide-react";
import clsx from "clsx";
import { SERVICE_ORDER } from "@/data/sample";
import { resultsFor } from "@/lib/plans";
import { STAGE, useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { SERVICE_ICON, Skeleton } from "../ui";
import { Section } from "./Section";

const TOTAL = 4500;
const STAGES = [
  { k: "scan1", icon: Radar },
  { k: "scan2", icon: BadgeDollarSign },
  { k: "scan3", icon: ListOrdered },
  { k: "scan4", icon: Sparkles },
] as const;

/**
 * About 4.5 seconds of named stages. Progress comes from elapsed time and a
 * fallback timer finishes regardless, so the scan can never get stuck.
 */
export function ScanSection() {
  const { s, dispatch, t, goNext } = useStore();
  const reduce = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    const start = performance.now();
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      dispatch({ type: "patch", patch: { scanDone: true } });
      goNext(STAGE.scan);
    };
    const id = window.setInterval(() => {
      const e = performance.now() - start;
      setElapsed(e);
      if (e >= TOTAL) finish();
    }, 100);
    const fallback = window.setTimeout(finish, TOTAL + 1500);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fallback);
    };
  }, [dispatch, goNext]);

  const pct = Math.min(100, Math.round((elapsed / TOTAL) * 100));
  const idx = Math.min(STAGES.length - 1, Math.floor((elapsed / TOTAL) * STAGES.length));
  const chosen = SERVICE_ORDER.filter((x) => s.services.includes(x));
  const colors = chosen.map((x) => service[x].vivid);
  const ring = colors.length > 1 ? `conic-gradient(${[...colors, colors[0]].join(", ")})` : colors[0] ?? "var(--primary)";
  const providers = [...new Set(resultsFor(s.services).plans.map((p) => p.provider))];

  return (
    <Section stage="scan" accent="linear-gradient(135deg, #10C79A, #1F6BFF)">
      <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <div className="mx-auto">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-security opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-security" />
            </span>
            {t("agentLive")}
          </p>
          <div aria-hidden className="relative mx-auto size-44 sm:size-52">
            <motion.div className="absolute inset-0 rounded-full" style={{ background: ring }} animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }} />
            <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-surface shadow-sm">
              <span className="font-display text-[2.75rem] font-semibold tracking-tight text-ink tabular">{pct}%</span>
              <span className="mt-2 flex gap-1">
                {chosen.map((x) => {
                  const Icon = SERVICE_ICON[x];
                  return (
                    <span key={x} className="flex size-7 items-center justify-center rounded-full" style={{ background: service[x].vivid, color: service[x].on }}>
                      <Icon className="size-3.5" strokeWidth={2.8} />
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h2 id="section-scan-h" tabIndex={-1} className="font-display text-2xl font-semibold leading-tight text-ink outline-none sm:text-3xl">
            {t("scanTitle")} <span className="text-brand">{s.address ? `${s.address.line1}, ${s.address.city}` : ""}</span>
          </h2>
          <p className="sr-only" role="status" aria-live="polite">
            {t("scanSr", { pct: Math.floor(pct / 25) * 25 })}
          </p>
          <ol className="mt-5 space-y-2.5">
            {STAGES.map((st, i) => {
              const state = i < idx || pct >= 100 ? "done" : i === idx ? "now" : "wait";
              const c = service[chosen[i % Math.max(1, chosen.length)] ?? "internet"];
              return (
                <li key={st.k} className={clsx("flex items-center gap-3 rounded-md border px-4 py-3 transition-all", state === "now" ? "bg-surface shadow-sm" : "border-transparent bg-surface2")} style={state === "now" ? { borderColor: c.vivid } : undefined}>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={state === "wait" ? { background: "var(--line)", color: "var(--muted)" } : { background: c.vivid, color: c.on }}>
                    {state === "done" ? <Check aria-hidden className="size-4" strokeWidth={3} /> : <st.icon aria-hidden className="size-4" strokeWidth={2.4} />}
                  </span>
                  <span className={clsx("flex-1 text-sm font-bold", state === "wait" ? "text-muted" : "text-ink")}>{t(st.k)}</span>
                  <span className="text-xs font-semibold text-muted">
                    {state === "now" ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 aria-hidden className="size-3.5 animate-spin" />
                        {t("stageNow")}
                      </span>
                    ) : state === "done" ? t("stageDone") : t("stageWait")}
                  </span>
                </li>
              );
            })}
          </ol>
          {providers.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{t("previewTitle")}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {providers.map((p, i) => (
                  <li key={p} className={clsx("rounded-full border px-3 py-1 text-sm font-bold transition-colors", i <= idx + 1 ? "border-primary bg-primary-soft text-primary" : "border-line text-muted")}>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 space-y-2" aria-hidden>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </Section>
  );
}
