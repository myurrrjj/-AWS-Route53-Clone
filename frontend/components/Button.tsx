"use client";

import { classNames } from "@/lib/format";

type Variant = "primary" | "normal" | "link" | "danger";

export function Button({
  children,
  variant = "normal",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      "bg-aws-orange hover:bg-aws-orangeDark text-aws-text border border-aws-orangeDark font-bold",
    normal:
      "bg-white hover:bg-aws-bg text-aws-text border border-aws-steel dark:bg-aws-slate dark:text-white dark:border-aws-steel",
    link: "bg-transparent text-aws-link hover:underline px-0",
    danger:
      "bg-white hover:bg-aws-bg text-aws-red border border-aws-steel dark:bg-aws-slate dark:border-aws-steel",
  };
  return (
    <button
      className={classNames(
        "aws-focus inline-flex items-center gap-2 rounded-sm px-4 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
