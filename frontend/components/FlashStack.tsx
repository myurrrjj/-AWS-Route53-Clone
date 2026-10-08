"use client";

import { useFlash } from "./FlashProvider";
import { classNames } from "@/lib/format";

export function FlashStack() {
  const { flashes, dismiss } = useFlash();
  if (flashes.length === 0) return null;

  return (
    <div className="fixed right-4 top-16 z-[60] flex w-[380px] flex-col gap-3">
      {flashes.map((f) => (
        <div
          key={f.id}
          className={classNames(
            "animate-slide-down flex items-start gap-3 rounded-sm border-l-4 bg-white p-4 shadow-card dark:bg-aws-navy",
            f.kind === "success" && "border-l-aws-green",
            f.kind === "error" && "border-l-aws-red",
            f.kind === "info" && "border-l-aws-blue",
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-aws-text dark:text-white">{f.title}</p>
            {f.message ? (
              <p className="mt-1 text-sm text-aws-muted dark:text-gray-300">{f.message}</p>
            ) : null}
          </div>
          <button
            onClick={() => dismiss(f.id)}
            aria-label="Dismiss"
            className="aws-focus text-lg leading-none text-aws-muted hover:text-aws-text dark:hover:text-white"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
