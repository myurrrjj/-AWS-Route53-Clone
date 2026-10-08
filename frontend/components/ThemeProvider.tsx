"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeValue = {
  theme: "light" | "dark";
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (localStorage.getItem("r53-theme") as "light" | "dark") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  function toggle() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("r53-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
