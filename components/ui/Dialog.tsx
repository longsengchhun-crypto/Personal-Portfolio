"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "./Icon";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([type="hidden"]):not([disabled]), select, [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  /** Hide the visible title while keeping it as the accessible name. */
  hideTitle?: boolean;
  dismissible?: boolean;
  role?: "dialog" | "alertdialog";
};

// Accessible modal: focus is trapped and restored, Escape and backdrop click close it, the page
// behind cannot scroll, and it leaves with a short exit animation.
export default function Dialog({ open, onClose, title, children, actions, wide, hideTitle, dismissible = true, role = "dialog" }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) { setVisible(true); setLeaving(false); return; }
    if (!visible) return;
    setLeaving(true);
    const timer = window.setTimeout(() => { setVisible(false); setLeaving(false); }, 260);
    return () => window.clearTimeout(timer);
  }, [open, visible]);

  // Runs once the panel is actually in the DOM (open and visible), so focus has something to land on.
  useEffect(() => {
    if (!open || !visible) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("is-locked");
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") || panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first || panel)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) { event.stopPropagation(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) { event.preventDefault(); return; }
      const [head, tail] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === head) { event.preventDefault(); tail.focus(); }
      else if (!event.shiftKey && document.activeElement === tail) { event.preventDefault(); head.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-locked");
      previous?.focus?.();
    };
  }, [open, visible, dismissible]);

  if (!mounted || !visible) return null;
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(event) => { if (dismissible && event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} className={`dialog${wide ? " dialog--wide" : ""}${leaving ? " is-leaving" : ""}`} role={role} aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        {dismissible && <button type="button" className="btn btn--ghost btn--icon btn--sm dialog__close" onClick={onClose} aria-label="Close"><X /></button>}
        <h2 id={titleId} className={hideTitle ? "sr-only" : "dialog__title"}>{title}</h2>
        {children && <div className="dialog__body">{children}</div>}
        {actions && <div className="dialog__actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
