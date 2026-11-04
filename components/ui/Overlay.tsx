"use client";
/**
 * Modal (centred dialog) and Drawer (side panel), both bottom sheets on phones.
 * Focus is trapped, Escape and the scrim close it, focus returns to the
 * trigger, and the page behind does not scroll.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  description?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

function useDialog(open: boolean, onClose: () => void, panel: React.RefObject<HTMLDivElement | null>) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const last = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      } else if (e.key === "Tab" && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
        if (!items.length) return;
        const [first, lastEl] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (last?.isConnected) last.focus();
    };
  }, [open, panel]);
}

function Shell({ variant, open, onClose, title, closeLabel, description, header, footer, children, wide }: Props & { variant: "modal" | "drawer" }) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useDialog(open, onClose, panel);
  const drawer = variant === "drawer";
  return (
    <AnimatePresence>
      {open && (
        <div className={clsx("fixed inset-0 z-50 flex items-end", drawer ? "sm:items-stretch sm:justify-end" : "justify-center sm:items-center sm:p-6")}>
          <motion.div aria-hidden className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            className={clsx(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl bg-surface shadow-overlay",
              drawer ? "sm:max-h-none sm:max-w-[560px] sm:rounded-none sm:rounded-l-xl" : clsx("sm:rounded-xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg"),
            )}
            initial={reduce ? { opacity: 0 } : drawer ? { x: 60, opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : drawer ? { x: 60, opacity: 0 } : { y: 30, opacity: 0 }}
            transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: 360, damping: 34 }}
          >
            <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line-strong sm:hidden" />
            <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-4 sm:pt-6">
              <div className="min-w-0">
                {header}
                <h2 id={titleId} className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  {title}
                </h2>
                {description && (
                  <div id={descId} className="mt-1 text-sm text-muted">
                    {description}
                  </div>
                )}
              </div>
              <button type="button" onClick={onClose} aria-label={closeLabel} className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface2 hover:text-ink">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 focus-visible:outline-offset-[-3px]">
              {children}
            </div>
            {footer && <div className="border-t border-line bg-surface px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export const Modal = (p: Props) => <Shell variant="modal" {...p} />;
export const Drawer = (p: Props) => <Shell variant="drawer" {...p} />;
