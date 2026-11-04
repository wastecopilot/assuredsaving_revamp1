"use client";
/**
 * "Get a call from Aria". FULLY MOCKED: no network, no calls, no texts.
 * details -> consent (AI box unchecked, SMS separate) -> verify code -> call now or schedule
 */
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { AlertTriangle, Bot, CalendarClock, CheckCircle2, Clock, Mail, PhoneCall, ShieldCheck, Smartphone, User } from "lucide-react";
import clsx from "clsx";
import { LEGAL, PLANS, SUPPORT } from "@/data/sample";
import { useStore } from "@/lib/store";
import { TIME_ZONES, callingDays, codeOk, emailOk, formatPhone, inCallingHours, onDoNotCallList, phoneError } from "@/lib/schedule";
import { Button, Checkbox, Input, SegmentedControl, Select } from "../ui";
import { Modal } from "../ui/Overlay";
import { useToast } from "../ui/Toast";

type Step = "details" | "consent" | "verify" | "when" | "done" | "dnc";
const FLOW: Step[] = ["details", "consent", "verify", "when"];
const RESEND = 30;

export function CallbackModal() {
  const { s, t, dispatch } = useStore();
  const toast = useToast();
  const open = s.modal.kind === "callback";
  const plan = PLANS.find((p) => p.id === s.modal.planId) ?? null;
  const close = () => dispatch({ type: "patch", patch: { modal: { kind: null, planId: s.modal.planId } } });

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<Record<string, string | null>>({});
  const [ai, setAi] = useState(false);
  const [sms, setSms] = useState(false);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(RESEND);
  const [note, setNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<"now" | "later">("now");
  const [zone, setZone] = useState("America/New_York");
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [slotErr, setSlotErr] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    setStep("details");
    setName((v) => v || s.name);
    setErr({});
    setAi(false);
    setSms(false);
    setCode(Array(6).fill(""));
    setCodeErr(null);
    setMode("now");
    setDay("");
    setSlot("");
    setSlotErr(null);
    setNote(null);
    setZone(s.address?.timeZone ?? "America/New_York");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== "verify" || resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [step, resendIn]);

  const now = useMemo(() => new Date(), [step, zone]); // eslint-disable-line react-hooks/exhaustive-deps
  const days = useMemo(() => callingDays(now, zone, s.lang), [now, zone, s.lang]);
  const activeDay = days.find((d) => d.key === day) ?? days[0];
  const inHours = inCallingHours(now, zone);
  const zoneLabel = TIME_ZONES.find((z) => z.id === zone)?.[s.lang] ?? zone;
  const nextWindow = days[0] ? `${days[0].isToday ? t("cbToday").toLowerCase() : days[0].label} ${t("at")} ${days[0].slots[0].label}` : "";
  const shown = formatPhone(phone);
  const focus = (id: string) => window.setTimeout(() => document.getElementById(id)?.focus(), 20);

  const submitDetails = () => {
    const pe = phoneError(phone);
    const e = { name: name.trim().length < 2 ? t("cbNameErr") : null, email: emailOk(email) ? null : t("cbEmailErr"), phone: pe === "empty" ? t("cbPhoneErr") : pe === "invalid" ? t("cbPhoneBad") : null };
    setErr(e);
    if (e.name) return focus("cb-name");
    if (e.email) return focus("cb-email");
    if (e.phone) return focus("cb-phone");
    setStep("consent");
  };
  const submitConsent = () => {
    if (!ai) {
      setErr({ consent: t("cbConsentErr") });
      return focus("cb-ai");
    }
    if (onDoNotCallList(phone)) return setStep("dnc");
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setResendIn(RESEND);
      setCode(Array(6).fill(""));
      setCodeErr(null);
      setStep("verify");
      focus("cb-d0");
    }, 600);
  };
  const submitCode = () => {
    const v = code.join("");
    if (v.length < 6) {
      setCodeErr(t("cbCodeShort"));
      return focus(`cb-d${code.findIndex((c) => !c)}`);
    }
    if (!codeOk(v)) {
      setCodeErr(t("cbCodeBad"));
      setCode(Array(6).fill(""));
      return focus("cb-d0");
    }
    setStep("when");
  };
  const submitWhen = () => {
    const tz = zoneLabel.replace(/ \(.+\)/, "");
    if (mode === "later") {
      const sl = activeDay?.slots.find((x) => x.key === slot);
      if (!sl || !activeDay) return setSlotErr(t("cbTimeErr"));
      setResult(t("cbDoneLater", { phone: shown, when: `${activeDay.isToday ? t("cbToday").toLowerCase() : activeDay.label} ${t("at")} ${sl.label} (${tz})` }));
    } else {
      setResult(inHours ? t("cbDoneNow", { phone: shown }) : t("cbDoneLater", { phone: shown, when: `${nextWindow} (${tz})` }));
    }
    setStep("done");
    toast({ title: t("toastBooked"), body: t("toastBookedBody") });
  };

  const setDigit = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    setCode((c) => c.map((x, j) => (j === i ? d : x)));
    setCodeErr(null);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const onCodeKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
    if (e.key === "Enter") submitCode();
  };
  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!d) return;
    e.preventDefault();
    setCode(Array.from({ length: 6 }, (_, i) => d[i] ?? ""));
    refs.current[Math.min(d.length, 5)]?.focus();
  };

  const idx = FLOW.indexOf(step);
  const stepLabels = [t("cbStep1"), t("cbStep2"), t("cbStep3"), t("cbStep4")];
  const progress =
    idx >= 0 ? (
      <ol className="mb-3 flex items-center gap-1.5" aria-label={`${idx + 1} / 4`}>
        {FLOW.map((x, i) => (
          <li key={x} className="flex items-center gap-1.5" aria-current={i === idx ? "step" : undefined}>
            <span className={clsx("flex size-6 items-center justify-center rounded-full text-[11px] font-bold", i < idx ? "bg-primary text-white" : i === idx ? "bg-primary-soft text-primary ring-2 ring-primary" : "bg-surface2 text-muted")}>{i + 1}</span>
            <span className={clsx("text-xs font-bold", i === idx ? "text-ink" : "sr-only sm:not-sr-only sm:text-muted")}>{stepLabels[i]}</span>
            {i < 3 && <span aria-hidden className="h-0.5 w-3 rounded bg-line-strong sm:w-5" />}
          </li>
        ))}
      </ol>
    ) : null;

  const titles: Record<Step, string> = { details: t("cbTitle"), consent: t("cbConsentTitle"), verify: t("cbVerifyTitle"), when: t("cbWhenTitle"), done: t("cbDoneTitle"), dnc: t("cbDncTitle") };
  const link = "font-bold text-primary underline underline-offset-2";
  const footers: Record<Step, React.ReactNode> = {
    details: <Button block size="lg" onClick={submitDetails}>{t("continue")}</Button>,
    consent: (
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setStep("details")}>{t("back")}</Button>
        <Button block size="lg" onClick={submitConsent} disabled={sending}>{sending ? "…" : t("cbSendCode")}</Button>
      </div>
    ),
    verify: (
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setStep("consent")}>{t("back")}</Button>
        <Button block size="lg" onClick={submitCode}>{t("cbVerify")}</Button>
      </div>
    ),
    when: (
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setStep("verify")}>{t("back")}</Button>
        <Button block size="lg" onClick={submitWhen} iconLeft={mode === "now" ? <PhoneCall aria-hidden className="size-5" /> : <CalendarClock aria-hidden className="size-5" />}>
          {mode === "now" ? (inHours ? t("cbNow") : t("cbNext")) : t("cbSchedule")}
        </Button>
      </div>
    ),
    done: <Button block size="lg" onClick={close}>{t("done")}</Button>,
    dnc: (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" block onClick={() => setStep("details")}>{t("cbOther")}</Button>
        <a href={SUPPORT.tel} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 font-display font-bold text-white shadow-sm">
          <PhoneCall aria-hidden className="size-4" />
          {t("cbCallUs", { phone: SUPPORT.phone })}
        </a>
      </div>
    ),
  };

  return (
    <Modal
      open={open}
      onClose={close}
      closeLabel={t("close")}
      header={progress}
      title={titles[step]}
      description={
        step === "details" ? (
          <span className="flex items-start gap-2">
            <Bot aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {t("cbAi")}
              {plan && <span className="mt-1 block font-bold text-ink">{t("cbAbout", { plan: `${plan.provider} ${plan.name}` })}</span>}
            </span>
          </span>
        ) : undefined
      }
      footer={footers[step]}
    >
      {step === "details" && (
        <form noValidate className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitDetails(); }}>
          <Input id="cb-name" data-autofocus label={t("cbName")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={err.name} icon={<User aria-hidden className="size-5" />} />
          <Input id="cb-email" type="email" label={t("cbEmail")} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} hint={t("cbEmailHint")} icon={<Mail aria-hidden className="size-5" />} />
          <Input id="cb-phone" type="tel" inputMode="tel" label={t("cbPhone")} autoComplete="tel-national" placeholder="(555) 201-4477" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} error={err.phone} hint={t("cbPhoneHint")} icon={<Smartphone aria-hidden className="size-5" />} />
          <button type="submit" hidden />
          <p className="rounded-2xl bg-phone-soft px-3 py-2 text-xs font-medium text-ink">{t("cbDemoHints")}</p>
        </form>
      )}

      {step === "consent" && (
        <div className="space-y-4">
          <p className="flex gap-2 rounded-2xl bg-surface2 p-4 text-sm text-ink">
            <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-security-text" />
            {t("cbConsentWhat", { phone: shown })}
          </p>
          <Checkbox id="cb-ai" checked={ai} onChange={(v) => { setAi(v); setErr({}); }} error={err.consent}>
            {t("cbAiConsent")} <strong>{t("cbRequired")}</strong>
          </Checkbox>
          <Checkbox id="cb-sms" checked={sms} onChange={setSms} hint={t("cbSmsDesc")}>
            {t("cbSms")} <span className="text-muted">({t("cbOptional")})</span>
          </Checkbox>
          <div className="space-y-2 border-t border-line pt-4 text-xs text-muted">
            <p><strong className="text-ink">{t("cbNotCondition")}</strong> {t("cbNotConditionMore")}</p>
            <p>{t("cbOptOut")}</p>
            <p>
              {t("cbReadOur")} <a className={link} href={LEGAL.terms} target="_blank" rel="noreferrer">{t("cbTerms")}</a>,{" "}
              <a className={link} href={LEGAL.privacy} target="_blank" rel="noreferrer">{t("cbPrivacy")}</a> {t("cbAnd")}{" "}
              <a className={link} href={LEGAL.sms} target="_blank" rel="noreferrer">{t("cbSmsTerms")}</a>.
            </p>
          </div>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-5">
          <p className="text-sm text-ink">{t("cbCodeSent", { phone: shown })}</p>
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-ink">{t("cbCode")}</legend>
            <div className="grid grid-cols-6 gap-2" onPaste={onPaste}>
              {code.map((d, i) => (
                <input
                  key={i}
                  id={`cb-d${i}`}
                  ref={(el) => { refs.current[i] = el; }}
                  aria-label={t("cbDigit", { n: i + 1 })}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onCodeKey(i, e)}
                  aria-invalid={codeErr ? true : undefined}
                  aria-describedby={codeErr ? "cb-code-err" : undefined}
                  className={clsx("h-14 w-full min-w-0 rounded-2xl border bg-surface text-center text-2xl font-extrabold text-ink focus:border-primary focus:outline-none", codeErr ? "border-danger" : "border-line-strong")}
                />
              ))}
            </div>
            {codeErr && <p id="cb-code-err" role="alert" className="mt-2 text-sm font-medium text-danger">{codeErr}</p>}
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            {resendIn > 0 ? (
              <p className="text-muted" aria-live="polite">{t("cbResendIn", { s: `0:${String(resendIn).padStart(2, "0")}` })}</p>
            ) : (
              <button type="button" className="min-h-11 font-bold text-primary" onClick={() => { setResendIn(RESEND); setNote(t("cbResent")); }}>{t("cbResend")}</button>
            )}
            <button type="button" className="min-h-11 font-bold text-ink underline underline-offset-2" onClick={() => setStep("details")}>{t("cbWrong")}</button>
          </div>
          {note && <p role="status" className="text-sm font-bold text-success">{note}</p>}
        </div>
      )}

      {step === "when" && (
        <div className="space-y-5">
          <SegmentedControl
            label={t("cbWhenTitle")}
            value={mode}
            onChange={(v) => { setMode(v); setSlotErr(null); }}
            className="w-full"
            options={[
              { value: "now", label: t("cbNow"), icon: <PhoneCall aria-hidden className="size-4" /> },
              { value: "later", label: t("cbLater"), icon: <CalendarClock aria-hidden className="size-4" /> },
            ]}
          />
          <Select label={t("cbTz")} value={zone} onChange={(e) => { setZone(e.target.value); setDay(""); setSlot(""); }} options={TIME_ZONES.map((z) => ({ value: z.id, label: z[s.lang] }))} />
          <p className="flex gap-2 rounded-2xl bg-surface2 p-3 text-sm text-ink">
            <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {t("cbHours")}
          </p>
          {mode === "now" ? (
            <p className={clsx("rounded-2xl p-4 text-sm font-bold text-ink", inHours ? "bg-security-soft" : "bg-phone-soft")}>{inHours ? t("cbNowOk") : t("cbNowLater", { when: nextWindow })}</p>
          ) : (
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-ink">{t("cbDay")}</legend>
                <div className="flex flex-wrap gap-2">
                  {days.map((d) => (
                    <button key={d.key} type="button" aria-pressed={activeDay?.key === d.key} onClick={() => { setDay(d.key); setSlot(""); }} className={clsx("min-h-11 rounded-full border px-4 text-sm font-bold transition-colors", activeDay?.key === d.key ? "border-primary bg-primary-soft text-primary" : "border-line text-ink hover:border-line-strong")}>
                      {d.isToday ? t("cbToday") : d.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {activeDay && (
                <fieldset>
                  <legend className="mb-2 text-sm font-bold text-ink">{t("cbTime")} · {zoneLabel}</legend>
                  <div role="radiogroup" aria-label={t("cbTime")} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {activeDay.slots.map((x) => (
                      <button key={x.key} type="button" role="radio" aria-checked={slot === x.key} onClick={() => { setSlot(x.key); setSlotErr(null); }} className={clsx("min-h-11 rounded-2xl border text-sm font-bold tabular transition-colors", slot === x.key ? "border-transparent bg-brand text-white" : "border-line text-ink hover:border-line-strong")}>
                        {x.label}
                      </button>
                    ))}
                  </div>
                  {slotErr && <p role="alert" className="mt-2 text-sm font-medium text-danger">{slotErr}</p>}
                </fieldset>
              )}
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="py-2 text-center">
          <CheckCircle2 aria-hidden className="mx-auto size-14 text-security" />
          <p className="mt-4 text-xl font-extrabold text-ink">{result}</p>
          <p className="mt-2 text-sm text-muted">{t("cbDoneBody")}</p>
          <p className="mt-4 rounded-2xl bg-surface2 px-3 py-2 text-xs text-muted">{t("cbDemo")}</p>
        </div>
      )}

      {step === "dnc" && (
        <div className="space-y-4">
          <p className="flex gap-3 rounded-2xl border border-phone bg-phone-soft p-4 text-sm text-ink">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-phone-text" />
            {t("cbDncBody", { phone: shown })}
          </p>
          <p className="text-sm text-ink">{t("cbDncHelp", { support: SUPPORT.phone, hours: SUPPORT.hours[s.lang] })}</p>
        </div>
      )}
    </Modal>
  );
}
