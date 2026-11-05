"use client";
import dynamic from "next/dynamic";
import { StoreProvider, STAGE, useStore } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { Footer, Header } from "@/components/sections/Shell";
import { Hero } from "@/components/sections/Hero";

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
 * One page with the same steps, order and flow as the original one-pager.
 * Step 1 sits on a full-width midnight stage; the later steps follow as
 * white step cards on a light work area, with context chips in the header.
 */
function OnePager() {
  const { s, t } = useStore();
  return (
    <ToastProvider closeLabel={t("close")}>
      <Header />
      <main>
        <Hero />
        {s.stage >= STAGE.address && (
          <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
            {s.stage >= STAGE.address && <AddressSection />}
            {s.stage >= STAGE.usage && s.services.includes("internet") && <UsageSection />}
            {s.stage >= STAGE.tv && s.services.includes("tv") && <TvSection />}
            {s.stage >= STAGE.scan && !s.scanDone && <ScanSection />}
            {s.scanDone && s.stage >= STAGE.results && <ResultsSection />}
          </div>
        )}
      </main>
      <Footer />
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
