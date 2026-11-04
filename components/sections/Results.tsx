"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Check, ChevronDown, Info, ListChecks, PhoneCall, Tv } from "lucide-react";
import clsx from "clsx";
import { DIRECTV_TIERS, PRICE_DISCLAIMER } from "@/data/sample";
import { allInNow, isPriced, labelsFor, money, resultsFor } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { Button, Chip, EmptyState, Input } from "../ui";
import { PlanCard } from "./PlanCard";
import { Section } from "./Section";
import { PlanTable } from "./PlanTable";

export function ResultsSection() {
  const { s, dispatch, t } = useStore();
  const reduce = useReducedMotion();
  const { plans, covered, missing } = useMemo(() => resultsFor(s.services), [s.services]);
  const labels = useMemo(() => labelsFor(plans), [plans]);
  const [showAll, setShowAll] = useState(false);
  const [bill, setBill] = useState(s.billCents ? String(s.billCents / 100) : "");
  const providers = [...new Set(plans.map((p) => p.provider))];
  const filtered = s.carrier === "ALL" ? null : plans.filter((p) => p.provider === s.carrier);
  const pricedCount = plans.filter(isPriced).length;
  const topCount = Math.min(3, pricedCount);
  const top = plans.slice(0, topCount);
  const rest = plans.slice(topCount);
  const rankOf = (id: string) => plans.findIndex((p) => p.id === id) + 1;
  const name = (x: string) => t(`svc_${x}` as "svc_tv");
  const category =
    covered.length > 1 ? t("cat_bundle", { services: covered.map(name).join(" + ") }) : covered[0] === "internet" ? t("cat_internet") : covered[0] === "tv" ? t("cat_tv") : covered[0] ? t("cat_single", { service: name(covered[0]) }) : "";
  const first = plans.find(isPriced);
  const fromCents = first ? allInNow(first) : null;
  useEffect(() => {
    dispatch({ type: "patch", patch: { resultsSummary: { count: plans.length, fromCents } } });
  }, [dispatch, plans.length, fromCents]);
  const openCallback = () => dispatch({ type: "patch", patch: { modal: { kind: "callback", planId: null } } });

  const onBill = (v: string) => {
    const clean = v.replace(/[^0-9.]/g, "").slice(0, 7);
    setBill(clean);
    const n = Number(clean);
    dispatch({ type: "patch", patch: { billCents: clean && n > 0 && n < 2000 ? Math.round(n * 100) : null } });
  };

  const grid = (list: typeof plans, featured: boolean) => (
    <ol className={clsx("grid grid-cols-1 gap-5", featured && "lg:grid-cols-3")}>
      <AnimatePresence initial={false} mode="popLayout">
        {list.map((p, i) => (
          <motion.li
            key={p.id}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: featured ? i * 0.07 : 0 }}
          >
            <PlanCard plan={p} rank={rankOf(p.id)} labels={labels.get(p.id) ?? []} featured={featured} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );

  const list = (l: typeof plans) => (
    <>
      <div className="hidden xl:block">
        <PlanTable plans={l} rankOf={rankOf} labels={labels} caption={t("compareTitle", { n: l.length })} />
      </div>
      <div className="xl:hidden">{grid(l, false)}</div>
    </>
  );

  return (
    <Section stage="results" wide accent="linear-gradient(90deg, #135DF0, #0EA372)">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="bg-cta inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">{category}</p>
          <h2 id="section-results-h" tabIndex={-1} className="mt-3 text-[1.75rem] font-extrabold leading-tight tracking-tight text-ink outline-none sm:text-[2.5rem]">
            {t("plansFound", { n: plans.length })}{" "}
            <span className="mt-1 block text-base font-semibold tracking-normal text-muted sm:text-lg">{s.address ? `${s.address.line1}, ${s.address.city}, ${s.address.state} ${s.address.zip}` : ""}</span>
          </h2>
          {first && (
            <p className="mt-4 flex max-w-3xl items-start gap-2 rounded-2xl border-2 border-security bg-security-soft px-4 py-3 text-sm font-semibold text-ink">
              <BadgeCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-security-text" />
              {t("topMatch", { provider: first.provider, plan: first.name, price: money(allInNow(first)) })}
            </p>
          )}
          {!first && plans.length > 0 && <p className="mt-3 text-base text-ink">{t("topMatchQuote")}</p>}
        </div>
        <Input
          label={t("billLabel")}
          className="w-full shrink-0 lg:w-72"
          inputMode="decimal"
          placeholder={t("billPlaceholder")}
          value={bill}
          onChange={(e) => onBill(e.target.value)}
          icon={<span className="text-base font-bold">$</span>}
          hint={s.billCents ? t("billHintOn") : t("billHintOff")}
        />
      </div>

      {missing.length > 0 && (
        <p role="status" className="mt-6 flex gap-3 rounded-2xl border-2 border-mobile bg-mobile-soft p-4 text-sm font-semibold text-ink">
          <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-mobile-text" />
          {t("fallback", { missing: missing.map(name).join(" + "), covered: covered.map(name).join(" + ") })}
        </p>
      )}

      {plans.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("emptyTitle")} body={t("emptyBody")} action={<Button onClick={openCallback} iconLeft={<PhoneCall aria-hidden className="size-4" />}>{t("scheduleCallback")}</Button>} />
        </div>
      ) : (
        <>
          {!filtered && (
            <div className="mt-10">
              <h3 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">{t("ourTopPicks")}</h3>
              <p className="mb-5 mt-1 text-sm text-muted">{t("rankedBy")}</p>
              {grid(top, true)}
            </div>
          )}

          {(rest.length > 0 || providers.length > 1) && (
            <div className="mt-8">
              {!filtered && rest.length > 0 && (
                <button
                  type="button"
                  aria-expanded={showAll}
                  aria-controls="all-plans"
                  onClick={() => setShowAll((v) => !v)}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/40 bg-primary-soft px-4 text-sm font-extrabold text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  <ListChecks aria-hidden className="size-5" />
                  {showAll ? t("hideAll") : t("seeAll", { n: plans.length })}
                  <ChevronDown aria-hidden className={clsx("size-5 transition-transform", showAll && "rotate-180")} />
                </button>
              )}
              <div id="all-plans" hidden={!showAll && !filtered} className="mt-6">
                {providers.length > 1 && (
                  <div className="mb-5">
                    <p id="carrier-h" className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{t("filterByCarrier")}</p>
                    <div role="radiogroup" aria-labelledby="carrier-h" className="flex flex-wrap gap-2">
                      {["ALL", ...providers].map((p) => (
                        <Chip key={p} role="radio" selected={s.carrier === p} onClick={() => { dispatch({ type: "patch", patch: { carrier: p } }); setShowAll(true); }}>
                          {p === "ALL" ? t("all") : p}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {filtered ? (
                  filtered.length ? list(filtered) : (
                    <EmptyState title={t("noPlansFrom", { carrier: s.carrier })} body={t("emptyBody")} action={<Button variant="secondary" onClick={() => dispatch({ type: "patch", patch: { carrier: "ALL" } })}>{t("showAllCarriers")}</Button>} />
                  )
                ) : (
                  rest.length > 0 && (
                    <>
                      <h3 className="text-xl font-extrabold tracking-tight text-ink">{t("compareTitle", { n: rest.length })}</h3>
                      <p className="mb-4 mt-1 text-sm text-muted">{t("compareSub")}</p>
                      {list(rest)}
                    </>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}

      {s.services.includes("tv") && <DirectvTiers />}

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="fees-h" className="rounded-[20px] border border-line bg-surface2 p-5 sm:p-6">
          <h3 id="fees-h" className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Info aria-hidden className="size-5 text-primary" />
            {t("allInMonthly")}
          </h3>
          <p className="mt-2 text-sm text-ink">{t("feeNote")}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted">{PRICE_DISCLAIMER[s.lang]}</p>
        </section>
        <section aria-labelledby="how-h" className="rounded-[20px] border border-line bg-surface2 p-5 sm:p-6">
          <h3 id="how-h" className="flex items-center gap-2 text-base font-extrabold text-ink">
            <BadgeCheck aria-hidden className="size-5 text-security-text" />
            {t("howTitle")}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {(["how1", "how2", "how3", "how4", "how5"] as const).map((k) => (
              <li key={k} className="flex gap-2 text-sm text-ink">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-security-text" strokeWidth={3} />
                {t(k)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-semibold text-muted">{t("sampleDataNote")}</p>
        </section>
      </div>
    </Section>
  );
}

function DirectvTiers() {
  const { s, t } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="dtv-h" className="stage mt-10 overflow-hidden rounded-[24px]">
      <button type="button" aria-expanded={open} aria-controls="dtv-panel" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-5 text-left sm:p-6">
        <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tv text-white shadow-[0_14px_30px_-12px_var(--tv)]">
          <Tv className="size-6" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-neon">{t("directvBadge")}</span>
          <span id="dtv-h" className="block text-xl font-extrabold text-white">{t("addDirectv")}</span>
          <span className="block text-sm text-on-dark-muted">{t("directvIntro")}</span>
        </span>
        <span className="glass flex size-11 shrink-0 items-center justify-center rounded-full">
          <ChevronDown aria-hidden className={clsx("size-5 text-white transition-transform", open && "rotate-180")} />
        </span>
      </button>
      <div id="dtv-panel" hidden={!open} className="px-5 pb-5 sm:px-6 sm:pb-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DIRECTV_TIERS.map((tier, i) => {
            const c = Object.values(service)[i % 5];
            return (
              <li key={tier.id} className="glass flex flex-col rounded-[20px] p-4">
                <span aria-hidden className="mb-3 h-1.5 w-12 rounded-full" style={{ background: c.vivid }} />
                <p className="text-lg font-extrabold text-white">{tier.name}</p>
                <p className="text-sm font-bold text-on-dark-muted">{t("channels", { n: tier.channels })}</p>
                <dl className="mt-3 space-y-1.5 rounded-2xl bg-white/5 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-on-dark-muted">{t("monthsRange", { n: tier.months })}</dt>
                    <dd className="text-xl font-extrabold text-white tabular">{money(tier.introCents).replace(".00", "")}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-on-dark-muted">{t("monthPlus", { n: tier.months + 1 })}</dt>
                    <dd className="text-xl font-extrabold text-white tabular">{money(tier.regularCents).replace(".00", "")}</dd>
                  </div>
                </dl>
                <ul className="mt-3 space-y-1">
                  {tier.features.map((f) => (
                    <li key={f.en} className="flex gap-1.5 text-xs text-white">
                      <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-security" strokeWidth={3} />
                      {f[s.lang]}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-on-dark-muted">{t("directvNote")}</p>
      </div>
    </section>
  );
}
