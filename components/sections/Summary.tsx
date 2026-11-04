"use client";
import { Building2, Home, MapPin, MonitorSmartphone, PhoneCall, RotateCcw, Sparkles, Tv, User, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { DEVICES, SERVICE_ORDER, USAGE } from "@/data/catalog";
import { STAGE, useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { SERVICE_ICON } from "../ui";
import { Logo } from "./Shell";

function Row({ icon, label, children, empty }: { icon: ReactNode; label: string; children: ReactNode; empty?: boolean }) {
  return (
    <div className="py-3">
      <dt className="flex items-center gap-2 text-xs font-medium text-muted">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface2">{icon}</span>
        {label}
      </dt>
      <dd className={empty ? "-mt-1 min-w-0 pl-10 text-sm text-muted" : "-mt-1 min-w-0 pl-10 text-sm font-semibold text-ink"}>{children}</dd>
    </div>
  );
}

/** "Your quote": a live summary that fills in as the visitor moves through the steps. */
export function SummaryPanel({ results }: { results?: { count: number; fromCents: number | null } }) {
  const { s, t, dispatch } = useStore();
  const chosen = SERVICE_ORDER.filter((x) => s.services.includes(x));
  const usage = USAGE[s.addressType].filter((u) => s.usage.includes(u.id)).map((u) => u.title[s.lang]);
  const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
  return (
    <section aria-labelledby="quote-h" className="overflow-hidden rounded-lg border border-line bg-surface shadow-md">
      <div className="flex items-center justify-between gap-3 bg-navy px-5 py-4 text-white">
        <div>
          <h2 id="quote-h" className="text-base font-semibold">
            {t("yourQuote")}
          </h2>
          <p className="text-xs text-[#C7D3EA]">{t("quoteSub")}</p>
        </div>
        <Logo size={28} />
      </div>
      <dl className="divide-y divide-line px-5">
        <Row icon={<Wifi aria-hidden className="size-4" />} label={t("sumServices")} empty={!chosen.length}>
          {chosen.length ? (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {chosen.map((x) => {
                const Icon = SERVICE_ICON[x];
                return (
                  <span key={x} className="inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-xs font-semibold" style={{ background: service[x].soft, color: service[x].text }}>
                    <Icon aria-hidden className="size-3.5" />
                    {t(`svc_${x}`)}
                  </span>
                );
              })}
            </span>
          ) : (
            t("notSet")
          )}
        </Row>
        <Row icon={<User aria-hidden className="size-4" />} label={t("sumName")} empty={s.name.trim().length < 2}>
          {s.name.trim().length >= 2 ? s.name.trim() : t("notSet")}
        </Row>
        <Row icon={<MapPin aria-hidden className="size-4" />} label={t("sumAddress")} empty={!s.address}>
          {s.address ? (
            <>
              {s.address.line1}
              <span className="block font-normal text-muted">
                {s.address.city}, {s.address.state} {s.address.zip}
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-[6px] bg-surface2 px-2 py-0.5 text-xs font-semibold text-ink">
                {s.address.type === "business" ? <Building2 aria-hidden className="size-3.5" /> : <Home aria-hidden className="size-3.5" />}
                {t(s.address.type === "business" ? "businessTag" : "residentialTag")}
              </span>
            </>
          ) : (
            t("notSet")
          )}
        </Row>
        {s.services.includes("internet") && (
          <Row icon={<MonitorSmartphone aria-hidden className="size-4" />} label={t("sumUsage")} empty={!usage.length && s.stage < STAGE.usage}>
            {usage.length ? usage.join(", ") : s.stage < STAGE.usage ? t("notSet") : null}
            {s.stage >= STAGE.usage && <span className="block font-normal text-muted">{t("sumDevices", { n: s.devices >= DEVICES.max ? "100+" : s.devices })}</span>}
          </Row>
        )}
        {s.services.includes("tv") && (
          <Row icon={<Tv aria-hidden className="size-4" />} label={t("sumTvs")} empty={s.stage < STAGE.tv}>
            {s.stage < STAGE.tv ? t("notSet") : t(s.tvs === 1 ? "sumTvsValue" : "sumTvsValuePlural", { n: s.tvs, s: s.smartTvs })}
          </Row>
        )}
        {results && (
          <Row icon={<Sparkles aria-hidden className="size-4" />} label={t("sumResults")}>
            {results.fromCents !== null ? t("sumResultsValue", { n: results.count, price: money(results.fromCents) }) : `${results.count}`}
          </Row>
        )}
      </dl>
      <div className="space-y-2 border-t border-line bg-surface2 px-5 py-4">
        <p className="text-xs font-medium text-muted">{t("needHelp")}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "patch", patch: { modal: { kind: "callback", planId: null } } })}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-surface text-sm font-semibold text-ink shadow-sm transition-colors hover:border-primary hover:text-primary"
        >
          <PhoneCall aria-hidden className="size-4" />
          {t("scheduleCallback")}
        </button>
        {(s.services.length > 0 || s.address) && (
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "reset" });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <RotateCcw aria-hidden className="size-4" />
            {t("startOver")}
          </button>
        )}
      </div>
    </section>
  );
}
