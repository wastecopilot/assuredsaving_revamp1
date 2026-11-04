"use client";
/**
 * Design-system components:
 * Button, Input, Select, Checkbox, SegmentedControl, Badge, Chip, Slider, Skeleton, EmptyState.
 * Overlays (Modal, Drawer) live in Overlay.tsx and Toast in Toast.tsx.
 */
import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type SelectHTMLAttributes } from "react";
import { AlertCircle, Check, ChevronDown, Home, Phone, SearchX, Shield, Smartphone, Tv, Wifi, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { ServiceId } from "@/data/catalog";
import { service } from "@/lib/tokens";

export const SERVICE_ICON: Record<ServiceId, LucideIcon> = { internet: Wifi, tv: Tv, mobile: Smartphone, security: Shield, phone: Phone };
export { Home };

/* -------------------------------- Button -------------------------------- */
type Variant = "primary" | "secondary" | "ghost" | "soft";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, iconLeft, iconRight, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold transition-[transform,box-shadow,background-color,border-color,color] duration-150",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        size === "lg" ? "min-h-[52px] whitespace-nowrap px-7 text-base" : "min-h-11 whitespace-nowrap px-5 text-sm",
        variant === "primary" && "bg-cta text-white shadow-glow hover:brightness-110",
        variant === "secondary" && "border-2 border-line-strong bg-surface text-ink hover:border-primary hover:text-primary",
        variant === "soft" && "bg-primary-soft text-primary hover:bg-[#e2d9ff]",
        variant === "ghost" && "text-ink hover:bg-surface2",
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
});

/* --------------------------------- Input -------------------------------- */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
  icon?: ReactNode;
  trailing?: ReactNode;
  hideLabel?: boolean;
}
const field = "min-h-[52px] w-full rounded-2xl border-2 bg-surface2 px-4 text-base text-ink transition-[border-color,box-shadow,background-color] placeholder:text-muted hover:border-[#aeb2cf] focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/15";
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, icon, trailing, hideLabel, id, className, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className={clsx("mb-2 block text-sm font-semibold text-ink", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
          className={clsx(field, icon && "pl-12", trailing && "pr-14", error ? "border-danger" : "border-line-strong")}
          {...rest}
        />
        {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error ? (
        <p id={`${fid}-err`} role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="mt-2 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/* -------------------------------- Select -------------------------------- */
export function Select({ label, options, className, id, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={sid} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <select id={sid} className={clsx(field, "cursor-pointer appearance-none border-line-strong pr-11")} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}

/* ------------------------------- Checkbox ------------------------------- */
export function Checkbox({ id, checked, onChange, children, hint, error }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode; hint?: string; error?: string | null }) {
  return (
    <div>
      <label
        htmlFor={id}
        className={clsx(
          "flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors",
          checked ? "border-primary bg-primary-soft/50" : error ? "border-danger" : "border-line hover:border-line-strong",
        )}
      >
        <span className="relative mt-0.5 flex size-6 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={[hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined}
            className="peer size-5 cursor-pointer appearance-none rounded-[6px] border-2 border-line-strong bg-surface transition-colors checked:border-primary checked:bg-primary"
          />
          <Check aria-hidden strokeWidth={3.5} className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="text-sm leading-relaxed text-ink">
          {children}
          {hint && (
            <span id={`${id}-hint`} className="mt-1 block text-xs text-muted">
              {hint}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* --------------------------- SegmentedControl --------------------------- */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + options.length) % options.length;
    onChange(options[n].value);
    (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={clsx("inline-flex rounded-full border border-line bg-surface2 p-1", className)}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={clsx(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-all duration-200",
              on ? "bg-cta text-white shadow-glow" : "text-muted hover:text-ink",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Badge -------------------------------- */
export function Badge({ children, bg, fg, className, icon }: { children: ReactNode; bg: string; fg: string; className?: string; icon?: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", className)} style={{ background: bg, color: fg }}>
      {icon}
      {children}
    </span>
  );
}

/* --------------------------------- Chip --------------------------------- */
export function Chip({ selected, onClick, children, color, role }: { selected: boolean; onClick: () => void; children: ReactNode; color?: ServiceId; role?: "radio" }) {
  const c = color ? service[color] : null;
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      onClick={onClick}
      className={clsx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold transition-all duration-150 active:scale-[0.98]",
        !selected && "border-line-strong bg-surface text-ink hover:border-primary/50",
        selected && !c && "border-primary bg-primary-soft text-primary",
      )}
      style={selected && c ? { borderColor: c.vivid, background: c.soft, color: c.text } : undefined}
    >
      {selected && <Check aria-hidden className="size-4" strokeWidth={3} />}
      {children}
    </button>
  );
}

/* -------------------------------- Slider -------------------------------- */
export function Slider({ label, value, min, max, onChange, display, minLabel, maxLabel, from, to }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; display?: string; minLabel?: string; maxLabel?: string; from?: string; to?: string }) {
  const id = useId();
  const pct = max === min ? 100 : ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <span aria-hidden className="text-grad text-3xl font-extrabold tabular">
          {display ?? value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuetext={display ?? String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-1"
        style={{ ["--pct" as string]: `${pct}%`, ["--from" as string]: from, ["--to" as string]: to }}
      />
      {(minLabel || maxLabel) && (
        <div aria-hidden className="flex justify-between text-xs font-semibold text-muted">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Skeleton ------------------------------- */
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={clsx("skeleton rounded-md", className)} />;

/* ------------------------------ EmptyState ------------------------------ */
export function EmptyState({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[28px] border-2 border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <SearchX aria-hidden className="size-7" />
      </span>
      <h3 className="mt-4 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-base text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
