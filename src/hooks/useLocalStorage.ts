import { useCallback, useState } from "react";

/** JSON-backed localStorage state hook, resilient to bad/missing values. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return { ...initialValue, ...(JSON.parse(raw) as T) };
    } catch {
      return initialValue;
    }
  });

  const set = useCallback(
    (update: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof update === "function" ? (update as (p: T) => T)(prev) : update;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage full/blocked — keep in-memory value */
        }
        return next;
      });
    },
    [key]
  );

  return [value, set] as const;
}
