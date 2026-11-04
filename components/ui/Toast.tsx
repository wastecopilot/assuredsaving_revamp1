"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";

type Toast = { id: number; title: string; body?: string };
const Ctx = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children, closeLabel }: { children: ReactNode; closeLabel: string }) {
  const [items, setItems] = useState<Toast[]>([]);
  const next = useRef(1);
  const remove = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = next.current++;
      setItems((xs) => [...xs.slice(-2), { ...t, id }]);
      window.setTimeout(() => remove(id), 6000);
    },
    [remove],
  );
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {items.map((t) => (
          <div key={t.id} role="status" className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface p-4 shadow-overlay">
            <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-sm text-muted">{t.body}</p>}
            </div>
            <button type="button" aria-label={closeLabel} onClick={() => remove(t.id)} className="-m-2 inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-ink">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
