"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { TopNav } from "./TopNav";
import { SideNav } from "./SideNav";
import { FlashStack } from "./FlashStack";
import { Spinner } from "./Spinner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "g") {
        const next = (ev: KeyboardEvent) => {
          if (ev.key === "h") router.push("/hosted-zones");
          if (ev.key === "d") router.push("/dashboard");
          window.removeEventListener("keydown", next);
        };
        window.addEventListener("keydown", next, { once: true });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (loading || !user) {
    return (
      <div className="grid h-screen place-items-center">
        <Spinner label="Loading Route 53" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aws-bg dark:bg-[#0f1b2a]">
      <TopNav />
      <FlashStack />
      <div className="flex">
        <SideNav />
        <main className="min-h-[calc(100vh-3rem)] flex-1 overflow-x-hidden px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
