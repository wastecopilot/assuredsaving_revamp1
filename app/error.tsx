"use client";
/** Error boundary: if anything throws, offer the official "Try again" and "Start a new search". */
import { translate } from "@/lib/i18n";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const lang = typeof document !== "undefined" && document.documentElement.lang === "es" ? "es" : "en";
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-lg font-bold text-ink">{translate(lang, "brand")}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={reset} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white">
          {translate(lang, "tryAgain")}
        </button>
        <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-md border border-line-strong px-5 text-sm font-semibold text-ink">
          {translate(lang, "startOver")}
        </button>
      </div>
    </main>
  );
}
