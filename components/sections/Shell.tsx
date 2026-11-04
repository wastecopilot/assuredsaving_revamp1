"use client";
import { ArrowLeft, Building2, Check, Eye, Home, Layers, MapPin, PhoneCall, RotateCcw, ShieldCheck, User, Zap } from "lucide-react";
import clsx from "clsx";
import { LEGAL, SERVICE_ORDER } from "@/data/catalog";
import { presetFor } from "@/lib/presets";
import { STAGE_NAMES, useStore, type StageName } from "@/lib/store";
import { service } from "@/lib/tokens";
import { SERVICE_ICON } from "../ui";

/** Brand mark: a gradient tile with a shield, a check and a small spark. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="lg-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E0167A" />
          <stop offset="0.55" stopColor="#7B2FE0" />
          <stop offset="1" stopColor="#12C8E8" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="11" fill="url(#lg-mark)" />
      <path d="M18 7.5 9.5 10.8v6c0 5.3 3.6 9 8.5 10.4 4.9-1.4 8.5-5.1 8.5-10.4v-6L18 7.5Z" fill="#fff" fillOpacity=".18" stroke="#fff" strokeWidth="1.6" />
      <path d="m13.8 17.6 3 3 5.6-5.8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28.5 4.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#fff" />
    </svg>
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

function LangSwitch() {
  const { s, dispatch, t } = useStore();
  return (
    <div role="group" aria-label={t("language")} className="glass flex rounded-full p-1">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={s.lang === l}
          onClick={() => dispatch({ type: "patch", patch: { lang: l } })}
          className={clsx("min-h-11 min-w-11 rounded-full px-2.5 text-xs font-bold tracking-wide transition-colors", s.lang === l ? "bg-white text-navy" : "text-white hover:bg-white/10")}
        >
          {l === "en" ? "ENG" : "ESP"}
        </button>
      ))}
    </div>
  );
}

/** Midnight app bar: brand, step pills (desktop) or "Step x of y" (phones), language, back. */
export function Header() {
  const { s, dispatch, t } = useStore();
  const visible = useVisibleStages();
  const current = STAGE_NAMES[s.stage];
  const idx = Math.max(0, visible.indexOf(current));
  const pct = ((idx + 1) / visible.length) * 100;
  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <a href="#section-intent" className="flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 rounded-xl" aria-label="Assured Saving">
            <Logo />
            <span className="hidden text-[17px] leading-none tracking-tight sm:inline">
              <span className="font-medium text-on-dark-muted">Assured</span> <span className="font-extrabold">Saving</span>
            </span>
          </a>

          <nav aria-label={t("progressLabel")} className="hidden flex-1 justify-center lg:flex">
            <ol className="glass flex items-center gap-1 rounded-full p-1">
              {visible.map((n, i) => {
                const state = i < idx ? "done" : i === idx ? "now" : "todo";
                return (
                  <li key={n} aria-current={state === "now" ? "step" : undefined}>
                    <span
                      className={clsx(
                        "flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-xs font-bold transition-colors",
                        state === "now" ? "bg-cta text-white shadow-glow" : state === "done" ? "text-white" : "text-on-dark-muted",
                      )}
                    >
                      <span
                        aria-hidden
                        className={clsx(
                          "flex size-6 items-center justify-center rounded-full text-[11px]",
                          state === "done" ? "bg-security text-ink" : state === "now" ? "bg-white text-primary" : "bg-white/10 text-white",
                        )}
                      >
                        {state === "done" ? <Check className="size-3.5" strokeWidth={3.5} /> : i + 1}
                      </span>
                      {t(`stage_${n}`)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>

          <p className="min-w-0 flex-1 truncate text-sm font-semibold lg:hidden" aria-live="polite">
            <span className="text-on-dark-muted">
              <span className="sm:hidden" aria-hidden>
                {idx + 1}/{visible.length} ·{" "}
              </span>
              <span className="max-sm:sr-only">{t("stepOf", { n: idx + 1, total: visible.length })} · </span>
            </span>
            {t(`stage_${current}`)}
          </p>

          <span title={t("usOnlyTitle")} className="hidden items-center gap-1.5 text-xs font-bold text-white xl:inline-flex">
            <Flag />
            {t("usOnly")}
          </span>
          <LangSwitch />
          {s.stage > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              aria-label={t("backAria")}
              className="glass inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
            >
              <ArrowLeft aria-hidden className="size-4" />
              <span className="hidden sm:inline">{t("back")}</span>
            </button>
          )}
        </div>
        <div className="h-[3px] w-full bg-white/10 lg:hidden" role="progressbar" aria-label={t("progressLabel")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="bg-cta h-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ContextBar />
    </header>
  );
}

/**
 * Context chips under the app bar once the visitor has told us something:
 * name, address with its detected type, services (bundle or single), and the
 * plan count. Plus "Get a call from Aria" and "Start over".
 */
function ContextBar() {
  const { s, t, dispatch } = useStore();
  const chosen = SERVICE_ORDER.filter((x) => s.services.includes(x));
  if (s.stage < 1 || !chosen.length) return null;
  const bundle = presetFor(s.services);
  const first = s.name.trim().split(/\s+/)[0];
  const chip = "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-ink";
  return (
    <div className="border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        <ul tabIndex={0} aria-label={t("ctxLabel")} className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto rounded-full [scrollbar-width:none]">
          {s.name.trim().length >= 2 && (
            <li className={chip}>
              <User aria-hidden className="size-3.5 text-primary" />
              {first}
            </li>
          )}
          {s.address && (
            <li className={clsx(chip, "max-w-[15rem] sm:max-w-[22rem]")}>
              <MapPin aria-hidden className="size-3.5 shrink-0 text-tv-text" />
              <span className="truncate">
                {s.address.line1}
                <span className="max-sm:hidden">
                  , {s.address.city}, {s.address.state}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                {s.address.type === "business" ? <Building2 aria-hidden className="size-3" /> : <Home aria-hidden className="size-3" />}
                <span className="max-sm:sr-only">{t(s.address.type === "business" ? "businessTag" : "residentialTag")}</span>
              </span>
            </li>
          )}
          <li className={chip}>
            <span aria-hidden className="flex -space-x-1">
              {chosen.map((x) => {
                const Icon = SERVICE_ICON[x];
                return (
                  <span key={x} className="flex size-5 items-center justify-center rounded-full ring-2 ring-surface" style={{ background: service[x].vivid, color: service[x].on }}>
                    <Icon className="size-3" strokeWidth={2.6} />
                  </span>
                );
              })}
            </span>
            {bundle ? (
              <>
                <Layers aria-hidden className="size-3.5 text-primary" />
                {t("ctxBundle")}
              </>
            ) : (
              chosen.map((x) => t(`svc_${x}`)).join(" + ")
            )}
          </li>
          {s.scanDone && s.resultsSummary && (
            <li className={clsx(chip, "border-transparent bg-security-soft text-security-text")}>
              <Check aria-hidden className="size-3.5" strokeWidth={3} />
              {t("plansCount", { n: s.resultsSummary.count })}
            </li>
          )}
        </ul>
        <button
          type="button"
          onClick={() => dispatch({ type: "patch", patch: { modal: { kind: "callback", planId: null } } })}
          className="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-primary hover:bg-primary-soft md:inline-flex"
        >
          <PhoneCall aria-hidden className="size-4" />
          {t("scheduleCallback")}
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "reset" });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold text-muted hover:bg-surface2 hover:text-ink"
        >
          <RotateCcw aria-hidden className="size-4" />
          <span className="hidden sm:inline">{t("startOver")}</span>
          <span className="sr-only sm:hidden">{t("startOver")}</span>
        </button>
      </div>
    </div>
  );
}

/** Trust · Transparency · Speed, as glowing pills on the midnight stage. */
export function TrustRow() {
  const { t } = useStore();
  const items = [
    { icon: ShieldCheck, label: t("trust"), sub: t("trustSub"), c: service.security.vivid },
    { icon: Eye, label: t("transparency"), sub: t("transparencySub"), c: service.internet.vivid },
    { icon: Zap, label: t("speed"), sub: t("speedSub"), c: service.mobile.vivid },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <li key={i.label} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: i.c, color: "#0E1236" }}>
            <i.icon aria-hidden className="size-[18px]" strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-white">{i.label}</span>
            <span className="block text-xs text-on-dark-muted">{i.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const { t } = useStore();
  return (
    <footer className="stage mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="text-base tracking-tight">
                <span className="font-medium text-on-dark-muted">Assured</span> <span className="font-extrabold">Saving</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-on-dark-muted">{t("footerNote")}</p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-2">
            {[
              [t("cbTerms"), LEGAL.terms],
              [t("cbPrivacy"), LEGAL.privacy],
              [t("cbSmsTerms"), LEGAL.sms],
            ].map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-white hover:bg-white/10">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-white/10 pt-5 text-xs text-on-dark-muted">
          © {new Date().getFullYear()} Assured Saving · {t("previewTag")}
        </p>
      </div>
    </footer>
  );
}
