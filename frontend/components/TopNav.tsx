"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";

export function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [menu, setMenu] = useState(false);

  return (
    <header className="flex h-12 items-center justify-between bg-aws-navy px-4 text-white">
      <div className="flex items-center gap-4">
        <Link href="/hosted-zones" className="aws-focus flex items-center gap-1">
          <span className="text-lg font-bold tracking-tight">aws</span>
          <span className="h-[6px] w-8 rounded-b-full border-b-2 border-aws-orange" />
        </Link>
        <span className="hidden text-sm text-gray-300 md:inline">Route 53</span>
      </div>

      <div className="hidden flex-1 justify-center px-8 md:flex">
        <input
          placeholder="Search for services, features, blogs, docs, and more"
          className="aws-focus w-full max-w-xl rounded-sm bg-white/95 px-3 py-1 text-sm text-aws-text placeholder:text-aws-muted"
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={toggle}
          className="aws-focus rounded-sm px-2 py-1 hover:bg-white/10"
          title="Toggle dark mode"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="aws-focus flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-white/10"
          >
            <span className="hidden sm:inline">{user?.name ?? "Account"}</span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-aws-orange text-xs font-bold text-aws-text">
              {(user?.name ?? "A").charAt(0).toUpperCase()}
            </span>
          </button>
          {menu ? (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-sm border border-aws-border bg-white py-1 text-aws-text shadow-lg dark:border-aws-slate dark:bg-aws-slate dark:text-white">
              <div className="border-b border-aws-border px-3 py-2 text-xs text-aws-muted dark:border-aws-slate">
                Account: {user?.account_id}
              </div>
              <div className="px-3 py-2 text-sm">{user?.email}</div>
              <button
                onClick={() => logout()}
                className="aws-focus w-full px-3 py-2 text-left text-sm hover:bg-aws-bg dark:hover:bg-aws-navy"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
