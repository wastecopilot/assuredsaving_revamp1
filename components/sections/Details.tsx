"use client";
import { Building2, Check, Info, PhoneCall } from "lucide-react";
import { PLANS } from "@/data/sample";
import { TECH, allInAfter, allInNow, isPriced, money, speedText, techLabel, whyThisPlan } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { Badge, Button } from "../ui";
import { Drawer } from "../ui/Overlay";

/** Plan details in a drawer: price maths, specs, honest tech note, inclusions, contract. */
export function DetailsDrawer() {
  const { s, t, dispatch } = useStore();
  const plan = s.modal.kind === "details" ? PLANS.find((p) => p.id === s.modal.planId) ?? null : null;
  const close = () => dispatch({ type: "patch", patch: { modal: { kind: null, planId: s.modal.planId } } });
  const lang = s.lang;
  const Row = ({ k, v, strong, green }: { k: string; v: string; strong?: boolean; green?: boolean }) => (
    <div className={`flex justify-between gap-4 py-2 ${strong ? "font-bold text-ink" : ""}`}>
      <dt>{k}</dt>
      <dd className={`tabular ${green ? "font-bold text-success" : ""}`}>{v}</dd>
    </div>
  );

  return (
    <Drawer
      open={!!plan}
      onClose={close}
      closeLabel={t("close")}
      header={plan && <p className="mb-1 text-sm font-bold uppercase tracking-[0.12em] text-primary">{plan.provider}</p>}
      title={plan?.name ?? ""}
      footer={
        plan && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={close} className="sm:flex-1">
              {t("close")}
            </Button>
            <Button
              className="sm:flex-[2]"
              iconLeft={<PhoneCall aria-hidden className="size-4" />}
              onClick={() => dispatch({ type: "patch", patch: { modal: { kind: "callback", planId: plan.id } } })}
            >
              {isPriced(plan) ? t("scheduleCallback") : t("getQuote")}
            </Button>
          </div>
        )
      }
    >
      {plan && (
        <div className="space-y-7">
          <section aria-labelledby="d-price" className="rounded-[20px] bg-surface2 p-5">
            <h3 id="d-price" className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
              {t("monthlyPrice")}
            </h3>
            {isPriced(plan) ? (
              <>
                <p className="mt-1 text-[2rem] font-extrabold tracking-tight text-ink tabular">
                  {money(allInNow(plan))}
                  <span className="text-base text-muted">{t("perMo")}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{t("allInNote")}</p>
                <h4 className="mt-4 text-sm font-bold text-ink">{t("feeBreakdown")}</h4>
                <dl className="mt-1 divide-y divide-line text-sm text-muted">
                  <Row k={t("planPrice")} v={money(plan.pricing.planCents)} />
                  {plan.pricing.fees.map((f) => (
                    <Row key={f.label.en} k={f.label[lang]} v={`+${money(f.cents)}`} />
                  ))}
                  {plan.pricing.promo && (
                    <Row
                      k={plan.pricing.promo.months === 1 ? t("promoRow1") : t("promoRow", { n: plan.pricing.promo.months })}
                      v={`−${money(plan.pricing.promo.creditCents)}`}
                      green
                    />
                  )}
                  <Row k={t("allInRow")} v={money(allInNow(plan))} strong />
                  {plan.pricing.promo && <Row k={t("afterRow")} v={money(allInAfter(plan))} strong />}
                </dl>
                {plan.pricing.oneTime.length > 0 && (
                  <p className="mt-3 text-xs text-muted">
                    <span className="font-bold text-ink">{t("oneTime")}: </span>
                    {plan.pricing.oneTime.map((o) => `${o.label[lang]} ${o.cents ? money(o.cents) : "$0"}`).join(", ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">{t("taxesNote")}</p>
              </>
            ) : (
              plan.pricing.kind === "quote" && (
                <>
                  <p className="mt-1 text-3xl font-extrabold text-ink">{t("callForPricing")}</p>
                  <p className="mt-2 text-sm text-ink">{plan.pricing.reason[lang]}</p>
                </>
              )
            )}
          </section>

          <section aria-labelledby="d-why">
            <h3 id="d-why" className="text-sm font-bold text-ink">{t("whyThisPlan")}</h3>
            <p className="mt-1 text-base text-ink">{whyThisPlan(plan, lang, s.addressType)}</p>
          </section>

          <section aria-labelledby="d-specs">
            <h3 id="d-specs" className="text-sm font-bold text-ink">{t("specs")}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-3">
              {[
                speedText(plan, lang) && [t("download"), speedText(plan, lang)!],
                plan.uploadMbps && [t("upload"), `${plan.uploadMbps} Mbps`],
                plan.services.includes("internet") && [t("data"), plan.dataCapGB ? t("capGB", { n: plan.dataCapGB.toLocaleString("en-US") }) : t("noCap")],
                plan.channels && [t("tvLabel"), t("channels", { n: plan.channels })],
                plan.lines && [t("mobileLabel"), String(plan.lines)],
                [t("contract"), plan.contractMonths ? t("monthsContract", { n: plan.contractMonths }) : t("noContract")],
              ]
                .filter((x): x is string[] => Array.isArray(x))
                .map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-line p-3">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="text-sm font-bold text-ink">{v}</dd>
                  </div>
                ))}
            </dl>
          </section>

          <section aria-labelledby="d-tech" className="rounded-[20px] p-4" style={{ background: service[plan.services[0]].soft }}>
            <h3 id="d-tech" className="flex items-center gap-2 text-sm font-bold text-ink">
              <Info aria-hidden className="size-4" style={{ color: service[plan.services[0]].text }} />
              {t("techNote", { tech: techLabel(plan, lang, s.addressType) })}
            </h3>
            <p className="mt-1 text-sm text-ink">{TECH[plan.tech].note[lang]}</p>
          </section>

          <section aria-labelledby="d-inc">
            <h3 id="d-inc" className="text-sm font-bold text-ink">{t("whatIncluded")}</h3>
            <ul className="mt-2 space-y-2">
              {plan.includes.map((i) => (
                <li key={i.en} className="flex gap-2 text-sm text-ink">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-security-text" strokeWidth={3} />
                  {i[lang]}
                </li>
              ))}
            </ul>
          </section>

          {s.addressType === "business" && plan.business && (
            <section aria-labelledby="d-biz">
              <h3 id="d-biz" className="flex items-center gap-2 text-sm font-bold text-ink">
                <Building2 aria-hidden className="size-4 text-primary" />
                {t("forBusiness")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge bg="var(--primary-soft)" fg="var(--primary)">{t("staticIp")}: {plan.business.staticIp[lang]}</Badge>
                <Badge bg="var(--primary-soft)" fg="var(--primary)">{t("support")}: {plan.business.support[lang]}</Badge>
              </div>
            </section>
          )}
          <p className="text-xs text-muted">{t("printedNote")}</p>
        </div>
      )}
    </Drawer>
  );
}
