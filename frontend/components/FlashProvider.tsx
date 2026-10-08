"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Kind = "success" | "error" | "info";

type Flash = {
  id: number;
  kind: Kind;
  title: string;
  message?: string;
};

type FlashValue = {
  flashes: Flash[];
  push: (kind: Kind, title: string, message?: string) => void;
  dismiss: (id: number) => void;
};

const FlashContext = createContext<FlashValue | null>(null);

let counter = 0;

export function FlashProvider({ children }: { children: React.ReactNode }) {
  const [flashes, setFlashes] = useState<Flash[]>([]);

  const dismiss = useCallback((id: number) => {
    setFlashes((list) => list.filter((f) => f.id !== id));
  }, []);

  const push = useCallback(
    (kind: Kind, title: string, message?: string) => {
      const id = ++counter;
      setFlashes((list) => [...list, { id, kind, title, message }]);
      setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  return (
    <FlashContext.Provider value={{ flashes, push, dismiss }}>
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash(): FlashValue {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error("useFlash must be used inside FlashProvider");
  return ctx;
}
