"use client";
import { useState } from "react";
import { AlertCircle, ArrowRight, Check, Info, Layers, ShieldCheck, Sparkles } from "lucide-react";
import clsx from "clsx";
import { BUNDLE_PRESETS, PRICE_DISCLAIMER, SERVICE_ORDER, type ServiceId } from "@/data/catalog";
import { presetFor } from "@/lib/presets";
import { STAGE, useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { SERVICE_ICON } from "../ui";
import { TrustRow } from "./Shell";

/**
 * Step 1 (intent) on the midnight stage: the promise on the left, the service
 * picker on the right. Services are solid colour blocks; bundles are glass pills.
 */
export function Hero() {
  const { s, dispatch, t, goNext } = useStore();
  const [tried, setTried] = useState(false);
  const active = presetFor(s.services);

  const go = () => {
    if (!s.services.length) {
      setTried(true);
      window.setTimeout(() => document.getElementById("pick-err")?.focus(), 20);
      return;
    }
    setTried(false);
    goNext(STAGE.intent);
  };

  return (
    <section id="section-intent" aria-labelledby="hero-h" className="stage scroll-mt-36 overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:pb-20 lg:pt-16">
        {/* Promise */}
        <div className="rise lg:pt-6">
          <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-white">
            <Sparkles aria-hidden className="size-3.5 text-neon" />
            {t("heroKicker")}
          </p>
          <h1 id="hero-h" tabIndex={-1} className="mt-5 text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] text-white outline-none sm:text-[3.75rem]">
            {t("heroTitleA")}
            <br />
            <span className="text-neon">{t("heroTitleB")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-on-dark-muted sm:text-lg">{t("heroLead")}</p>

          <div className="mt-7 flex gap-4 rounded-2xl border border-white/15 bg-white p-5 text-ink shadow-overlay">
            <span className="bg-cta flex size-11 shrink-0 items-center justify-center rounded-xl text-white">
              <ShieldCheck aria-hidden className="size-6" />
            </span>
            <div>
              <p className="text-base font-extrabold tracking-tight">{t("unbiasedTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("unbiasedBody")}</p>
            </div>
          </div>

          <div className="mt-6 hidden lg:block">
            <TrustRowStack />
          </div>
        </div>

        {/* Picker */}
        <div className="glass rise rounded-[28px] p-4 sm:p-6" style={{ animationDelay: "80ms" }}>
          <div className="flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <h2 className="text-lg font-extrabold text-white sm:text-xl">{t("heroSubtitle")}</h2>
              <p className="mt-0.5 text-sm text-on-dark-muted">{t("heroInstruction")}</p>
            </div>
          </div>

          <h3 className="mb-3 mt-5 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-dark-muted">{t("singles")}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            {SERVICE_ORDER.map((id, i) => (
              <ServiceTile key={id} wide={i >= 3} id={id} on={s.services.includes(id)} onToggle={() => dispatch({ type: "toggleService", s: id })} />
            ))}
          </div>
          {tried && !s.services.length && (
            <p id="pick-err" tabIndex={-1} role="alert" className="mt-4 flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-bold text-danger outline-none">
              <AlertCircle aria-hidden className="size-5 shrink-0" />
              {t("pickService")}
            </p>
          )}

          <div className="mb-3 mt-6 flex items-center justify-between gap-2 px-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-dark-muted">{t("orBundle")}</h3>
            {active && (
              <span className="pop inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-primary">
                <Layers aria-hidden className="size-3.5" />
                {t("bundleMode")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2">
            {BUNDLE_PRESETS.map((b) => (
              <BundlePill
                key={b.id}
                services={b.services}
                label={t(`preset_${b.id.replaceAll("-", "_")}` as "preset_quad")}
                on={active?.id === b.id}
                onPick={() => dispatch({ type: "setServices", s: active?.id === b.id ? [] : b.services })}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="px-1 text-sm font-semibold text-on-dark-muted" aria-live="polite">
              {s.services.length > 0 ? t("selected", { n: s.services.length }) : t("pickService")}
            </p>
            <button
              type="button"
              onClick={go}
              className="bg-cta inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-8 text-base font-extrabold text-white shadow-glow transition-transform hover:brightness-110 active:scale-[0.98] sm:w-auto"
            >
              {t("continue")}
              <ArrowRight aria-hidden className="size-5" strokeWidth={2.6} />
            </button>
          </div>
        </div>

        <div className="lg:hidden">
          <TrustRow />
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-on-dark-muted lg:col-span-2">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="sr-only">{t("disclaimerTitle")}: </span>
            {PRICE_DISCLAIMER[s.lang]}
          </span>
        </p>
      </div>
    </section>
  );
}

/** Desktop: the three trust pills stacked in the left column. */
function TrustRowStack() {
  return (
    <div className="[&_ul]:grid-cols-1 [&_ul]:sm:grid-cols-1">
      <TrustRow />
    </div>
  );
}

/** A solid colour block for one service. A check badge and a white ring mark the selection. */
function ServiceTile({ id, on, onToggle, wide }: { id: ServiceId; on: boolean; onToggle: () => void; wide?: boolean }) {
  const { t } = useStore();
  const Icon = SERVICE_ICON[id];
  const c = service[id];
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={clsx(
        "tile-pop group relative flex min-h-[124px] flex-col justify-between overflow-hidden rounded-[20px] p-4 text-left sm:col-span-2",
        wide && "sm:col-span-3",
        id === "phone" && "max-sm:col-span-2",
        on ? "ring-4 ring-white shadow-overlay" : "ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-overlay",
      )}
      style={{ background: c.vivid, color: c.on }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/20" />
      <span className="relative flex w-full items-start justify-between">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white/25">
          <Icon aria-hidden className="size-6" strokeWidth={2.4} />
        </span>
        <span
          aria-hidden
          className={clsx("relative flex size-7 items-center justify-center rounded-full border-2 transition-colors", on ? "border-white bg-white" : "bg-white/15")}
          style={on ? { color: c.on === "#FFFFFF" ? c.vivid : c.on } : { borderColor: "currentColor" }}
        >
          {on && <Check className="size-4" strokeWidth={3.5} />}
        </span>
      </span>
      <span className="relative mt-3 block">
        <span className="block text-[15px] font-extrabold uppercase tracking-wide">{t(`svc_${id}`)}</span>
        <span className="block text-xs font-semibold">{t(`svcDesc_${id}`)}</span>
      </span>
    </button>
  );
}

/** A bundle preset as a glass pill with stacked service dots and a radio-style indicator. */
function BundlePill({ services, label, on, onPick }: { services: ServiceId[]; label: string; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={clsx(
        "tile-pop flex min-h-14 w-full items-center gap-3 rounded-full py-2.5 pl-2.5 pr-4 text-left transition-colors",
        on ? "bg-white text-ink shadow-overlay" : "glass text-white hover:bg-white/12",
      )}
    >
      <span aria-hidden className="flex shrink-0 -space-x-2">
        {services.map((x) => {
          const Icon = SERVICE_ICON[x];
          return (
            <span key={x} className={clsx("flex size-8 items-center justify-center rounded-full ring-2", on ? "ring-white" : "ring-navy")} style={{ background: service[x].vivid, color: service[x].on }}>
              <Icon className="size-4" strokeWidth={2.4} />
            </span>
          );
        })}
      </span>
      <span className="min-w-0 flex-1 text-sm font-extrabold">{label}</span>
      <span aria-hidden className={clsx("flex size-6 shrink-0 items-center justify-center rounded-full border-2", on ? "bg-cta border-transparent text-white" : "border-white/50")}>
        {on && <Check className="size-3.5" strokeWidth={4} />}
      </span>
    </button>
  );
}
