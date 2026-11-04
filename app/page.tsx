"use client";
import dynamic from "next/dynamic";
import { LEGAL } from "@/data/catalog";
import { StoreProvider, STAGE, useStore } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { Glows, Header } from "@/components/sections/Shell";
import { Hero } from "@/components/sections/Hero";
import { SummaryPanel } from "@/components/sections/Summary";

/*
 * Sections below the first step unlock one by one, so their code (and the
 * animation library) loads on demand instead of slowing the first paint.
 */
const AddressSection = dynamic(() => import("@/components/sections/Steps").then((m) => m.AddressSection), { ssr: false });
const UsageSection = dynamic(() => import("@/components/sections/Steps").then((m) => m.UsageSection), { ssr: false });
const TvSection = dynamic(() => import("@/components/sections/Steps").then((m) => m.TvSection), { ssr: false });
const ScanSection = dynamic(() => import("@/components/sections/Scan").then((m) => m.ScanSection), { ssr: false });
const ResultsSection = dynamic(() => import("@/components/sections/Results").then((m) => m.ResultsSection), { ssr: false });
const DetailsDrawer = dynamic(() => import("@/components/sections/Details").then((m) => m.DetailsDrawer), { ssr: false });
const CallbackModal = dynamic(() => import("@/components/sections/Callback").then((m) => m.CallbackModal), { ssr: false });

/**
 * One page with the same steps, order and flow as the original one-pager,
 * laid out as a quote workspace: steps in the main column, a live
 * "Your quote" summary in a sticky sidebar on large screens.
 */
function OnePager() {
  const { s, t } = useStore();
  return (
    <ToastProvider closeLabel={t("close")}>
      <Glows />
      <Header />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-8">
          <Hero />
          {s.stage >= STAGE.address && <AddressSection />}
          {s.stage >= STAGE.usage && s.services.includes("internet") && <UsageSection />}
          {s.stage >= STAGE.tv && s.services.includes("tv") && <TvSection />}
          {s.stage >= STAGE.scan && !s.scanDone && <ScanSection />}
          {s.scanDone && s.stage >= STAGE.results && <ResultsSection />}
        </main>
        <aside className="hidden lg:block" aria-label={t("yourQuote")}>
          <div className="sticky top-32">
            <SummaryPanel results={s.scanDone && s.resultsSummary ? s.resultsSummary : undefined} />
          </div>
        </aside>
      </div>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Assured Saving · {t("previewTag")}</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-1">
            {[
              [t("cbTerms"), LEGAL.terms],
              [t("cbPrivacy"), LEGAL.privacy],
              [t("cbSmsTerms"), LEGAL.sms],
            ].map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink hover:text-primary">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
      {s.modal.kind === "details" && <DetailsDrawer />}
      {s.modal.kind === "callback" && <CallbackModal />}
    </ToastProvider>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <OnePager />
    </StoreProvider>
  );
}
