"use client";

import { useEffect } from "react";
import { Button } from "./Button";

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "max-w-3xl",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div className={`animate-slide-down w-full ${width} rounded-sm bg-white shadow-xl dark:bg-aws-navy`}>
        <div className="flex items-start justify-between border-b border-aws-border px-6 py-4 dark:border-aws-slate">
          <div>
            <h2 className="text-xl font-bold text-aws-text dark:text-white">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-aws-muted">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="aws-focus text-2xl leading-none text-aws-muted hover:text-aws-text dark:hover:text-white"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-aws-border bg-aws-bg px-6 py-4 dark:border-aws-slate dark:bg-aws-navy">
          {footer ?? <Button onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
}
