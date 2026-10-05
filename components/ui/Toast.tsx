"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "./Icon";

type Tone = "success" | "error" | "info";
type ToastInput = { title: string; message?: string; tone?: Tone; action?: { label: string; run: () => void }; duration?: number };
type ToastItem = ToastInput & { id: number; leaving: boolean };

const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>.");
  return context.toast;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 260);
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++counter.current;
    setItems((current) => [...current.slice(-3), { ...input, id, leaving: false }]);
    window.setTimeout(() => dismiss(id), input.duration ?? (input.tone === "error" ? 7000 : 4200));
  }, [dismiss]);

  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toaster" role="region" aria-label="Notifications">
      {items.map((item) => {
        const tone = item.tone ?? "success";
        const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertTriangle : Info;
        return <div key={item.id} className={`toast toast--${tone} glass glass--strong${item.leaving ? " is-leaving" : ""}`} role={tone === "error" ? "alert" : "status"}>
          <Icon className="toast__icon" aria-hidden="true" />
          <div className="toast__text"><strong>{item.title}</strong>{item.message && <span>{item.message}</span>}</div>
          {item.action && <button type="button" className="toast__action" onClick={() => { item.action?.run(); dismiss(item.id); }}>{item.action.label}</button>}
        </div>;
      })}
    </div>
  </ToastContext.Provider>;
}
