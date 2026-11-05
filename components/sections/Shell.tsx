"use client";
import { ArrowLeft, Building2, Home, MapPin, PhoneCall, RotateCcw, User } from "lucide-react";
import clsx from "clsx";
import { FOOTER_LINKS, SERVICE_ORDER, siteUrl } from "@/data/catalog";
import type { Key } from "@/lib/i18n";
import { STAGE_NAMES, useStore, type StageName } from "@/lib/store";
import { service } from "@/lib/tokens";
import { cleanText, nameOk } from "@/lib/schedule";
import { SERVICE_ICON } from "../ui";

/** Brand mark: a solid teal tile with a white shield and check. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="7" fill="#00A6A6" />
      <path d="M16 6.5 8.5 9.4v5.4c0 4.8 3.2 8.1 7.5 9.4 4.3-1.3 7.5-4.6 7.5-9.4V9.4L16 6.5Z" fill="#fff" />
      <path d="m12.4 15.6 2.6 2.6 4.8-5" fill="none" stroke="#00A6A6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The stages that apply to this visitor (usage only with internet, TV setup only with TV). */
export function useVisibleStages(): StageName[] {
  const { s } = useStore();
  return STAGE_NAMES.filter((n) => (n === "usage" ? s.services.includes("internet") : n === "tv" ? s.services.includes("tv") : true));
}

/**
 * The step name shown at the top, as on the official site (no step numbers):
 * Intent, then Name & Address (also covers usage), then Details for TV, scan and results.
 */
export const STAGE_LABEL: Record<StageName, Key> = {
  intent: "stage_intent",
  address: "stage_address",
  usage: "stage_address",
  tv: "stage_details",
  scan: "stage_details",
  results: "stage_details",
};

function LangSwitch() {
  const { s, dispatch } = useStore();
  return (
    <div className="flex items-center text-sm font-semibold">
      {(["en", "es"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i === 1 && (
            <span aria-hidden className="px-0.5 text-line-strong">
              |
            </span>
          )}
          <button
            type="button"
            lang={l}
            aria-pressed={s.lang === l}
            onClick={() => dispatch({ type: "patch", patch: { lang: l } })}
            className={clsx("min-h-11 min-w-11 rounded-md px-2 transition-colors", s.lang === l ? "text-primary" : "text-muted hover:text-ink")}
          >
            {l === "en" ? "ENG" : "ESP"}
          </button>
        </span>
      ))}
    </div>
  );
}

export function Header() {
  const { s, dispatch, t } = useStore();
  const visible = useVisibleStages();
  const current = STAGE_NAMES[s.stage];
  const idx = Math.max(0, visible.indexOf(current));
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {s.stage > 0 ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "back" })}
            className="press -ml-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold text-ink hover:bg-surface2"
          >
            <ArrowLeft aria-hidden className="size-4" />
            <span className="max-sm:sr-only">{t("back")}</span>
          </button>
        ) : null}
        <a href="#section-intent" className="flex min-h-11 items-center gap-2.5 rounded-md">
          <Logo />
          <span className={clsx("text-[17px] font-bold tracking-tight text-ink", s.stage > 0 && "max-sm:sr-only")}>{t("brand")}</span>
        </a>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <p className="hidden text-xs font-semibold uppercase tracking-wider text-muted sm:block" aria-live="polite">
            {t(STAGE_LABEL[current])}
          </p>
          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
          <LangSwitch />
          <span className="hidden rounded-sm border border-line px-2 py-1 text-xs font-semibold text-muted sm:inline-block">{t("usOnly")}</span>
        </div>
      </div>
      {/* Segmented progress: one segment per step that applies */}
      <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 sm:px-6" aria-hidden>
        {visible.map((n, i) => (
          <span key={n} className={clsx("h-1 flex-1 rounded-full transition-colors", i <= idx ? "bg-primary" : "bg-line")} />
        ))}
      </div>
      <ContextBar />
    </header>
  );
}

/** Once the visitor has told us something: name, address and type, services. */
function ContextBar() {
  const { s, t, dispatch } = useStore();
  const chosen = SERVICE_ORDER.filter((x) => s.services.includes(x));
  if (s.stage < 1 || !chosen.length) return null;
  const first = cleanText(s.name).split(" ")[0];
  const item = "inline-flex shrink-0 items-center gap-1.5 text-sm text-ink";
  return (
    <div className="border-t border-line bg-surface2">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-1.5 sm:px-6">
        {/* relative: screen-reader-only labels are absolutely positioned and must be clipped here too */}
        <ul className="relative flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
          {nameOk(s.name) && (
            <li className="inline-flex min-w-0 shrink items-center gap-1.5 text-sm text-ink max-sm:hidden">
              <User aria-hidden className="size-4 text-muted" />
              <span className="max-w-[9rem] truncate [overflow-wrap:normal]">{first}</span>
            </li>
          )}
          {s.address && (
            <li className="inline-flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-ink">
              <MapPin aria-hidden className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 max-w-[16rem] truncate [overflow-wrap:normal]">{s.address.line1}</span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-surface px-1.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-line">
                {s.address.type === "business" ? <Building2 aria-hidden className="size-3" /> : <Home aria-hidden className="size-3" />}
                <span className="max-lg:sr-only">{t(s.address.type === "business" ? "businessAddress" : "homeAddress")}</span>
              </span>
            </li>
          )}
          <li className={item}>
            <span aria-hidden className="flex gap-0.5">
              {chosen.map((x) => {
                const Icon = SERVICE_ICON[x];
                return (
                  <span key={x} className="flex size-5 items-center justify-center rounded-sm" style={{ background: service[x].vivid, color: service[x].on }}>
                    <Icon className="size-3" strokeWidth={2.5} />
                  </span>
                );
              })}
            </span>
            <span className="max-md:sr-only">{chosen.map((x) => t(`svc_${x}`)).join(" + ")}</span>
          </li>
        </ul>
        <button
          type="button"
          onClick={() => dispatch({ type: "patch", patch: { modal: { kind: "callback", planId: null } } })}
          className="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-primary hover:bg-primary-soft md:inline-flex"
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
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold text-muted hover:bg-surface hover:text-ink"
        >
          <RotateCcw aria-hidden className="size-4" />
          <span className="max-sm:sr-only">{t("startOver")}</span>
        </button>
      </div>
    </div>
  );
}

export function Footer() {
  const { s, t } = useStore();
  return (
    <footer className="on-dark bg-navy text-on-dark">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-base font-bold tracking-tight">{t("brand")}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-dark-muted">{t("disclaimer")}</p>
          </div>
          <nav aria-label={t("footerNav")} className="grid gap-8 sm:grid-cols-3">
            {FOOTER_LINKS.map((g) => (
              <div key={g.group}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted">{t(g.group)}</h2>
                <ul className="mt-3 space-y-1">
                  {g.links.map((l) => (
                    <li key={l.slug}>
                      <a href={siteUrl(l.slug, s.lang)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-on-dark hover:underline">
                        {t(l.key)}
                        <span className="sr-only"> {t("newTab")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="mt-10 border-t border-navy-line pt-6 text-sm text-on-dark-muted">© {new Date().getFullYear()} Assured Saving</p>
      </div>
    </footer>
  );
}
