"use client";
/**
 * Design-system components: Button, Input, Select, Checkbox, SegmentedControl,
 * Badge, Chip, Slider, EmptyState. Flat colours, 8px radius, 44px minimum targets.
 * Overlays live in Overlay.tsx and Toast in Toast.tsx.
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
        "press inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold",
        "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface2 disabled:text-muted disabled:shadow-none",
        size === "lg" ? "min-h-12 px-6 text-base" : "min-h-11 px-4 text-sm",
        variant === "primary" && "bg-primary text-white shadow-sm hover:bg-primary-strong",
        variant === "secondary" && "border border-line-strong bg-surface text-ink shadow-sm hover:bg-surface2",
        variant === "soft" && "bg-primary-soft text-primary hover:bg-[#dbe7ff]",
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
  label?: string;
  hint?: string;
  error?: string | null;
  icon?: ReactNode;
  trailing?: ReactNode;
}
export const fieldClass =
  "min-h-12 w-full rounded-md border bg-surface px-3.5 text-base text-ink shadow-sm transition-[border-color,box-shadow] placeholder:text-[#667085] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, icon, trailing, id, className, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
          className={clsx(fieldClass, icon && "pl-11", trailing && "pr-12", error ? "border-danger" : "border-line-strong")}
          {...rest}
        />
        {trailing && <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error ? (
        <p id={`${fid}-err`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="mt-1.5 text-sm text-muted">
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
      <label htmlFor={sid} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <select id={sid} className={clsx(fieldClass, "cursor-pointer appearance-none border-line-strong pr-10")} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}

/* ------------------------------- Checkbox ------------------------------- */
export function Checkbox({ id, checked, onChange, children, error }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string | null }) {
  return (
    <div>
      <label htmlFor={id} className={clsx("flex cursor-pointer gap-3 rounded-md border p-3.5 transition-colors", checked ? "border-primary bg-primary-soft" : error ? "border-danger" : "border-line hover:bg-surface2")}>
        <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            className="peer size-5 cursor-pointer appearance-none rounded-sm border border-line-strong bg-surface checked:border-primary checked:bg-primary"
          />
          <Check aria-hidden strokeWidth={3} className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="text-sm leading-relaxed text-ink">{children}</span>
      </label>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* --------------------------- SegmentedControl --------------------------- */
export function SegmentedControl<T extends string>({ label, value, options, onChange, className }: { label: string; value: T; options: { value: T; label: string; icon?: ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + options.length) % options.length;
    onChange(options[n].value);
    (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={clsx("inline-flex rounded-md border border-line-strong bg-surface2 p-1", className)}>
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
            className={clsx("inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm px-4 text-sm font-semibold transition-colors", on ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}
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
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-semibold", className)} style={{ background: bg, color: fg }}>
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
      className={clsx("press inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3.5 text-sm font-medium", !selected && "border-line-strong bg-surface text-ink hover:bg-surface2", selected && !c && "border-primary bg-primary text-white")}
      style={selected && c ? { borderColor: c.vivid, background: c.vivid, color: c.on } : undefined}
    >
      {selected && <Check aria-hidden className="size-4" strokeWidth={2.5} />}
      {children}
    </button>
  );
}

/* -------------------------------- Slider -------------------------------- */
export function Slider({ label, value, min, max, onChange, display, minLabel, maxLabel, fill }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; display?: string; minLabel?: string; maxLabel?: string; fill?: string }) {
  const id = useId();
  const pct = max === min ? 100 : ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span aria-hidden className="text-2xl font-bold text-ink tabular">
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
        style={{ ["--pct" as string]: `${pct}%`, ["--fill" as string]: fill }}
      />
      {(minLabel || maxLabel) && (
        <div aria-hidden className="flex justify-between text-xs text-muted tabular">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ EmptyState ------------------------------ */
export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface2 text-muted">
        <SearchX aria-hidden className="size-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
