"use client";
import { useEffect, useRef, useState } from "react";
import { BadgeDollarSign, Check, ListOrdered, Loader2, Radar, Sparkles } from "lucide-react";
import clsx from "clsx";
import { SERVICE_ORDER } from "@/data/sample";
import { resultsFor } from "@/lib/plans";
import { STAGE, useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { SERVICE_ICON } from "../ui";
import { Section } from "./Section";

const TOTAL = 4500;
const STAGES = [
  { k: "scan1", icon: Radar },
  { k: "scan2", icon: BadgeDollarSign },
  { k: "scan3", icon: ListOrdered },
  { k: "scan4", icon: Sparkles },
] as const;
const BAR = ["linear-gradient(90deg,#12C8E8,#5B2EE8)", "linear-gradient(90deg,#5B2EE8,#E0167A)", "linear-gradient(90deg,#3B5BFF,#12C8E8)", "linear-gradient(90deg,#E0167A,#FFB020)", "linear-gradient(90deg,#7DD322,#12C8E8)"];

/**
 * About 4.5 seconds of named stages on the midnight stage. Progress comes from
 * elapsed time and a fallback timer finishes regardless, so it can never get stuck.
 */
export function ScanSection() {
  const { s, dispatch, t, goNext } = useStore();
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
  const providers = [...new Set(resultsFor(s.services).plans.map((p) => p.provider))];
  /** Each provider's bar fills on its own schedule, staggered, all done by 90%. */
  const barPct = (i: number) => {
    const startAt = 0.06 + i * 0.1;
    const span = 0.55;
    return Math.max(0, Math.min(100, ((elapsed / TOTAL - startAt) / span) * 100));
  };

  return (
    <Section stage="scan" dark accent="linear-gradient(90deg,#E0167A,#5B2EE8,#12C8E8)">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-white">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-security opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-security" />
            </span>
            {t("agentLive")}
          </p>
          <h2 id="section-scan-h" tabIndex={-1} className="mt-4 text-[1.75rem] font-extrabold leading-tight tracking-tight text-white outline-none sm:text-[2.25rem]">
            {t("scanTitle")} <span className="text-neon">{s.address ? `${s.address.line1}, ${s.address.city}` : ""}</span>
          </h2>
          <p className="sr-only" role="status" aria-live="polite">
            {t("scanSr", { pct: Math.floor(pct / 25) * 25 })}
          </p>

          <div aria-hidden className="mt-6 flex items-end justify-between gap-4">
            <span className="text-neon text-6xl font-extrabold leading-none tracking-tight tabular">{pct}%</span>
            <span className="flex gap-1.5">
              {chosen.map((x) => {
                const Icon = SERVICE_ICON[x];
                return (
                  <span key={x} className="flex size-9 items-center justify-center rounded-xl" style={{ background: service[x].vivid, color: service[x].on }}>
                    <Icon className="size-4" strokeWidth={2.6} />
                  </span>
                );
              })}
            </span>
          </div>
          <div aria-hidden className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-[width] duration-150 ease-linear" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#E0167A,#9B21B5,#5B2EE8,#12C8E8)" }} />
          </div>

          {providers.length > 0 && (
            <div className="glass mt-6 rounded-[20px] p-4 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-dark-muted">{t("previewTitle")}</p>
              <ul className="mt-3 space-y-3">
                {providers.map((p, i) => {
                  const w = barPct(i);
                  return (
                    <li key={p} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                      <span className="truncate text-sm font-extrabold text-white">{p}</span>
                      <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full rounded-full" style={{ width: `${w}%`, background: BAR[i % BAR.length] }} />
                      </span>
                      <span className="w-16 text-right text-xs font-bold text-on-dark-muted">{w >= 100 ? t("stageDone") : w > 0 ? t("stageNow") : t("stageWait")}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <ol className="relative space-y-3 self-center">
          {STAGES.map((st, i) => {
            const state = i < idx || pct >= 100 ? "done" : i === idx ? "now" : "wait";
            return (
              <li key={st.k} className={clsx("flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors", state === "now" ? "bg-white text-ink shadow-overlay" : "glass text-white")}>
                <span
                  className={clsx(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    state === "done" ? "bg-security text-ink" : state === "now" ? "bg-cta text-white" : "border-2 border-white/25 text-on-dark-muted",
                  )}
                >
                  {state === "done" ? <Check aria-hidden className="size-5" strokeWidth={3} /> : <st.icon aria-hidden className="size-5" strokeWidth={2.4} />}
                </span>
                <span className={clsx("flex-1 text-sm font-extrabold", state === "wait" && "text-on-dark-muted")}>{t(st.k)}</span>
                <span className={clsx("text-xs font-bold", state === "now" ? "text-primary" : "text-on-dark-muted")}>
                  {state === "now" ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 aria-hidden className="size-3.5 animate-spin" />
                      {t("stageNow")}
                    </span>
                  ) : state === "done" ? (
                    t("stageDone")
                  ) : (
                    t("stageWait")
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
