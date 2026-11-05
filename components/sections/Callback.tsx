"use client";
/**
 * "Schedule AI Callback": one form, like the official site. Email, mobile phone
 * verified with a 6-digit code, call consent (required) and SMS consent
 * (optional), time zone and preferred time, then "Call Me Now" or "Schedule Callback".
 *
 * MOCKED: nothing is sent and no call or text is placed. Demo rules live in lib/schedule.ts.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, CircleCheck, Info, PhoneCall } from "lucide-react";
import { PLANS, siteUrl } from "@/data/sample";
import { TIME_ZONES, callingDays, codeOk, digits, emailOk, formatPhone, inCallingHours, nationalDigits, onDoNotCallList, phoneError, safeZone } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { Button, Checkbox, Input, Select } from "../ui";
import { Modal } from "../ui/Overlay";

type Otp = "idle" | "sending" | "sent" | "verifying" | "verified";
/** Seconds before a code can be re-sent to the same number. */
export const RESEND = 30;
/** Codes per number per visit, and wrong codes per code, before we stop. */
export const MAX_SENDS = 3;
export const MAX_TRIES = 5;

export function CallbackModal() {
  const { s, t, dispatch } = useStore();
  const lang = s.lang;
  const plan = s.modal.planId ? PLANS.find((p) => p.id === s.modal.planId) : undefined;
  const close = () => dispatch({ type: "patch", patch: { modal: { kind: null, planId: s.modal.planId } } });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<Otp>("idle");
  const [verifiedFor, setVerifiedFor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [tries, setTries] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [call, setCall] = useState(false);
  const [sms, setSms] = useState(false);
  const [zone, setZone] = useState(() => safeZone(s.address?.timeZone));
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [err, setErr] = useState<Partial<Record<"email" | "phone" | "code" | "consent" | "form", string>>>({});
  const [done, setDone] = useState(false);

  /** Each async step is tied to the request and number it was started for (no races). */
  const req = useRef(0);
  const phoneNow = useRef("");
  phoneNow.current = nationalDigits(phone);
  /** Per number: when the last code was sent and how many were sent this visit. */
  const sent = useRef(new Map<string, { at: number; count: number }>());

  const days = useMemo(() => callingDays(new Date(now), zone, lang), [zone, lang, now]);
  const chosenDay = days.find((d) => d.key === day) ?? days[0];
  const busy = otp === "sending" || otp === "verifying";
  const record = sent.current.get(phoneNow.current);
  const cooldown = record ? Math.max(0, RESEND - Math.floor((now - record.at) / 1000)) : 0;
  const capped = !!record && record.count >= MAX_SENDS;

  // Clock for the resend countdown and for keeping time slots current
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const changePhone = (v: string) => {
    req.current++; // cancels any pending send or verify
    setPhone(formatPhone(v));
    setOtp("idle");
    setCode("");
    setTries(0);
    if (verifiedFor) {
      // consent was given for "the number above": ask again for a new number
      setVerifiedFor(null);
      setCall(false);
      setSms(false);
    }
  };

  const sendCode = () => {
    const forPhone = phoneNow.current;
    if (phoneError(phone)) return setErr((e) => ({ ...e, phone: t("cbErrInvalidPhone") }));
    if (onDoNotCallList(phone)) return setErr((e) => ({ ...e, phone: t("cbDnc") }));
    const r = sent.current.get(forPhone);
    if (r && r.count >= MAX_SENDS) return setErr((e) => ({ ...e, phone: t("cbErrRateLimited") }));
    if (r && Date.now() - r.at < RESEND * 1000) return;
    sent.current.set(forPhone, { at: Date.now(), count: (r?.count ?? 0) + 1 });
    setErr((e) => ({ ...e, phone: undefined, code: undefined }));
    setTries(0);
    setCode("");
    setOtp("sending");
    const id = ++req.current;
    window.setTimeout(() => {
      if (req.current === id && phoneNow.current === forPhone) setOtp("sent");
    }, 600);
  };

  const confirm = () => {
    const forPhone = phoneNow.current;
    if (tries >= MAX_TRIES) return setErr((e) => ({ ...e, code: t("cbErrTooMany") }));
    if (!/^\d{6}$/.test(code) || !codeOk(code)) {
      const n = tries + 1;
      setTries(n);
      return setErr((e) => ({ ...e, code: t(n >= MAX_TRIES ? "cbErrTooMany" : "cbErrInvalidCode") }));
    }
    setErr((e) => ({ ...e, code: undefined }));
    setOtp("verifying");
    const id = ++req.current;
    window.setTimeout(() => {
      if (req.current !== id || phoneNow.current !== forPhone) return;
      setVerifiedFor(forPhone);
      setOtp("verified");
    }, 500);
  };

  const submit = (mode: "now" | "later") => {
    const next: typeof err = {};
    const at = new Date();
    if (!emailOk(email)) next.email = t("cbEmailErr");
    if (phoneError(phone)) next.phone = t("cbPhoneErr");
    else if (onDoNotCallList(phone)) next.phone = t("cbDnc");
    else if (otp !== "verified" || verifiedFor !== phoneNow.current) next.form = t("cbVerifyRequired");
    if (!call) next.consent = t(mode === "now" ? "cbConsentErrNow" : "cbConsentErrSchedule");
    if (mode === "now" && !inCallingHours(at, zone)) next.form = t("cbCompleteFirst");
    if (mode === "later") {
      const fresh = callingDays(at, zone, lang).find((d) => d.key === (chosenDay?.key ?? ""));
      if (!slot || !fresh?.slots.some((x) => x.key === slot)) next.form = t("cbCompleteFirst");
    }
    setErr(next);
    if (Object.keys(next).length) return;
    setDone(true);
  };

  const link = "font-semibold text-primary underline underline-offset-2";
  const tzOptions = TIME_ZONES.map((z) => ({ value: z.id, label: new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", { timeZone: z.id, timeZoneName: "long" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value ?? z.id }));

  return (
    <Modal
      open
      onClose={close}
      closeLabel={t("close")}
      title={done ? t("cbDoneTitle") : t("cbTitle")}
      description={!done && plan ? t("cbDesc", { plan: `${plan.provider} ${plan.name}` }) : undefined}
      footer={
        done ? (
          <Button block onClick={close}>
            {t("close")}
          </Button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button size="lg" className="sm:flex-1" iconLeft={<PhoneCall aria-hidden className="size-5" />} onClick={() => submit("now")}>
              {t("cbCallNow")}
            </Button>
            <span className="text-center text-sm text-muted">{t("cbOrSchedule")}</span>
            <Button size="lg" variant="secondary" className="sm:flex-1" iconLeft={<CalendarClock aria-hidden className="size-5" />} onClick={() => submit("later")}>
              {t("cbSchedule")}
            </Button>
          </div>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-center py-4 text-center">
          <CircleCheck aria-hidden className="size-12 text-success" />
          {plan && <p className="mt-3 text-base text-ink">{t("cbDoneDesc", { provider: plan.provider })}</p>}
          <p className="mt-3 text-sm text-muted">{t("cbAria")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="flex gap-2.5 rounded-md border border-line bg-surface2 p-3 text-sm text-ink">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {t("cbAria")}
          </p>

          <Input id="cb-email" label={t("cbEmail")} type="email" inputMode="email" autoComplete="email" spellCheck={false} maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} />

          <div>
            <Input
              id="cb-phone"
              label={t("cbPhone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              maxLength={20}
              value={phone}
              readOnly={busy || otp === "verified"}
              aria-busy={busy || undefined}
              onChange={(e) => changePhone(e.target.value)}
              error={err.phone}
              trailing={
                otp === "verified" ? (
                  <span className="text-sm font-semibold text-success">{t("cbVerified")}</span>
                ) : otp === "idle" || otp === "sending" ? (
                  <Button variant="soft" className="min-h-9 px-3" disabled={otp === "sending" || digits(phone).length < 10 || cooldown > 0 || capped} onClick={sendCode}>
                    {otp === "sending" ? t("cbSending") : cooldown > 0 ? t("cbResendIn", { sec: cooldown }) : t("cbSendCode")}
                  </Button>
                ) : null
              }
            />
            {otp === "idle" && capped && <p className="mt-1.5 text-sm text-danger">{t("cbErrRateLimited")}</p>}
            {otp === "verified" && (
              <button type="button" className={`${link} min-h-11 text-sm`} onClick={() => changePhone(phone)}>
                {t("cbChangeNumber")}
              </button>
            )}
            {(otp === "sent" || otp === "verifying") && (
              <div className="mt-3 rounded-md border border-line p-3">
                <p className="text-sm text-muted">{t("cbSentTo", { phone })}</p>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="cb-code"
                    className="flex-1"
                    label={t("cbCodeLabel")}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(digits(e.target.value).slice(0, 6))}
                    error={err.code}
                  />
                  <Button className="mt-7 shrink-0" disabled={otp === "verifying" || tries >= MAX_TRIES} onClick={confirm}>
                    {otp === "verifying" ? t("cbVerifying") : t("cbConfirm")}
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 text-sm">
                  {cooldown > 0 ? (
                    <span className="inline-flex min-h-11 items-center text-muted">{t("cbResendIn", { sec: cooldown })}</span>
                  ) : capped ? (
                    <span className="inline-flex min-h-11 items-center text-danger">{t("cbErrRateLimited")}</span>
                  ) : (
                    <button type="button" className={`${link} min-h-11`} disabled={busy} onClick={sendCode}>
                      {t("cbResend")}
                    </button>
                  )}
                  <button type="button" className={`${link} min-h-11 disabled:opacity-50`} disabled={busy} onClick={() => changePhone(phone)}>
                    {t("cbChangeNumber")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <Checkbox id="cb-call" checked={call} onChange={setCall} error={err.consent}>
            {t("cbConsentCall")}
          </Checkbox>
          <Checkbox id="cb-sms" checked={sms} onChange={setSms}>
            <span className="font-semibold">{t("cbOptional")}</span> {t("cbConsentSms")}
          </Checkbox>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t("cbTimezone")} value={zone} onChange={(e) => { setZone(safeZone(e.target.value)); setDay(""); setSlot(""); }} options={tzOptions} className="sm:col-span-2" />
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-sm font-medium text-ink">{t("cbPreferredTime")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <select aria-label={t("cbPreferredTime")} value={chosenDay?.key ?? ""} onChange={(e) => { setDay(e.target.value); setSlot(""); }} className="min-h-12 rounded-md border border-line-strong bg-surface px-3.5 text-base text-ink">
                  {days.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <select aria-label={t("cbPreferredTime")} value={slot} onChange={(e) => setSlot(e.target.value)} className="min-h-12 rounded-md border border-line-strong bg-surface px-3.5 text-base text-ink">
                  <option value="">--:--</option>
                  {chosenDay?.slots.map((x) => (
                    <option key={x.key} value={x.key}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
          </div>

          {err.form && (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {err.form}
            </p>
          )}

          <p className="text-xs leading-relaxed text-muted">
            {t("cbAgreeA")}{" "}
            <a className={link} href={siteUrl("terms-of-use", lang)} target="_blank" rel="noopener noreferrer">
              {t("nav_terms")}
            </a>{" "}
            {t("cbAgreeB")}{" "}
            <a className={link} href={siteUrl("privacy-policy", lang)} target="_blank" rel="noopener noreferrer">
              {t("nav_privacy")}
            </a>
            .
          </p>
        </div>
      )}
    </Modal>
  );
}
