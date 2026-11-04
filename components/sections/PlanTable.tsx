"use client";
import { ArrowRight, PhoneCall } from "lucide-react";
import type { Plan } from "@/data/sample";
import { allInAfter, allInNow, isPriced, money, speedText, techLabel, type Label } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { Badge } from "../ui";
import { LABEL_STYLE } from "./PlanCard";

/**
 * Comparison table for every plan (desktop and tablet). Real table semantics:
 * caption, column headers and row headers, so screen readers can compare plans.
 */
export function PlanTable({ plans, rankOf, labels, caption }: { plans: Plan[]; rankOf: (id: string) => number; labels: Map<string, Label[]>; caption: string }) {
  const { s, t, dispatch } = useStore();
  const lang = s.lang;
  const open = (kind: "details" | "callback", id: string) => dispatch({ type: "patch", patch: { modal: { kind, planId: id } } });
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface2 text-xs font-semibold text-muted">
            <tr>
              <th scope="col" className="w-12 px-3 py-3">#</th>
              <th scope="col" className="px-3 py-3">{t("colPlan")}</th>
              <th scope="col" className="px-3 py-3">{t("download")}</th>
              <th scope="col" className="px-3 py-3">{t("colIncludes")}</th>
              <th scope="col" className="px-3 py-3">{t("contract")}</th>
              <th scope="col" className="px-3 py-3 text-right">{t("colAllIn")}</th>
              <th scope="col" className="px-3 py-3 text-right">{t("colAfter")}</th>
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">{t("colActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {plans.map((p) => {
              const ls = labels.get(p.id) ?? [];
              const c = service[p.services[0]];
              const includes = [p.channels ? t("channels", { n: p.channels }) : null, p.lines ? `${p.lines} ${t("mobileLabel").toLowerCase()}` : null, p.dataCapGB ? t("capGB", { n: p.dataCapGB.toLocaleString("en-US") }) : null]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={p.id} className="bg-surface align-top transition-colors hover:bg-surface2/70">
                  <td className="px-3 py-4 font-semibold text-muted tabular">{rankOf(p.id)}</td>
                  <th scope="row" className="px-3 py-4 font-normal">
                    <span className="block font-semibold text-ink">{p.provider}</span>
                    <span className="block text-muted">{p.name}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      <Badge bg={c.soft} fg={c.text}>{techLabel(p, lang, s.addressType)}</Badge>
                      {ls.map((l) => (
                        <Badge key={l} bg={LABEL_STYLE[l].bg} fg={LABEL_STYLE[l].fg}>
                          {t(`label_${l}`)}
                        </Badge>
                      ))}
                    </span>
                  </th>
                  <td className="px-3 py-4 font-medium text-ink tabular">{speedText(p, lang) ?? "None"}</td>
                  <td className="px-3 py-4 text-muted">{includes || t("noCap")}</td>
                  <td className="px-3 py-4 text-muted">{p.contractMonths ? t("monthsContract", { n: p.contractMonths }) : t("noContract")}</td>
                  {isPriced(p) ? (
                    <>
                      <td className="px-3 py-4 text-right">
                        <span className="block text-base font-semibold text-ink tabular">{money(allInNow(p))}</span>
                        <span className="block text-xs text-muted">{p.pricing.promo ? t("firstMonths", { n: p.pricing.promo.months }) : t("everyMonth")}</span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <span className="block text-base font-semibold text-ink tabular">{money(allInAfter(p))}</span>
                        <span className="block text-xs text-muted">{p.pricing.promo ? t("fromMonth", { n: p.pricing.promo.months + 1 }) : t("noPromo")}</span>
                      </td>
                    </>
                  ) : (
                    <td colSpan={2} className="px-3 py-4 text-right">
                      <span className="block font-semibold text-ink">{t("callForPricing")}</span>
                      <span className="block text-xs text-muted">{t("quoteShort")}</span>
                    </td>
                  )}
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-stretch gap-2 2xl:flex-row 2xl:justify-end">
                      <button
                        type="button"
                        onClick={() => open("details", p.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-3 text-sm font-semibold text-ink shadow-sm hover:border-primary hover:text-primary"
                      >
                        {t("details")}
                        <span className="sr-only">: {p.provider} {p.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => open("callback", p.id)}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-strong"
                      >
                        {isPriced(p) ? t("getPlan") : t("getQuote")}
                        {isPriced(p) ? <ArrowRight aria-hidden className="size-4" /> : <PhoneCall aria-hidden className="size-4" />}
                        <span className="sr-only">: {p.provider} {p.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
