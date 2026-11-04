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
              <label htmlFor="addr" className="mb-2 block text-sm font-bold text-ink">
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
                  className="min-h-14 w-full rounded-2xl border-2 border-line-strong bg-surface2 pl-12 pr-14 text-base text-ink transition-colors placeholder:text-muted hover:border-[#aeb2cf] focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
                {q && (
                  <button type="button" onClick={clear} aria-label={t("clearAddress")} className="absolute right-1.5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-ink">
                    <X aria-hidden className="size-5" />
                  </button>
                )}
              </div>
              <ul id={listId} role="listbox" aria-label={t("addressLabel")} hidden={!open} className="relative z-10 mt-2 max-h-80 overflow-auto rounded-2xl border border-line bg-surface p-1.5 shadow-md">
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
                    className={clsx("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2", i === active && "bg-primary-soft")}
                  >
                    <span className="bg-cta flex size-9 shrink-0 items-center justify-center rounded-full text-white">
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

const STARS = [[40, 30], [120, 20], [260, 26], [380, 14], [470, 40], [600, 80], [200, 48]];

function FoundCard() {
  const { s, t } = useStore();
  const a = s.address!;
  const biz = a.type === "business";
  const windows = (x0: number, y0: number, cols: number, rows: number, dx: number, dy: number, w: number, h: number, k: string) =>
    Array.from({ length: rows * cols }, (_, i) => <rect key={`${k}${i}`} x={x0 + (i % cols) * dx} y={y0 + Math.floor(i / cols) * dy} width={w} height={h} rx="2" />);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={m.soft} className="mt-6 max-w-3xl overflow-hidden rounded-[24px] border border-line bg-surface shadow-md">
      {/* Illustrated night skyline: not a photo */}
      <div aria-hidden className="relative h-36 overflow-hidden bg-navy sm:h-44">
        <svg viewBox="0 0 640 176" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2A1060" />
              <stop offset="0.6" stopColor="#0A0E2E" />
              <stop offset="1" stopColor="#06304A" />
            </linearGradient>
          </defs>
          <rect width="640" height="176" fill="url(#sky)" />
          <circle cx="560" cy="38" r="16" fill="#FFE7A3" />
          {STARS.map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="1.6" fill="#fff" opacity=".8" />
          ))}
          <rect x="30" y="70" width="70" height="106" rx="4" fill="#1E2A6B" />
          <rect x="110" y="40" width="90" height="136" rx="4" fill="#E0167A" />
          <rect x="210" y="86" width="64" height="90" rx="4" fill="#12C8E8" />
          <rect x="284" y="56" width="110" height="120" rx="4" fill="#5B2EE8" />
          <rect x="404" y="92" width="70" height="84" rx="4" fill="#FFB020" />
          <rect x="484" y="66" width="80" height="110" rx="4" fill="#3B5BFF" />
          <rect x="574" y="100" width="56" height="76" rx="4" fill="#7DD322" />
          <g fill="#fff" opacity=".55">
            {windows(124, 56, 3, 4, 24, 26, 12, 12, "a")}
            {windows(298, 72, 4, 4, 24, 24, 12, 10, "b")}
            {windows(500, 84, 2, 3, 28, 26, 14, 12, "c")}
          </g>
          <rect y="168" width="640" height="8" fill="#06081E" />
        </svg>
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-security-text shadow-sm">
          <Check aria-hidden className="size-3.5" strokeWidth={3.5} />
          {t("addressFound")}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <MapPin aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{t("yourAddress")}</p>
            <p className="mt-0.5 text-xl font-extrabold tracking-tight text-ink">{a.line1}</p>
            <p className="text-sm text-muted">
              {a.city}, {a.state} {a.zip}
            </p>
          </div>
        </div>
        {/* The type is detected from the address; the visitor doesn't choose it. */}
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
          <span className={clsx("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-wide", biz ? "bg-cta text-white" : "bg-security text-ink")}>
            {biz ? <Building2 aria-hidden className="size-4" /> : <Home aria-hidden className="size-4" />}
            {t(biz ? "businessTag" : "residentialTag")}
          </span>
          <span className="text-xs font-semibold text-muted">{t("detected")}</span>
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
              className={clsx("relative flex min-h-[156px] flex-col items-start gap-3 overflow-hidden rounded-[20px] border-2 p-4 text-left transition-[border-color,box-shadow,background-color,transform]", !on && "border-line bg-surface hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md")}
              style={on ? { borderColor: c.vivid, background: c.vivid, color: c.on, boxShadow: `0 18px 34px -16px ${c.vivid}` } : undefined}
            >
              <span className="flex size-11 items-center justify-center rounded-2xl" style={on ? { background: "rgb(255 255 255 / 0.28)", color: c.on } : { background: c.vivid, color: c.on }}>
                <Icon aria-hidden className="size-5" strokeWidth={2.4} />
              </span>
              <span className={clsx("text-base font-extrabold leading-tight", !on && "text-ink")}>{u.title[s.lang]}</span>
              <span className={clsx("text-xs font-medium", !on && "text-muted")}>{u.desc[s.lang]}</span>
              {on && (
                <span aria-hidden className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white" style={{ color: c.on === "#FFFFFF" ? c.vivid : c.on }}>
                  <Check className="size-3.5" strokeWidth={3.5} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-6 rounded-[20px] border border-line bg-surface2 p-5 sm:p-6">
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
      <h3 id={id} className="text-lg font-extrabold text-ink">{title}</h3>
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
        <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tv text-white shadow-[0_14px_30px_-12px_var(--tv)]">
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
                    className={clsx("flex min-h-14 items-center justify-center gap-2 rounded-full border-2 text-base font-extrabold transition-all active:scale-95", on ? "bg-cta border-transparent text-white shadow-glow" : "border-line text-ink hover:border-line-strong")}
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
