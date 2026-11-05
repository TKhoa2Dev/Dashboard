"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Favourite lưu trong localStorage của từng thiết bị (không cần backend).
 * Dùng custom event để mọi component (card, header, trang favourites)
 * đồng bộ ngay khi có thay đổi, kể cả giữa các tab.
 */

const KEY = "db:favourites";
const EVENT = "db:favourites-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* bỏ qua nếu storage đầy/bị chặn */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useFavourites() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(read());
    setReady(true);

    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // đồng bộ giữa các tab
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    write(next);
    setIds(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((x) => x !== id);
    write(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, ready, toggle, remove, clear, has };
}
