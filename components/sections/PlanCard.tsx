"use client";
import { ArrowRight, Check, PhoneCall, Sparkles, Tag, Zap } from "lucide-react";
import clsx from "clsx";
import type { Plan } from "@/data/sample";
import { allInAfter, allInNow, isPriced, money, planReasons, speedText, techLabel, type Label } from "@/lib/plans";
import type { Key } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { service } from "@/lib/tokens";

/** Earned labels: flat colour, official wording. */
export const LABEL_STYLE: Record<Label, { bg: string; fg: string; icon: typeof Tag; key: Key }> = {
  mostAffordable: { bg: service.security.vivid, fg: service.security.on, icon: Tag, key: "label_mostAffordable" },
  bestValue: { bg: "#0B5FFF", fg: "#FFFFFF", icon: Sparkles, key: "label_bestValue" },
  fastest: { bg: service.internet.vivid, fg: service.internet.on, icon: Zap, key: "label_fastest" },
};

export function PlanCard({ plan, rank, labels, top, featured }: { plan: Plan; rank: number; labels: Label[]; top?: Plan; featured?: boolean }) {
  const { s, t, dispatch } = useStore();
  const lang = s.lang;
  const speed = speedText(plan, lang);
  const open = (kind: "details" | "callback") => dispatch({ type: "patch", patch: { modal: { kind, planId: plan.id } } });
  const reasons = planReasons(plan, top, lang);
  const biz = s.addressType === "business";
  const promo = isPriced(plan) && plan.pricing.promo;

  return (
    <article data-plan-card aria-labelledby={`p-${plan.id}`} className={clsx("flex h-full flex-col rounded-xl border bg-surface", featured ? "border-primary shadow-lg ring-1 ring-primary" : "border-line shadow-sm")}>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted tabular">#{rank}</span>
          <span className="text-sm font-semibold text-ink">{t(featured ? "ourTopPick" : "alsoGreat")}</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {labels.map((l) => {
              const st = LABEL_STYLE[l];
              return (
                <span key={l} className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold" style={{ background: st.bg, color: st.fg }}>
                  <st.icon aria-hidden className="size-3.5" />
                  {t(st.key)}
                </span>
              );
            })}
          </span>
        </div>

        <p className="mt-4 text-xl font-bold text-ink">{plan.provider}</p>
        <h3 id={`p-${plan.id}`} className={clsx("text-sm text-muted", featured && "min-h-10")}>
          {plan.name}
        </h3>

        <div className="mt-5 border-y border-line py-4">
          {isPriced(plan) ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("monthly")}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="text-[2rem] font-extrabold leading-none text-ink tabular">{money(allInNow(plan))}</span>
                <span className="text-sm font-semibold text-muted">{t("perMo")}</span>
              </p>
              {promo && (
                <p className="mt-1 text-sm text-muted tabular">
                  {t("reg")} {money(allInAfter(plan))}
                  {t("perMo")}
                </p>
              )}
            </>
          ) : (
            <p className="text-xl font-bold text-ink">{t(biz ? "callForPricingBusinessCta" : "callForPricing")}</p>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-muted">{t("technology")}</dt>
            <dd className="font-semibold text-ink">{techLabel(plan, lang)}</dd>
          </div>
          {speed && (
            <div>
              <dt className="text-muted">{t("downloadSpeed")}</dt>
              <dd className="font-semibold text-ink tabular">{speed}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">{t("contractTerm")}</dt>
            <dd className="font-semibold text-ink">{plan.contractMonths ? t("contractMonths", { n: plan.contractMonths }) : t("noContract")}</dd>
          </div>
        </dl>

        {reasons.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="font-semibold text-ink">{t("whyThisPlan")}</p>
            <ul className="mt-1.5 space-y-1">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2 text-muted">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={clsx("mt-auto flex gap-2 pt-5", featured ? "flex-col" : "flex-col sm:flex-row")}>
          <button
            type="button"
            onClick={() => open("callback")}
            className="press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong"
          >
            {isPriced(plan) ? t("getStarted") : t("callForPricingCta")}
            {isPriced(plan) ? <ArrowRight aria-hidden className="size-4" /> : <PhoneCall aria-hidden className="size-4" />}
            <span className="sr-only">
              : {plan.provider} {plan.name}
            </span>
          </button>
          <button
            type="button"
            onClick={() => open("details")}
            className="press inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-surface2"
          >
            {t("showDetails")}
            <span className="sr-only">
              : {plan.provider} {plan.name}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
