import fs from "node:fs";
import path from "node:path";
import type { Bulletin, NewsItem } from "./types";

/**
 * Nguồn dữ liệu: các file JSON trong content/news/*.json
 * Mỗi file = một bản tin của một ngày. Đọc lúc build/server, không gọi mạng.
 *
 * Để thêm một ngày mới: chỉ cần thả file `YYYY-MM-DD.json` vào content/news/.
 * Không cần sửa code.
 */

const CONTENT_DIR = path.join(process.cwd(), "content", "news");

function readBulletinFiles(): Bulletin[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse(); // mới nhất trước

  const bulletins: Bulletin[] = [];

  for (const file of files) {
    const full = path.join(CONTENT_DIR, file);
    try {
      const raw = fs.readFileSync(full, "utf8");
      const parsed = JSON.parse(raw) as Bulletin;

      if (!parsed?.date || !Array.isArray(parsed.items)) {
        console.warn(`[content] Bỏ qua ${file}: thiếu "date" hoặc "items".`);
        continue;
      }
      bulletins.push(parsed);
    } catch (err) {
      console.error(`[content] Lỗi đọc ${file}:`, err);
    }
  }

  return bulletins.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Toàn bộ bản tin, mới nhất trước */
export function getAllBulletins(): Bulletin[] {
  return readBulletinFiles();
}

/** Bản tin mới nhất, hoặc null nếu chưa có nội dung */
export function getLatestBulletin(): Bulletin | null {
  return getAllBulletins()[0] ?? null;
}

export function getBulletinByDate(date: string): Bulletin | null {
  return getAllBulletins().find((b) => b.date === date) ?? null;
}

/** Danh sách ngày có bản tin, mới nhất trước */
export function getAvailableDates(): string[] {
  return getAllBulletins().map((b) => b.date);
}

/** Mọi tin trên tất cả các ngày, mới nhất trước */
export function getAllItems(): NewsItem[] {
  return getAllBulletins().flatMap((b) => b.items);
}

/** Tra một tin theo id */
export function getItemById(id: string): NewsItem | null {
  return getAllItems().find((i) => i.id === id) ?? null;
}
