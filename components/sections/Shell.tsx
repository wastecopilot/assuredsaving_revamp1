"use client";
import { ArrowLeft, Check, Lock, ShieldCheck, Zap, Eye } from "lucide-react";
import clsx from "clsx";
import { STAGE_NAMES, useStore, type StageName } from "@/lib/store";
import { service } from "@/lib/tokens";

/** Shield-check mark: navy tile with an azure shield. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="8" fill="var(--navy)" />
      <path d="M16 5.5 7 9v6.4c0 5.6 3.8 9.6 9 11.1 5.2-1.5 9-5.5 9-11.1V9l-9-3.5Z" fill="var(--primary)" />
      <path d="m11.7 16 3 3 5.8-6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="text-[17px] leading-none tracking-tight text-ink">
      <span className="font-medium">Assured</span> <span className="font-bold">Saving</span>
    </span>
  );
}

function Flag() {
  return (
    <svg viewBox="0 0 20 14" aria-hidden className="h-2.5 w-4 rounded-[2px]">
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={y} width="20" height="1" fill="#E0314B" />
      ))}
      <rect width="9" height="7" fill="#1F6BFF" />
    </svg>
  );
}

/** The stages that apply to this visitor (usage only with internet, TV setup only with TV). */
export function useVisibleStages(): StageName[] {
  const { s } = useStore();
  return STAGE_NAMES.filter((n) => (n === "usage" ? s.services.includes("internet") : n === "tv" ? s.services.includes("tv") : true));
}

/** Slim navy utility bar: independence note, US-only badge and the language switch. */
function UtilityBar() {
  const { s, dispatch, t } = useStore();
  return (
    <div className="bg-navy text-[#C7D3EA]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
        <p className="flex min-w-0 items-center gap-2 text-xs">
          <Lock aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate">{t("utilityNote")}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span title={t("usOnlyTitle")} className="hidden items-center gap-1.5 text-xs font-semibold text-white sm:inline-flex">
            <Flag />
            {t("usOnly")}
          </span>
          <div role="group" aria-label={t("language")} className="flex rounded-[8px] bg-white/10 p-0.5">
            {(["en", "es"] as const).map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={s.lang === l}
                onClick={() => dispatch({ type: "patch", patch: { lang: l } })}
                className={clsx("min-h-11 min-w-11 rounded-[6px] px-2 text-xs font-semibold transition-colors", s.lang === l ? "bg-white text-navy" : "text-white hover:bg-white/10")}
              >
                {l === "en" ? "ENG" : "ESP"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const { s, dispatch, t } = useStore();
  const visible = useVisibleStages();
  const current = STAGE_NAMES[s.stage];
  const idx = Math.max(0, visible.indexOf(current));
  const pct = ((idx + 1) / visible.length) * 100;
  return (
    <header className="sticky top-0 z-40">
      <UtilityBar />
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <a href="#section-intent" className="flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 rounded-md" aria-label="Assured Saving">
            <Logo />
            <span className="hidden sm:inline">
              <Wordmark />
            </span>
          </a>

          {/* Step tracker (desktop) */}
          <nav aria-label={t("progressLabel")} className="hidden flex-1 justify-center lg:flex">
            <ol className="flex items-center gap-1">
              {visible.map((n, i) => {
                const state = i < idx ? "done" : i === idx ? "now" : "todo";
                return (
                  <li key={n} className="flex items-center gap-1" aria-current={state === "now" ? "step" : undefined}>
                    <span
                      className={clsx(
                        "flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
                        state === "now" ? "bg-primary-soft text-primary" : state === "done" ? "text-ink" : "text-muted",
                      )}
                    >
                      <span
                        aria-hidden
                        className={clsx(
                          "flex size-5 items-center justify-center rounded-full text-[11px]",
                          state === "done" ? "bg-success text-white" : state === "now" ? "bg-primary text-white" : "border border-line-strong text-muted",
                        )}
                      >
                        {state === "done" ? <Check className="size-3" strokeWidth={3.5} /> : i + 1}
                      </span>
                      {t(`stage_${n}`)}
                    </span>
                    {i < visible.length - 1 && <span aria-hidden className={clsx("h-px w-5", i < idx ? "bg-success" : "bg-line-strong")} />}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Compact step label (mobile / tablet) */}
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink lg:hidden" aria-live="polite">
            <span className="text-muted">{t("stepOf", { n: idx + 1, total: visible.length })} · </span>
            {t(`stage_${current}`)}
          </p>

          {s.stage > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              aria-label={t("backAria")}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowLeft aria-hidden className="size-4" />
              <span className="hidden sm:inline">{t("back")}</span>
            </button>
          )}
        </div>
        <div className="h-[3px] w-full bg-line lg:hidden" role="progressbar" aria-label={t("progressLabel")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="h-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </header>
  );
}

export function TrustStrip() {
  const { t } = useStore();
  const items = [
    { icon: ShieldCheck, label: t("trust"), sub: t("trustSub"), c: service.security },
    { icon: Eye, label: t("transparency"), sub: t("transparencySub"), c: service.internet },
    { icon: Zap, label: t("speed"), sub: t("speedSub"), c: service.phone },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <li key={i.label} className="flex items-start gap-3 rounded-md border border-line bg-surface p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px]" style={{ background: i.c.soft, color: i.c.text }}>
            <i.icon aria-hidden className="size-[18px]" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">{i.label}</span>
            <span className="block text-xs text-muted">{i.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Soft azure wash at the top of the page (cheap CSS gradient). */
export function Glows() {
  return <div className="glows" aria-hidden />;
}
