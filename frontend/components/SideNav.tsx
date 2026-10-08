"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/format";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/hosted-zones", label: "Hosted zones" },
  { href: "/health-checks", label: "Health checks" },
  { href: "/traffic-policies", label: "Traffic policies" },
  { href: "/resolver", label: "Resolver" },
  { href: "/profiles", label: "Profiles" },
];

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-aws-border bg-white dark:border-aws-slate dark:bg-aws-navy">
      <div className="border-b border-aws-border px-4 py-4 dark:border-aws-slate">
        <p className="text-xs uppercase tracking-wide text-aws-muted">Route 53</p>
        <h1 className="text-lg font-bold text-aws-text dark:text-white">DNS management</h1>
      </div>
      <nav className="py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                "aws-focus block border-l-4 px-4 py-2 text-sm",
                active
                  ? "border-l-aws-orange bg-aws-bg font-bold text-aws-blueDark dark:bg-aws-slate dark:text-white"
                  : "border-l-transparent text-aws-text hover:bg-aws-bg dark:text-gray-200 dark:hover:bg-aws-slate",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
