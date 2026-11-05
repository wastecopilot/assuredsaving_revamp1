"use client";
import { ArrowRight, Check, PhoneCall } from "lucide-react";
import { PLANS } from "@/data/sample";
import { allInAfter, allInNow, bestFor, isPriced, money, planReasons, resultsFor, speedText, techLabel } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { Button } from "../ui";
import { Drawer } from "../ui/Overlay";

/** Plan details: price, speeds, technology, contract, what's included, why this plan. */
export function DetailsDrawer() {
  const { s, t, dispatch } = useStore();
  const plan = s.modal.kind === "details" ? (PLANS.find((p) => p.id === s.modal.planId) ?? null) : null;
  const close = () => dispatch({ type: "patch", patch: { modal: { kind: null, planId: s.modal.planId } } });
  const lang = s.lang;
  const top = resultsFor(s.services).plans[0];
  const biz = s.addressType === "business";

  const rows: [string, string | null][] = plan
    ? [
        [t("technology"), techLabel(plan, lang)],
        [t("downloadSpeed"), speedText(plan, lang)],
        [t("uploadSpeed"), plan.uploadMbps ? `${plan.uploadMbps} Mbps` : null],
        [t("bestFor"), bestFor(plan, lang)],
        [t("contractTerm"), plan.contractMonths ? t("contractMonths", { n: plan.contractMonths }) : t("noContract")],
      ]
    : [];

  return (
    <Drawer
      open={!!plan}
      onClose={close}
      closeLabel={t("close")}
      header={plan && <p className="mb-1 text-sm font-semibold text-primary">{plan.provider}</p>}
      title={plan?.name ?? ""}
      footer={
        plan && (
          <Button
            block
            size="lg"
            iconRight={isPriced(plan) ? <ArrowRight aria-hidden className="size-5" /> : <PhoneCall aria-hidden className="size-5" />}
            onClick={() => dispatch({ type: "patch", patch: { modal: { kind: "callback", planId: plan.id } } })}
          >
            {isPriced(plan) ? t("getStarted") : t(biz ? "callForPricingBusinessCta" : "callForPricingCta")}
          </Button>
        )
      }
    >
      {plan && (
        <div className="space-y-6">
          <section aria-labelledby="d-price" className="rounded-lg border border-line bg-surface2 p-4">
            <h3 id="d-price" className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t("monthly")}
            </h3>
            {isPriced(plan) ? (
              <>
                <p className="mt-1 text-3xl font-extrabold text-ink tabular">
                  {money(allInNow(plan))}
                  <span className="text-base font-semibold text-muted">{t("perMo")}</span>
                </p>
                {plan.pricing.kind === "priced" && plan.pricing.promo && (
                  <p className="mt-1 text-sm text-muted tabular">
                    {t("reg")} {money(allInAfter(plan))}
                    {t("perMo")}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-xl font-bold text-ink">{t(biz ? "callForPricingBusinessCta" : "callForPricing")}</p>
            )}
          </section>

          <dl className="divide-y divide-line rounded-lg border border-line text-sm">
            {rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold text-ink tabular">{v}</dd>
                </div>
              ))}
          </dl>

          {plan.includes && plan.includes.length > 0 && (
            <section aria-labelledby="d-inc">
              <h3 id="d-inc" className="font-bold text-ink">
                {t("whatsIncluded")}
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {plan.includes.map((i) => (
                  <li key={i.en} className="flex gap-2 text-ink">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                    {i[lang]}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {planReasons(plan, top, lang).length > 0 && (
            <section aria-labelledby="d-why">
              <h3 id="d-why" className="font-bold text-ink">
                {t("whyThisPlan")}
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                {planReasons(plan, top, lang).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs leading-relaxed text-muted">{t("priceFooter")}</p>
        </div>
      )}
    </Drawer>
  );
}
