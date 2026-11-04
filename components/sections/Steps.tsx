"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Briefcase, Building2, Check, CloudUpload, Gamepad2, Globe, Home, Laptop, MapPin, MonitorPlay, Search, Smartphone, Tv, User, Video, Wifi, WifiOff, X } from "lucide-react";
import clsx from "clsx";
import { DEVICES, GENRES, PACKS, USAGE, type SampleAddress } from "@/data/sample";
import { formatAddress as fmt, getAddressSuggestions } from "@/lib/address";
import { STAGE, nextStage, useStore, type State } from "@/lib/store";
import { motion as m, service } from "@/lib/tokens";
import { Button, Chip, Input, Slider } from "../ui";
import { Heading, Section } from "./Section";

/** Continue button label depends on what comes next. */
function useNextLabel(from: number) {
  const { s, t } = useStore();
  const to = nextStage(s, from);
  if (to === STAGE.scan) return s.services.length > 1 && s.services.includes("tv") ? t("findBundle") : t("findPlans");
  return t("continue");
}

/* ============================== Name & address ============================== */
/**
 * Same flow as the original one-pager (AddressVerification.tsx):
 * 1. Name first. The address block appears once the name is valid.
 * 2. Suggestions open as soon as the visitor types, and are built from the typed text.
 * 3. Choosing a suggestion verifies it, detects residential or business from the
 *    suggestion, and unlocks the next section straight away (no extra button).
 * 4. Editing or clearing a verified address collapses everything below it.
 */
