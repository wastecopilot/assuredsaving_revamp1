"use client";
import type { Plan } from "@/data/sample";
import { allInAfter, allInNow, bestFor, isPriced, money, speedText, techLabel, type Label } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { LABEL_STYLE } from "./PlanCard";

/** "Quick Comparison" table (wide screens). Real table semantics for screen readers. */
export function PlanTable({ plans, rankOf, labels }: { plans: Plan[]; rankOf: (id: string) => number; labels: Map<string, Label[]> }) {
  const { s, t, dispatch } = useStore();
  const lang = s.lang;
  const internet = plans.some((p) => p.services.includes("internet"));
  const open = (kind: "details" | "callback", id: string) => dispatch({ type: "patch", patch: { modal: { kind, planId: id } } });
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t("quickComparison")}</caption>
        <thead className="border-b border-line bg-surface2 text-xs font-semibold uppercase tracking-wider text-muted">
          <tr>
            <th scope="col" className="w-10 px-4 py-3">
              #
            </th>
            <th scope="col" className="px-4 py-3">
              {t("provider")}
            </th>
            <th scope="col" className="px-4 py-3">
              {t("technology")}
            </th>
            {internet && (
              <th scope="col" className="px-4 py-3">
                {t("download")}
              </th>
            )}
            {internet && (
              <th scope="col" className="px-4 py-3">
                {t("bestFor")}
              </th>
            )}
            <th scope="col" className="px-4 py-3 text-right">
              {t("price")}
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">{t("getStarted")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {plans.map((p) => (
            <tr key={p.id} className="align-top hover:bg-surface2">
              <td className="px-4 py-4 font-semibold text-muted tabular">{rankOf(p.id)}</td>
              <th scope="row" className="px-4 py-4 font-normal">
                <span className="block font-semibold text-ink">{p.provider}</span>
                <span className="block text-muted">{p.name}</span>
                {(labels.get(p.id) ?? []).map((l) => (
                  <span key={l} className="mr-1 mt-1.5 inline-block rounded-sm px-1.5 py-0.5 text-xs font-semibold" style={{ background: LABEL_STYLE[l].bg, color: LABEL_STYLE[l].fg }}>
                    {t(LABEL_STYLE[l].key)}
                  </span>
                ))}
              </th>
              <td className="px-4 py-4 text-ink">{techLabel(p, lang)}</td>
              {internet && <td className="px-4 py-4 font-semibold text-ink tabular">{speedText(p, lang) ?? "—"}</td>}
              {internet && <td className="px-4 py-4 text-muted">{bestFor(p, lang)}</td>}
              <td className="px-4 py-4 text-right tabular">
                {isPriced(p) ? (
                  <>
                    <span className="block font-bold text-ink">
                      {money(allInNow(p))}
                      {t("perMo")}
                    </span>
                    {p.pricing.kind === "priced" && p.pricing.promo && (
                      <span className="block text-xs text-muted">
                        {t("reg")} {money(allInAfter(p))}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-semibold text-ink">{t("callForPricing")}</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => open("details", p.id)} className="press inline-flex min-h-11 items-center whitespace-nowrap rounded-md border border-line-strong px-3 text-sm font-semibold text-ink hover:bg-surface">
                    {t("showDetails")}
                    <span className="sr-only">
                      : {p.provider} {p.name}
                    </span>
                  </button>
                  <button type="button" onClick={() => open("callback", p.id)} className="press inline-flex min-h-11 items-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-strong">
                    {isPriced(p) ? t("getStarted") : t("callForPricingCta")}
                    <span className="sr-only">
                      : {p.provider} {p.name}
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
