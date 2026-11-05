"use client";

import type { NewsItem } from "@/lib/types";
import { useFavourites } from "@/lib/useFavourites";
import { NewsCard } from "./NewsCard";

export function FavouritesView({ items }: { items: NewsItem[] }) {
  const { ids, ready, clear } = useFavourites();

  if (!ready) {
    return (
      <div className="empty">
        <p className="empty-text">Đang tải…</p>
      </div>
    );
  }

  const favItems = items.filter((it) => ids.includes(it.id));

  if (favItems.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon" aria-hidden="true">☆</div>
        <div className="empty-title">Chưa có tin yêu thích</div>
        <p className="empty-text">
          Nhấn ngôi sao ở góc phải mỗi tin trong trang Daily News để lưu lại đây.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="toolbar">
        <div className="chips">
          <span className="chip" data-active="true">
            Đã lưu<span className="chip-count">{favItems.length}</span>
          </span>
        </div>
        <button
          type="button"
          className="chip"
          onClick={() => {
            if (confirm("Xoá tất cả tin đã lưu trên thiết bị này?")) clear();
          }}
        >
          Xoá tất cả
        </button>
      </div>

      <div className="feed">
        {favItems.map((item, i) => (
          <NewsCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </>
  );
}
