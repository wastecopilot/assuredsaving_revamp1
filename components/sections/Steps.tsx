"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Briefcase, Building2, Check, CircleCheck, CloudUpload, Gamepad2, Globe, Home, Laptop, MapPin, MonitorPlay, Search, Smartphone, User, Video, Wifi, WifiOff } from "lucide-react";
import clsx from "clsx";
import { DEVICES, GENRES, PACKS, USAGE, type SampleAddress, type ServiceId } from "@/data/catalog";
import { formatAddress as fmt, getAddressSuggestions } from "@/lib/address";
import { businessAllows } from "@/lib/selection";
import { cleanText, nameOk } from "@/lib/schedule";
import { STAGE, nextStage, useStore, type State } from "@/lib/store";
import { motion as m, service } from "@/lib/tokens";
import { Button, Chip, Slider, fieldClass } from "../ui";
import { Heading, Section } from "./Section";

/* ============================== Name & address ============================== */
/**
 * Same flow as the official site:
 * 1. Name first. The address search appears once the name is valid.
 * 2. Suggestions open as the visitor types (a street number is needed).
 * 3. Choosing a suggestion verifies it and detects home or business.
 * 4. Business addresses only offer Internet or Internet + TV Bundle.
 * 5. Editing or clearing the address collapses everything below it.
 */
