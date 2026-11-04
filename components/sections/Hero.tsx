"use client";
import { useState } from "react";
import { AlertCircle, ArrowRight, Check, Info, Layers } from "lucide-react";
import clsx from "clsx";
import { BUNDLE_PRESETS, PRICE_DISCLAIMER, SERVICE_ORDER, type ServiceId } from "@/data/catalog";
import { presetFor } from "@/lib/presets";
import { STAGE, useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { Button, SERVICE_ICON } from "../ui";
import { TrustStrip } from "./Shell";

/** Step 1 (intent): same content as the original hero, in a workspace panel. */
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
    <section id="section-intent" aria-labelledby="hero-h" className="scroll-mt-32">
      {/* Intro */}
      <div className="rise max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-sm">
          <span aria-hidden className="size-1.5 rounded-full bg-security" />
          {t("heroEyebrow")}
        </p>
        <h1 id="hero-h" tabIndex={-1} className="mt-4 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink outline-none sm:text-[3.25rem]">
          {t("heroTitleA")} <span className="text-primary">{t("heroTitleB")}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{t("heroLead")}</p>
      </div>

      {/* Selection panel */}
      <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface shadow-md">
        <div className="border-b border-line px-5 py-4 sm:px-8">
          <h2 className="text-base font-semibold text-ink">{t("heroSubtitle")}</h2>
          <p className="mt-0.5 text-sm text-muted">{t("heroInstruction")}</p>
        </div>

        <div className="p-5 sm:p-8">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t("singles")}</h3>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3">
            {SERVICE_ORDER.map((id) => (
              <ServiceRow key={id} id={id} on={s.services.includes(id)} onToggle={() => dispatch({ type: "toggleService", s: id })} />
            ))}
          </div>
          {tried && !s.services.length && (
            <p id="pick-err" tabIndex={-1} role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-medium text-danger outline-none">
              <AlertCircle aria-hidden className="size-5 shrink-0" />
              {t("pickService")}
            </p>
          )}

          <div className="mb-3 mt-8 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t("orBundle")}</h3>
            {active && (
              <span className="pop inline-flex items-center gap-1.5 rounded-[6px] bg-navy px-2 py-1 text-xs font-semibold text-white">
                <Layers aria-hidden className="size-3.5" />
                {t("bundleMode")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            {BUNDLE_PRESETS.map((b) => (
              <BundleOption
                key={b.id}
                services={b.services}
                label={t(`preset_${b.id.replaceAll("-", "_")}` as "preset_quad")}
                on={active?.id === b.id}
                onPick={() => dispatch({ type: "setServices", s: active?.id === b.id ? [] : b.services })}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line bg-surface2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-muted" aria-live="polite">
            {s.services.length > 0 ? t("selected", { n: s.services.length }) : t("pickService")}
          </p>
          <Button size="lg" onClick={go} iconRight={<ArrowRight aria-hidden className="size-4" />} className="w-full sm:w-auto sm:min-w-44">
            {t("continue")}
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <TrustStrip />
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="sr-only">{t("disclaimerTitle")}: </span>
          {PRICE_DISCLAIMER[s.lang]}
        </span>
      </p>
    </section>
  );
}

/** A compact, selectable service row: accent icon, name and description, checkbox. */
function ServiceRow({ id, on, onToggle }: { id: ServiceId; on: boolean; onToggle: () => void }) {
  const { t } = useStore();
  const Icon = SERVICE_ICON[id];
  const c = service[id];
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={clsx(
        "tile-pop flex min-h-[76px] w-full items-center gap-3.5 rounded-md border p-3.5 text-left transition-[border-color,box-shadow,background-color]",
        on ? "bg-surface shadow-sm" : "border-line-strong bg-surface hover:border-[#9fb0c8] hover:shadow-sm",
      )}
      style={on ? { borderColor: c.vivid, boxShadow: `0 0 0 3px ${c.soft}` } : undefined}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] transition-colors" style={{ background: on ? c.vivid : c.soft, color: on ? c.on : c.text }}>
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{t(`svc_${id}`)}</span>
        <span className="block text-xs text-muted">{t(`svcDesc_${id}`)}</span>
      </span>
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors"
        style={on ? { background: c.vivid, borderColor: c.vivid, color: c.on } : { borderColor: "var(--line-strong)" }}
      >
        {on && <Check className="size-3.5" strokeWidth={3.5} />}
      </span>
    </button>
  );
}

/** A bundle preset: stacked service dots, label, radio-style indicator. */
function BundleOption({ services, label, on, onPick }: { services: ServiceId[]; label: string; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={clsx(
        "tile-pop flex min-h-14 w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-[border-color,box-shadow,background-color]",
        on ? "border-primary bg-primary-soft/60 shadow-sm" : "border-line-strong bg-surface hover:border-[#9fb0c8]",
      )}
    >
      <span aria-hidden className="flex shrink-0 -space-x-1.5">
        {services.map((x) => {
          const Icon = SERVICE_ICON[x];
          return (
            <span key={x} className="flex size-7 items-center justify-center rounded-full ring-2 ring-surface" style={{ background: service[x].vivid, color: service[x].on }}>
              <Icon className="size-3.5" />
            </span>
          );
        })}
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{label}</span>
      <span aria-hidden className={clsx("flex size-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-primary bg-primary text-white" : "border-line-strong")}>
        {on && <Check className="size-3" strokeWidth={4} />}
      </span>
    </button>
  );
}
