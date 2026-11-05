"use client";

import { useMemo, useState } from "react";
import type { Field, NewsItem } from "@/lib/types";
import { FIELDS } from "@/lib/types";
import { NewsCard } from "./NewsCard";

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [field, setField] = useState<Field | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of items) c[it.field] = (c[it.field] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (field !== "all" && it.field !== field) return false;
      if (!q) return true;
      const hay = [
        it.title,
        it.summary,
        it.whyItMatters,
        it.field,
        ...it.sources.map((s) => s.name),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, field, query]);

  const presentFields = FIELDS.filter((f) => (counts[f] ?? 0) > 0);

  return (
    <>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Lọc theo lĩnh vực">
          <button
            type="button"
            className="chip"
            data-active={field === "all"}
            onClick={() => setField("all")}
          >
            Tất cả<span className="chip-count">{items.length}</span>
          </button>
          {presentFields.map((f) => (
            <button
              key={f}
              type="button"
              className="chip"
              data-active={field === f}
              onClick={() => setField(f)}
            >
              {f}
              <span className="chip-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        <label className="search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tin…"
            aria-label="Tìm kiếm tin"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">🔍</div>
          <div className="empty-title">Không có tin nào khớp</div>
          <p className="empty-text">
            Thử bỏ bộ lọc lĩnh vực hoặc xoá từ khoá tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="feed">
          {filtered.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              index={items.indexOf(item)}
              defaultOpen={filtered.length === 1 && items.length > 1}
            />
          ))}
        </div>
      )}
    </>
  );
}
