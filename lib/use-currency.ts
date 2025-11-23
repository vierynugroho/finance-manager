"use client";

import { useEffect, useState } from "react";

const DEFAULT_CURRENCY = "IDR";

export function useCurrency() {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("fm_currency");
    if (stored) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (value: string) => {
    setCurrencyState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fm_currency", value);
    }
  };

  return { currency, setCurrency };
}