export function AddressSection() {
  const { s, dispatch, t, goNext } = useStore();
  const [q, setQ] = useState(s.address ? fmt(s.address) : "");
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  const nameValid = nameOk(s.name);
  const verified = !!s.address && fmt(s.address) === q;
  const matches = verified ? [] : getAddressSuggestions(q);
  const open = q.trim().length > 0 && !dismissed && matches.length > 0;
  const noMatch = q.trim().length > 0 && !verified && matches.length === 0;
  const needsBusinessChoice = verified && s.address?.type === "business" && !businessAllows(s.services);

  useEffect(() => {
    const onDown = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setDismissed(true);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const collapse = () => dispatch({ type: "patch", patch: { address: null, stage: Math.min(s.stage, STAGE.address), scanDone: false, usage: [] } });

  const choose = (a: SampleAddress) => {
    setQ(fmt(a));
    setDismissed(true);
    setActive(-1);
    dispatch({ type: "patch", patch: { address: a, addressType: a.type, usage: [] } });
    if (a.type === "business" && !businessAllows(s.services)) return; // wait for the business choice
    goNext(STAGE.address);
  };
  const chooseBusiness = (services: ServiceId[]) => {
    dispatch({ type: "setServices", s: services });
    goNext(STAGE.address, { services });
  };
  const clear = () => {
    setQ("");
    setDismissed(false);
    setActive(-1);
    collapse();
    window.setTimeout(() => document.getElementById("addr")?.focus(), 20);
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
    <Section stage="address">
      <Heading id="section-address-h" a={t("nameTitle")} />
      <div className="mt-5 max-w-xl">
        <div className="relative">
          <User aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            aria-label={t("namePlaceholder")}
            placeholder={t("namePlaceholder")}
            autoComplete="name"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            maxLength={80}
            value={s.name}
            onChange={(e) => dispatch({ type: "patch", patch: { name: e.target.value } })}
            className={clsx(fieldClass, "border-line-strong pl-11 pr-12")}
          />
          {nameValid && <CircleCheck aria-hidden className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-success" />}
        </div>
        {nameValid && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">{t("welcome", { name: cleanText(s.name).split(" ")[0] })}</p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {nameValid && (
          <motion.div key="addr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={m.soft} className="mt-8 border-t border-line pt-8">
            <Heading id="addr-h" eyebrow={t("nowYourAddress")} a={t("addrTitle1")} b={t("addrTitle2")} sub={t("addrSubtitle")} />
            <div ref={wrap} className="relative mt-5 max-w-xl">
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
                <input
                  id="addr"
                  role="combobox"
                  aria-label={t("addrSearchLabel")}
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                  aria-invalid={noMatch || undefined}
                  aria-describedby={noMatch ? "addr-err" : undefined}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={120}
                  placeholder={t("addrPlaceholder")}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setDismissed(false);
                    setActive(-1);
                    if (s.address) collapse();
                  }}
                  onFocus={(e) => {
                    setDismissed(false);
                    if (window.innerWidth < 640) {
                      const el = e.currentTarget;
                      window.setTimeout(() => el.scrollIntoView({ block: "start", behavior: "smooth" }), 150);
                    }
                  }}
                  onKeyDown={onKey}
                  className={clsx(fieldClass, "pl-11", noMatch ? "border-danger" : "border-line-strong")}
                />
              </div>
              <ul id={listId} role="listbox" aria-label={t("addrSearchLabel")} hidden={!open} className="mt-1.5 max-h-80 overflow-auto rounded-md border border-line bg-surface py-1 shadow-lg">
                {matches.map((a, i) => (
                  <li
                    key={a.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => active !== i && setActive(i)}
                    onClick={() => choose(a)}
                    className={clsx("flex min-h-12 cursor-pointer items-center gap-3 px-3.5 py-2", i === active && "bg-surface2")}
                  >
                    <MapPin aria-hidden className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold text-ink">{a.line1}</span>
                      <span className="text-muted">
                        , {a.city}, {a.state} {a.zip}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {noMatch && (
                <p id="addr-err" role="status" className="mt-1.5 text-sm text-danger">
                  {t("usError")}
                </p>
              )}
            </div>
            <div aria-live="polite">
              {s.address && verified && <FoundCard onChange={clear} />}
              {/* Came back here with a verified address: let the visitor carry on */}
              {s.address && verified && !needsBusinessChoice && s.stage === STAGE.address && (
                <Button size="lg" className="mt-5 w-full sm:w-auto sm:min-w-48" onClick={() => goNext(STAGE.address)} iconRight={<ArrowRight aria-hidden className="size-5" />}>
                  {t("continue")}
                </Button>
              )}
              {needsBusinessChoice && (
                <div role="group" aria-label={t("businessOnlyTitle")} className="mt-4 max-w-xl rounded-lg border border-warning bg-warning-soft p-4">
                  <p className="font-semibold text-ink">{t("businessOnlyTitle")}</p>
                  <p className="mt-1 text-sm text-ink">{t("businessOnlyBody")}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" onClick={() => chooseBusiness(["internet"])} iconLeft={<Wifi aria-hidden className="size-4" />}>
                      {t("businessOptionInternet")}
                    </Button>
                    <Button variant="secondary" onClick={() => chooseBusiness(["internet", "tv"])} iconLeft={<MonitorPlay aria-hidden className="size-4" />}>
                      {t("businessOptionBundle")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

function FoundCard({ onChange }: { onChange: () => void }) {
  const { s, t } = useStore();
  const a = s.address!;
  const biz = a.type === "business";
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={m.soft} className="mt-4 max-w-xl rounded-lg border border-line bg-surface2">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-success-soft text-success">
          <Check aria-hidden className="size-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-sm font-semibold text-success">{t("addressFound")}</p>
          <p className="mt-0.5 line-clamp-2 font-semibold text-ink" title={a.line1}>
            {a.line1}
          </p>
          <p className="text-sm text-muted">
            {a.city}, {a.state} {a.zip}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-surface px-2 py-1 text-xs font-semibold text-ink ring-1 ring-line max-sm:ml-[52px]">
          {biz ? <Building2 aria-hidden className="size-3.5" /> : <Home aria-hidden className="size-3.5" />}
          {t(biz ? "businessAddress" : "homeAddress")}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2">
        <span className="text-xs text-muted">{t("verified")}</span>
        <button type="button" onClick={onChange} className="min-h-11 rounded-md px-2 text-sm font-semibold text-primary hover:underline">
          <span aria-hidden>← </span>
          {t("tryDifferentAddress")}
        </button>
      </div>
    </motion.div>
  );
}

/* ================================== Usage ================================== */
const USAGE_ICON: Record<string, typeof Briefcase> = { office: Briefcase, streaming: Video, data: CloudUpload, basic: Globe, casual: Smartphone, remote: Laptop, "4k": MonitorPlay, gaming: Gamepad2 };
const USAGE_COLOR: ServiceId[] = ["internet", "phone", "tv", "security"];

export function UsageSection() {
  const { s, dispatch, t, goNext } = useStore();
  const toTv = nextStage(s, STAGE.usage) === STAGE.tv;
  const ready = s.usage.length > 0;
  return (
    <Section stage="usage">
      <Heading id="section-usage-h" a={t("usageTitle")} b={t("usageTitleHighlight")} after="?" sub={t("selectAll")} />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {USAGE[s.addressType].map((u, i) => {
          const on = s.usage.includes(u.id);
          const c = service[USAGE_COLOR[i]];
          const Icon = USAGE_ICON[u.id] ?? Globe;
          return (
            <button
              key={u.id}
              type="button"
              aria-pressed={on}
              onClick={() => dispatch({ type: "patch", patch: { usage: on ? s.usage.filter((x) => x !== u.id) : [...s.usage, u.id] } })}
              className={clsx("press relative flex min-h-32 flex-col items-start gap-2 rounded-lg border p-4 text-left", !on && "border-line-strong bg-surface hover:bg-surface2")}
              style={on ? { borderColor: c.vivid, background: c.vivid, color: c.on } : undefined}
            >
              <span className="flex size-9 items-center justify-center rounded-md" style={on ? { background: "rgb(255 255 255 / 0.22)" } : { background: c.soft, color: c.text }}>
                <Icon aria-hidden className="size-5" />
              </span>
              <span className={clsx("mt-1 font-bold leading-tight", !on && "text-ink")}>{t(u.title)}</span>
              <span className={clsx("text-sm", !on && "text-muted")}>{t(u.desc)}</span>
              {on && (
                <span aria-hidden className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-white" style={{ color: c.on === "#FFFFFF" ? c.vivid : c.on }}>
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-6 rounded-lg border border-line p-5">
        <Slider
          label={t("devices")}
          min={DEVICES.min}
          max={DEVICES.max}
          value={s.devices}
          onChange={(v) => dispatch({ type: "patch", patch: { devices: v } })}
          display={s.devices >= DEVICES.max ? t("hundredPlus") : String(s.devices)}
          minLabel={String(DEVICES.min)}
          maxLabel={t("hundredPlus")}
        />
      </div>
      <div className="mt-6">
        <Button size="lg" disabled={!ready} onClick={() => goNext(STAGE.usage)} iconRight={ready ? <ArrowRight aria-hidden className="size-5" /> : undefined} className="w-full sm:w-auto sm:min-w-64">
          {!ready ? t("usageCtaWaiting") : toTv ? t("usageCtaTv") : t("usageCta")}
        </Button>
      </div>
    </Section>
  );
}

/* ================================= TV needs ================================= */
function Group({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6">
      <h3 id={id} className="text-base font-bold text-ink">
        {title}
      </h3>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function TvSection() {
  const { s, dispatch, t, goNext } = useStore();
  const set = (patch: Partial<State>) => dispatch({ type: "patch", patch });
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const bundle = s.services.includes("internet");
  const ready = s.hasInternet !== null;
  const nonSmart = s.tvs - Math.min(s.smartTvs, s.tvs);
  return (
    <Section stage="tv">
      <Heading id="section-tv-h" a={t("tvTitlePrefix")} b={t(bundle ? "tvTitleBundle" : "tvTitleTv")} sub={t("tvSubtitle")} />
      <div className="mt-6 space-y-6">
        <Group id="g-watch" title={t("watchMost")}>
          <div role="group" aria-labelledby="g-watch" className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Chip key={g.id} color="tv" selected={s.genres.includes(g.id)} onClick={() => set({ genres: toggle(s.genres, g.id) })}>
                {t(g.label)}
              </Chip>
            ))}
          </div>
        </Group>
        <Group id="g-intl" title={t("international")} hint={t("internationalHint")}>
          <div role="group" aria-labelledby="g-intl" className="flex flex-wrap gap-2">
            {PACKS.map((g) => (
              <Chip key={g.id} color="phone" selected={s.intl.includes(g.id)} onClick={() => set({ intl: toggle(s.intl, g.id) })}>
                {t(g.label)}
              </Chip>
            ))}
          </div>
        </Group>
        <Group id="g-tvs" title={t("yourTvs")}>
          <div className="grid gap-6 sm:grid-cols-2">
            <Slider label={t("howManyTvs")} min={1} max={10} value={s.tvs} onChange={(v) => set({ tvs: v, smartTvs: Math.min(s.smartTvs, v) })} minLabel="1" maxLabel="10" fill={service.tv.vivid} />
            <Slider label={t("howManySmart")} min={0} max={s.tvs} value={Math.min(s.smartTvs, s.tvs)} onChange={(v) => set({ smartTvs: v })} minLabel="0" maxLabel={String(s.tvs)} fill={service.tv.vivid} />
          </div>
          {nonSmart > 0 && <p className="mt-3 text-sm text-muted">{t(nonSmart === 1 ? "nonSmartOne" : "nonSmartMany", { n: nonSmart })}</p>}
        </Group>
        <Group id="g-net" title={t(bundle ? "haveInternetBundle" : "haveInternet")} hint={bundle ? t("bundleInternetNote") : undefined}>
          <div role="radiogroup" aria-labelledby="g-net" className="grid grid-cols-2 gap-3 sm:max-w-sm">
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
                  className={clsx("press flex min-h-12 items-center justify-center gap-2 rounded-md border text-base font-semibold", on ? "border-primary bg-primary text-white" : "border-line-strong text-ink hover:bg-surface2")}
                >
                  <Icon aria-hidden className="size-5" />
                  {t(v ? "yes" : "no")}
                </button>
              );
            })}
          </div>
        </Group>
      </div>
      <div className="mt-8">
        <Button size="lg" disabled={!ready} onClick={() => goNext(STAGE.tv)} iconRight={ready ? <ArrowRight aria-hidden className="size-5" /> : undefined} className="w-full sm:w-auto sm:min-w-64">
          {!ready ? t("answerToContinue") : t(bundle ? "ctaBundle" : "ctaTv")}
        </Button>
      </div>
    </Section>
  );
}
