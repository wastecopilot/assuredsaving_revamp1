"use client";
import { useState } from "react";
import { AlertCircle, ArrowRight, Check, Eye, ShieldCheck, Zap } from "lucide-react";
import clsx from "clsx";
import { BUNDLE_PRESETS, SERVICE_ORDER, type ServiceId } from "@/data/catalog";
import { presetFor } from "@/lib/presets";
import { STAGE, useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { SERVICE_ICON } from "../ui";

/**
 * Step 1 (intent) on a solid navy stage. Wording and selection rules follow
 * https://www.assuredsaving.com/ (see lib/selection.ts).
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
    <section id="section-intent" aria-labelledby="hero-h" className="on-dark scroll-mt-28 bg-navy text-on-dark">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[5fr_7fr] lg:gap-14 lg:py-16">
        <div className="rise flex flex-col">
          <p className="text-sm font-semibold text-accent">{t("brand")}</p>
          <h1 id="hero-h" tabIndex={-1} className="mt-3 text-[2.5rem] font-extrabold leading-[1.05] text-white outline-none sm:text-5xl">
            {t("intentTitle1")} <span className="text-accent">{t("intentTitle2")}</span>
          </h1>

          <div className="mt-8 border-l-4 border-accent pl-5">
            <p className="text-lg font-bold text-white">{t("smartMatch")}</p>
            <p className="mt-2 text-base leading-relaxed text-on-dark-muted">{t("heroDescription")}</p>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-white lg:mt-auto lg:pt-10">
            {[
              { icon: ShieldCheck, label: t("trust") },
              { icon: Eye, label: t("transparency") },
              { icon: Zap, label: t("speed") },
            ].map((i) => (
              <li key={i.label} className="inline-flex items-center gap-2">
                <i.icon aria-hidden className="size-4 text-accent" />
                {i.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise rounded-xl bg-navy2 p-5 ring-1 ring-navy-line sm:p-7" style={{ animationDelay: "60ms" }}>
          <h2 className="text-lg font-bold text-white">{t("serviceLabel")}</h2>
          <p className="mt-1 text-sm text-on-dark-muted">{t("multiSelectHint")}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-6">
            {SERVICE_ORDER.map((id, i) => (
              <ServiceTile key={id} id={id} wide={i >= 3} on={s.services.includes(id)} onToggle={() => dispatch({ type: "toggleService", s: id })} />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            {BUNDLE_PRESETS.map((b) => {
              const on = active?.id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => dispatch({ type: "setServices", s: b.services })}
                  className={clsx(
                    "press flex min-h-12 items-center gap-3 rounded-md border px-3 text-left text-sm font-semibold",
                    on ? "border-white bg-white text-ink" : "border-navy-line text-white hover:border-on-dark-muted",
                  )}
                >
                  <span aria-hidden className="flex gap-0.5">
                    {b.services.map((x) => (
                      <span key={x} className="size-2.5 rounded-full" style={{ background: service[x].vivid }} />
                    ))}
                  </span>
                  <span className="flex-1">{t(`preset_${b.id.replaceAll("-", "_")}` as "preset_quad")}</span>
                  {on && <Check aria-hidden className="size-4 text-primary" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>

          {tried && !s.services.length && (
            <p id="pick-err" tabIndex={-1} role="alert" className="mt-5 flex items-center gap-2 rounded-md bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger outline-none">
              <AlertCircle aria-hidden className="size-5 shrink-0" />
              {t("pickServiceHint")}
            </p>
          )}

          <button
            type="button"
            onClick={go}
            className="press mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-white hover:bg-primary-strong sm:w-auto sm:min-w-48"
          >
            {t("continue")}
            <ArrowRight aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

/** A service tile: navy with a coloured icon, or a solid colour block when selected. */
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
        "press relative flex min-h-24 flex-col items-start justify-between rounded-lg border p-3.5 text-left sm:col-span-2",
        wide && "sm:col-span-3",
        id === "security" && "max-sm:col-span-2",
        !on && "border-navy-line bg-navy text-white hover:border-on-dark-muted",
      )}
      style={on ? { background: c.vivid, borderColor: c.vivid, color: c.on } : undefined}
    >
      <span className="flex w-full items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-md" style={on ? { background: "rgb(255 255 255 / 0.22)" } : { background: c.vivid, color: c.on }}>
          <Icon aria-hidden className="size-5" strokeWidth={2} />
        </span>
        <span aria-hidden className={clsx("flex size-5 items-center justify-center rounded-full border", on ? "border-transparent bg-white" : "border-navy-line")} style={on ? { color: c.on === "#FFFFFF" ? c.vivid : c.on } : undefined}>
          {on && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </span>
      <span className="mt-3 text-[15px] font-bold">{t(`svc_${id}`)}</span>
    </button>
  );
}
