"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Building2, FileText, Gauge, PhoneCall, Smartphone, Sparkles, Tag, TrendingDown, Tv, Zap } from "lucide-react";
import clsx from "clsx";
import type { Plan } from "@/data/sample";
import { allInAfter, allInNow, isPriced, money, savings, speedText, techLabel, whyThisPlan, type Label } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { Badge, Button } from "../ui";

export const LABEL_STYLE: Record<Label, { bg: string; fg: string; icon: typeof Tag }> = {
  mostAffordable: { bg: service.security.vivid, fg: service.security.on, icon: Tag },
  bestValue: { bg: service.phone.vivid, fg: service.phone.on, icon: Sparkles },
  fastest: { bg: service.internet.vivid, fg: service.internet.on, icon: Zap },
};

/** Count-up for the headline price (instant with reduced motion). */
function useCountUp(target: number) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? target : Math.round(target * 0.6));
  useEffect(() => {
    if (reduce) return setV(target);
    let raf = 0;
    const start = performance.now();
    const from = Math.round(target * 0.6);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return v;
}

function Price({ label, cents, animate }: { label: string; cents: number; animate?: boolean }) {
  const { t } = useStore();
  const v = useCountUp(cents);
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 flex items-baseline gap-0.5 font-display text-[1.625rem] font-semibold leading-none tracking-tight text-ink tabular min-[420px]:text-[1.75rem] sm:text-[2rem]">
        {money(animate ? v : cents)}
        <span className="text-xs font-bold text-muted sm:text-sm">{t("perMo")}</span>
      </p>
    </div>
  );
}

export function PlanCard({ plan, rank, labels, featured }: { plan: Plan; rank: number; labels: Label[]; featured?: boolean }) {
  const { s, t, dispatch } = useStore();
  const lang = s.lang;
  const speed = speedText(plan, lang);
  const accent = service[plan.services[0]];
  const save = savings(plan, s.billCents);
  const open = (kind: "details" | "callback") => dispatch({ type: "patch", patch: { modal: { kind, planId: plan.id } } });
  const highlight = labels[0] ? LABEL_STYLE[labels[0]].bg : null;

  return (
    <article
      data-plan-card
      aria-labelledby={`p-${plan.id}`}
      className={clsx("flex h-full flex-col overflow-hidden rounded-lg border bg-surface shadow-sm transition-shadow hover:shadow-md", !highlight && "border-line")}
      style={highlight ? { borderColor: highlight } : undefined}
    >
      <div aria-hidden className="flex h-2">
        {plan.services.map((x) => (
          <span key={x} className="flex-1" style={{ background: service[x].vivid }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-ink px-2 font-display text-sm font-semibold text-white" aria-label={`Rank ${rank}`}>
            #{rank}
          </span>
          {labels.map((l) => {
            const st = LABEL_STYLE[l];
            return (
              <Badge key={l} bg={st.bg} fg={st.fg} icon={<st.icon aria-hidden className="size-3.5" strokeWidth={3} />}>
                {t(`label_${l}`)}
              </Badge>
            );
          })}
          <Badge bg={accent.soft} fg={accent.text}>{techLabel(plan, lang, s.addressType)}</Badge>
        </div>

        <p className="mt-4 font-display text-2xl font-semibold text-ink">{plan.provider}</p>
        <h3 id={`p-${plan.id}`} className={clsx("text-base font-semibold text-muted", featured && "min-h-12")}>
          {plan.name}
        </h3>

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
          {speed && <Spec icon={<Gauge aria-hidden className="size-3.5" />} k={t("download")} v={speed} />}
          {plan.channels && <Spec icon={<Tv aria-hidden className="size-3.5" />} k={t("tvLabel")} v={t("channels", { n: plan.channels })} />}
          {plan.lines && <Spec icon={<Smartphone aria-hidden className="size-3.5" />} k={t("mobileLabel")} v={String(plan.lines)} />}
          {plan.services.includes("internet") && <Spec k={t("data")} v={plan.dataCapGB ? t("capGB", { n: plan.dataCapGB.toLocaleString("en-US") }) : t("noCap")} />}
          <Spec icon={<FileText aria-hidden className="size-3.5" />} k={t("contract")} v={plan.contractMonths ? t("monthsContract", { n: plan.contractMonths }) : t("noContract")} />
        </dl>

        {/* Price: the intro price and the price after it are the same size */}
        <div className="mt-5 rounded-lg p-4" style={{ background: isPriced(plan) ? "var(--surface2)" : "var(--phone-soft)" }}>
          {isPriced(plan) ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">{t("allInMonthly")}</p>
              {plan.pricing.promo ? (
                <div className={clsx("mt-2 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2", featured && "lg:grid-cols-1 lg:gap-2")}>
                  <Price label={plan.pricing.promo.months === 1 ? t("firstMonth") : t("firstMonths", { n: plan.pricing.promo.months })} cents={allInNow(plan)} animate />
                  <Price label={t("fromMonth", { n: plan.pricing.promo.months + 1 })} cents={allInAfter(plan)} />
                </div>
              ) : (
                <div className="mt-2">
                  <Price label={t("everyMonth")} cents={allInNow(plan)} animate />
                  <p className="mt-1 text-sm font-semibold text-muted">{t("noPromo")}</p>
                </div>
              )}
              <p className="mt-2 text-xs text-muted">{t("allInNote")}</p>
              {save && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-security-soft px-3 py-1 text-xs font-bold text-security-text">
                  <TrendingDown aria-hidden className="size-3.5" />
                  {t("saveVsBill", { amount: money(save) })}
                </p>
              )}
            </>
          ) : (
            plan.pricing.kind === "quote" && (
              <>
                <p className="font-display text-2xl font-semibold text-ink">{t("callForPricing")}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-phone-text">{t("quoteWhy")}</p>
                <p className="mt-1 text-sm text-ink">{plan.pricing.reason[lang]}</p>
              </>
            )
          )}
        </div>

        <p className="mt-4 text-sm text-ink">
          <span className="font-semibold">{t("whyThisPlan")}: </span>
          {whyThisPlan(plan, lang, s.addressType)}
        </p>
        {s.addressType === "business" && plan.business && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Building2 aria-hidden className="size-4 text-primary" />
            {plan.business.support[lang]}
          </p>
        )}

        <div className={clsx("mt-auto flex gap-2 pt-5", featured ? "flex-col" : "flex-col sm:flex-row sm:justify-end")}>
          <Button variant="secondary" onClick={() => open("details")} className={featured ? "" : "sm:order-1"}>
            {t("details")}
          </Button>
          <Button
            onClick={() => open("callback")}
            className={featured ? "" : "sm:order-2"}
            iconRight={isPriced(plan) ? <ArrowRight aria-hidden className="size-4" strokeWidth={2.6} /> : <PhoneCall aria-hidden className="size-4" />}
          >
            {isPriced(plan) ? t("getPlan") : t("getQuote")}
          </Button>
        </div>
      </div>
    </article>
  );
}

function Spec({ k, v, icon }: { k: string; v: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {icon}
        {k}
      </dt>
      <dd className="text-sm font-bold text-ink">{v}</dd>
    </div>
  );
}
