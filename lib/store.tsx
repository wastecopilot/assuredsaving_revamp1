"use client";
/**
 * One-page flow state. Like the original one-pager, the page never navigates:
 * sections unlock in order and the page scrolls to each new one.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { DEVICES, type AddressType, type SampleAddress, type ServiceId } from "@/data/catalog";
import { translate, type Key, type Lang } from "./i18n";

export const STAGE = { intent: 0, address: 1, usage: 2, tv: 3, scan: 4, results: 5 } as const;
export type StageName = keyof typeof STAGE;
export const STAGE_NAMES: StageName[] = ["intent", "address", "usage", "tv", "scan", "results"];
export const sectionId = (s: StageName) => `section-${s}`;

export interface State {
  lang: Lang;
  stage: number;
  services: ServiceId[];
  name: string;
  address: SampleAddress | null;
  addressType: AddressType;
  usage: string[];
  devices: number;
  genres: string[];
  intl: string[];
  tvs: number;
  smartTvs: number;
  hasInternet: boolean | null;
  scanDone: boolean;
  carrier: string;
  billCents: number | null;
  modal: { kind: "details" | "callback" | null; planId: string | null };
  /** Filled by the results section for the "Your quote" summary. */
  resultsSummary: { count: number; fromCents: number | null } | null;
}

const initial: State = {
  lang: "en",
  stage: STAGE.intent,
  services: [],
  name: "",
  address: null,
  addressType: "residential",
  usage: [],
  devices: DEVICES.default,
  genres: [],
  intl: [],
  tvs: 1,
  smartTvs: 1,
  hasInternet: null,
  scanDone: false,
  carrier: "ALL",
  billCents: null,
  modal: { kind: null, planId: null },
  resultsSummary: null,
};

export type Action =
  | { type: "patch"; patch: Partial<State> }
  | { type: "toggleService"; s: ServiceId }
  | { type: "setServices"; s: ServiceId[] }
  | { type: "advance"; to: number }
  | { type: "back" }
  | { type: "reset" };

/** Usage applies only when internet is part of the request; TV setup only with TV. */
export const usageApplies = (s: State) => s.services.includes("internet");
export const tvApplies = (s: State) => s.services.includes("tv");
const applies = (s: State, stage: number) => (stage === STAGE.usage ? usageApplies(s) : stage === STAGE.tv ? tvApplies(s) : true);

/** The next stage after `from` that applies to this person. */
export function nextStage(s: State, from: number) {
  let n = from + 1;
  while (n < STAGE.results && !applies(s, n)) n++;
  return n;
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "patch":
      return { ...s, ...a.patch };
    case "toggleService": {
      const services = s.services.includes(a.s) ? s.services.filter((x) => x !== a.s) : [...s.services, a.s];
      return { ...s, services, carrier: "ALL" };
    }
    case "setServices":
      return { ...s, services: a.s, carrier: "ALL" };
    case "advance":
      return { ...s, stage: Math.max(s.stage, a.to) };
    case "back": {
      if (s.modal.kind) return { ...s, modal: { ...s.modal, kind: null } };
      if (s.stage <= 0) return s;
      let t = s.stage - 1;
      while (t > 0 && !applies(s, t)) t--;
      // Leaving results or scan re-runs the scan next time.
      return { ...s, stage: t, scanDone: t >= STAGE.results ? s.scanDone : false };
    }
    case "reset":
      return { ...initial, lang: s.lang };
  }
}

interface Ctx {
  s: State;
  dispatch: (a: Action) => void;
  t: (k: Key, vars?: Record<string, string | number>) => string;
  /** Unlock the next applicable section and scroll to it. */
  goNext: (from: number) => void;
  scrollTo: (stage: StageName) => void;
}
const C = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(C);
  if (!c) throw new Error("useStore outside provider");
  return c;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, initial);
  const ref = useRef(s);
  ref.current = s;
  const pending = useRef<StageName | null>(null);

  const scrollTo = useCallback((stage: StageName) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Sections load on demand, so wait (up to ~3s) for the section to appear.
    let tries = 0;
    const attempt = () => {
      const el = document.getElementById(sectionId(stage));
      if (!el) {
        if (++tries < 60) window.setTimeout(attempt, 50);
        return;
      }
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      // Move keyboard focus to the new section's heading.
      window.setTimeout(() => el.querySelector<HTMLElement>("h2[tabindex='-1'], h1[tabindex='-1']")?.focus({ preventScroll: true }), reduce ? 0 : 450);
    };
    attempt();
  }, []);

  const goNext = useCallback((from: number) => {
    const to = nextStage(ref.current, from);
    dispatch({ type: "advance", to });
    pending.current = STAGE_NAMES[to];
  }, []);

  // Scroll after the newly unlocked section has mounted.
  useEffect(() => {
    if (!pending.current) return;
    const target = pending.current;
    pending.current = null;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(target)));
    return () => cancelAnimationFrame(id);
  }, [s.stage, scrollTo]);

  // Back button scrolls up to the section you return to.
  const prev = useRef(s.stage);
  useEffect(() => {
    if (s.stage < prev.current) requestAnimationFrame(() => scrollTo(STAGE_NAMES[s.stage]));
    prev.current = s.stage;
  }, [s.stage, scrollTo]);

  useEffect(() => {
    document.documentElement.lang = s.lang;
  }, [s.lang]);

  const t = useCallback((k: Key, vars?: Record<string, string | number>) => translate(s.lang, k, vars), [s.lang]);
  const value = useMemo(() => ({ s, dispatch, t, goNext, scrollTo }), [s, t, goNext, scrollTo]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