export function AddressSection() {
  const { s, dispatch, t, goNext } = useStore();
  const [q, setQ] = useState(s.address ? fmt(s.address) : "");
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  const nameValid = s.name.trim().length >= 2;
  const verified = !!s.address && fmt(s.address) === q;
  const matches = verified ? [] : getAddressSuggestions(q);
  const open = q.trim().length > 0 && !dismissed && matches.length > 0;

  useEffect(() => {
    const onDown = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setDismissed(true);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /** Editing a verified address invalidates it and collapses the sections below. */
  const collapse = () => dispatch({ type: "patch", patch: { address: null, stage: Math.min(s.stage, STAGE.address), scanDone: false, usage: [] } });

  const choose = (a: SampleAddress) => {
    setQ(fmt(a));
    setDismissed(true);
    setActive(-1);
    dispatch({ type: "patch", patch: { address: a, addressType: a.type, usage: [] } });
    goNext(STAGE.address);
  };
  const clear = () => {
    setQ("");
    setDismissed(true);
    setActive(-1);
    collapse();
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(matches[Math.max(active, 0)]);
    } else if (e.key === "Escape") setDismissed(true);
  };

  return (
    <Section stage="address" accent={`linear-gradient(135deg, ${service.internet.vivid}, #5B3DF5)`}>
      <Heading id="section-address-h" a={t("nameTitle")} />
      <div className="mt-6 max-w-xl">
        <Input
          label={t("fullName")}
          placeholder={t("fullNamePlaceholder")}
          autoComplete="name"
          value={s.name}
          onChange={(e) => dispatch({ type: "patch", patch: { name: e.target.value } })}
          icon={<User aria-hidden className="size-5" />}
          hint={nameValid ? undefined : t("nameFirst")}
          trailing={nameValid ? <span className="flex size-8 items-center justify-center rounded-full bg-security text-ink"><Check aria-hidden className="size-4" strokeWidth={3} /></span> : null}
        />
        <AnimatePresence>
          {nameValid && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-bold text-primary">
              <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-white">{s.name.trim()[0]?.toUpperCase()}</span>
              {t("welcome", { name: s.name.trim().split(/\s+/)[0] })}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {nameValid && (
          <motion.div key="addr-block" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={m.soft} className="mt-10 border-t border-line pt-10">
            <Heading id="addr-h" eyebrow={t("nowAddress")} a={t("addressTitleA")} b={t("addressTitleB")} sub={t("addressSub")} />
            <div ref={wrap} className="relative z-20 mt-6 max-w-xl">
              <label htmlFor="addr" className="mb-2 block text-sm font-semibold text-ink">
                {t("addressLabel")}
              </label>
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
                <input
                  id="addr"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                  aria-describedby="addr-note"
                  autoComplete="off"
                  placeholder={t("addressPlaceholder")}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setDismissed(false);
                    setActive(-1);
                    if (s.address) collapse();
                  }}
                  onFocus={(e) => {
                    setDismissed(false);
                    // On phones, lift the field to the top so suggestions stay above the keyboard.
                    if (window.innerWidth < 640) {
                      const el = e.currentTarget;
                      window.setTimeout(() => el.scrollIntoView({ block: "start", behavior: "smooth" }), 150);
                    }
                  }}
                  onKeyDown={onKey}
                  className="min-h-14 w-full rounded-md border border-line-strong bg-surface pl-12 pr-14 text-base text-ink transition-colors placeholder:text-muted focus:border-primary focus:outline-none"
                />
                {q && (
                  <button type="button" onClick={clear} aria-label={t("clearAddress")} className="absolute right-1.5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-ink">
                    <X aria-hidden className="size-5" />
                  </button>
                )}
              </div>
              <ul id={listId} role="listbox" aria-label={t("addressLabel")} hidden={!open} className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-lg border border-line bg-surface p-1.5 shadow-overlay">
                {matches.map((a, i) => (
                  <li
                    key={a.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => {
                      if (active !== i) setActive(i);
                    }}
                    onClick={() => choose(a)}
                    className={clsx("flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 py-2", i === active && "bg-primary-soft")}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-primary">
                      <MapPin aria-hidden className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-ink">{a.line1}</span>
                      <span className="block text-xs text-muted">
                        {a.city}, {a.state} {a.zip}
                      </span>
                    </span>
                    <ArrowRight aria-hidden className="size-4 shrink-0 text-muted" />
                  </li>
                ))}
              </ul>
              <p id="addr-note" className="mt-2 text-xs text-muted">
                {t("sampleNote")}
              </p>
            </div>
            <div aria-live="polite">{s.address && verified && <FoundCard />}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

function FoundCard() {
  const { s, t } = useStore();
  const a = s.address!;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={m.soft} className="mt-6 overflow-hidden rounded-lg border border-security bg-surface">
      {/* Illustrated street scene: not a photo */}
      <div aria-hidden className="relative h-36 overflow-hidden bg-[#E9F1FF] sm:h-44">
        <svg viewBox="0 0 640 176" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
          <rect width="640" height="176" fill="#E9F1FF" />
          <circle cx="560" cy="40" r="22" fill="#F5A30B" />
          <rect y="132" width="640" height="44" fill="#D9D2EC" />
          <rect y="150" width="640" height="4" fill="#fff" />
          <g fill="#fff">
            <rect x="40" y="70" width="120" height="62" rx="6" />
            <rect x="200" y="54" width="150" height="78" rx="6" />
            <rect x="390" y="78" width="110" height="54" rx="6" />
          </g>
          <path d="M30 72 100 30l70 42Z" fill="#F0446C" />
          <path d="M190 56 275 16l85 40Z" fill="#135DF0" />
          <path d="M380 80 445 46l65 34Z" fill="#0EA372" />
          <g fill="#BCD0FF">
            <rect x="60" y="88" width="24" height="20" rx="3" /><rect x="116" y="88" width="24" height="20" rx="3" />
            <rect x="222" y="74" width="28" height="22" rx="3" /><rect x="300" y="74" width="28" height="22" rx="3" /><rect x="262" y="100" width="26" height="32" rx="3" fill="#A9B8F5" />
            <rect x="410" y="94" width="22" height="18" rx="3" /><rect x="456" y="94" width="22" height="18" rx="3" />
          </g>
          <circle cx="590" cy="118" r="18" fill="#10C79A" opacity=".8" /><rect x="587" y="118" width="6" height="16" fill="#0A7B5F" />
        </svg>
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-security-text shadow-sm">
          <Check aria-hidden className="size-3.5" strokeWidth={3.5} />
          {t("addressFound")}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{t("yourAddress")}</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">{a.line1}</p>
          <p className="text-sm text-muted">{a.city}, {a.state} {a.zip}</p>
        </div>
        {/* The type is detected from the address; the visitor doesn't choose it. */}
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
          <span
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
              a.type === "business" ? "bg-internet-soft text-internet-text" : "bg-security-soft text-security-text",
            )}
          >
            {a.type === "business" ? <Building2 aria-hidden className="size-4" /> : <Home aria-hidden className="size-4" />}
            {t(a.type === "business" ? "businessTag" : "residentialTag")}
          </span>
          <span className="text-xs text-muted">{t("detected")}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ================================== Usage ================================== */
const USAGE_ICON: Record<string, typeof Briefcase> = { office: Briefcase, streaming: Video, data: CloudUpload, basic: Globe, casual: Smartphone, remote: Laptop, "4k": MonitorPlay, gaming: Gamepad2 };
const USAGE_COLORS = ["internet", "mobile", "tv", "security"] as const;

export function UsageSection() {
  const { s, dispatch, t, goNext } = useStore();
  const reduce = useReducedMotion();
  const label = useNextLabel(STAGE.usage);
  return (
    <Section stage="usage" accent={`linear-gradient(135deg, #5B3DF5, ${service.mobile.vivid})`}>
      <Heading id="section-usage-h" a={t("usageTitleA")} b={t("usageTitleB")} sub={t("selectAll")} />
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {USAGE[s.addressType].map((u, i) => {
          const on = s.usage.includes(u.id);
          const c = service[USAGE_COLORS[i]];
          const Icon = USAGE_ICON[u.id] ?? Globe;
          return (
            <motion.button
              key={u.id}
              type="button"
              aria-pressed={on}
              whileTap={reduce ? undefined : { scale: 0.95 }}
              onClick={() => dispatch({ type: "patch", patch: { usage: on ? s.usage.filter((x) => x !== u.id) : [...s.usage, u.id] } })}
              className={clsx("relative flex min-h-[148px] flex-col items-start gap-3 rounded-lg border p-4 text-left transition-[border-color,box-shadow,background-color]", !on && "border-line hover:border-line-strong")}
              style={on ? { borderColor: c.vivid, background: c.soft, boxShadow: `0 14px 30px -14px ${c.vivid}` } : undefined}
            >
              <span className="flex size-11 items-center justify-center rounded-md" style={{ background: on ? c.vivid : c.soft, color: on ? c.on : c.text }}>
                <Icon aria-hidden className="size-5" strokeWidth={2.4} />
              </span>
              <span className="font-display text-base font-semibold leading-tight text-ink">{u.title[s.lang]}</span>
              <span className="text-xs text-muted">{u.desc[s.lang]}</span>
              {on && (
                <span aria-hidden className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full" style={{ background: c.vivid, color: c.on }}>
                  <Check className="size-3.5" strokeWidth={3.5} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-6 rounded-lg bg-surface2 p-5 sm:p-6">
        <Slider
          label={t("devices")}
          min={DEVICES.min}
          max={DEVICES.max}
          value={s.devices}
          onChange={(v) => dispatch({ type: "patch", patch: { devices: v } })}
          display={s.devices >= DEVICES.max ? "100+" : String(s.devices)}
          minLabel={String(DEVICES.min)}
          maxLabel="100+"
        />
        <p className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Smartphone aria-hidden className="size-4" />
          <Laptop aria-hidden className="size-4" />
          <Tv aria-hidden className="size-4" />
          {t("devicesHint")}
        </p>
      </div>
      <div className="mt-8">
        <Button size="lg" onClick={() => goNext(STAGE.usage)} iconRight={<ArrowRight aria-hidden className="size-5" strokeWidth={2.6} />} className="w-full sm:w-auto sm:min-w-72">
          {label}
        </Button>
      </div>
    </Section>
  );
}

/* ================================= TV setup ================================= */
function Group({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6">
      <h3 id={id} className="font-display text-lg font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function TvSection() {
  const { s, dispatch, t, goNext } = useStore();
  const label = useNextLabel(STAGE.tv);
  const set = (patch: Partial<State>) => dispatch({ type: "patch", patch });
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <Section stage="tv" accent={`linear-gradient(135deg, ${service.tv.vivid}, ${service.phone.vivid})`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-tv text-ink shadow-[0_14px_30px_-12px_var(--tv)]">
          <Tv className="size-7" strokeWidth={2.4} />
        </span>
        <Heading id="section-tv-h" a={t("tvTitleA")} b={t(s.services.length > 1 ? "tvTitleB" : "tvTitleSolo")} sub={t("tvSub")} />
      </div>
      <div className="mt-8 space-y-6">
        <Group id="g-watch" title={t("watchMost")} hint={t("watchHint")}>
          <div role="group" aria-labelledby="g-watch" className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Chip key={g.id} color="tv" selected={s.genres.includes(g.id)} onClick={() => set({ genres: toggle(s.genres, g.id) })}>
                {g.label[s.lang]}
              </Chip>
            ))}
          </div>
        </Group>
        <Group id="g-intl" title={t("international")} hint={t("intlHint")}>
          <div role="group" aria-labelledby="g-intl" className="flex flex-wrap gap-2">
            {PACKS.map((g) => (
              <Chip key={g.id} color="mobile" selected={s.intl.includes(g.id)} onClick={() => set({ intl: toggle(s.intl, g.id) })}>
                {g.label[s.lang]}
              </Chip>
            ))}
          </div>
        </Group>
        <Group id="g-tvs" title={t("yourTvs")}>
          <div className="grid gap-6 sm:grid-cols-2">
            <Slider label={t("howManyTvs")} min={1} max={10} value={s.tvs} onChange={(v) => set({ tvs: v, smartTvs: Math.min(s.smartTvs, v) })} minLabel="1" maxLabel="10" from={service.tv.vivid} to={service.phone.vivid} />
            <Slider label={t("howManySmart")} min={0} max={s.tvs} value={Math.min(s.smartTvs, s.tvs)} onChange={(v) => set({ smartTvs: v })} minLabel="0" maxLabel={String(s.tvs)} from={service.tv.vivid} to={service.phone.vivid} />
          </div>
        </Group>
        {s.services.includes("internet") && (
          <Group id="g-net" title={t("haveInternet")} hint={t("haveInternetNote")}>
            <div role="radiogroup" aria-labelledby="g-net" className="grid grid-cols-2 gap-3 sm:max-w-md">
              {[true, false].map((v) => {
                const on = s.hasInternet === v;
                const Icon = v ? Wifi : WifiOff;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set({ hasInternet: v })}
                    className={clsx("flex min-h-14 items-center justify-center gap-2 rounded-md border text-base font-bold transition-all active:scale-95", on ? "border-primary bg-primary-soft text-primary" : "border-line text-ink hover:border-line-strong")}
                  >
                    <Icon aria-hidden className="size-5" />
                    {t(v ? "yes" : "no")}
                  </button>
                );
              })}
            </div>
          </Group>
        )}
      </div>
      <div className="mt-8">
        <Button size="lg" onClick={() => goNext(STAGE.tv)} iconRight={<ArrowRight aria-hidden className="size-5" strokeWidth={2.6} />} className="w-full sm:w-auto sm:min-w-72">
          {label}
        </Button>
      </div>
    </Section>
  );
}
