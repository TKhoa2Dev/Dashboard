import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const g = JSON.parse(fs.readFileSync(path.join(ROOT, "_ingest", "generated.json"), "utf8"));

/**
 * Ngay cua BAN TIN = hom nay theo gio Bangkok (KHONG phai ngay cua tin moi nhat).
 *
 * Ly do: luc 06:00 sang, tin moi nhat trong 24h co the van la tin cua hom qua.
 * Neu lay ngay cua tin moi nhat thi file se mang ten hom qua -> trung file da co
 * -> workflow that bai. Ban tin hom nay phai mang ten hom nay.
 */
function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const date = process.env.BULLETIN_DATE || todayBangkok();
const out = path.join(ROOT, "content", "news", `${date}.json`);

// Idempotent: da co ban tin hom nay thi dung lai, khong ghi de, khong bao loi.
if (fs.existsSync(out)) {
  console.log(`Đã có bản tin ${date} — không ghi đè. Dừng.`);
  process.exit(0);
}

// Kiem tra tin co that su thuoc cua so 24h khong (chong dung tin cu)
const now = Date.now();
const tooOld = g.items.filter((it) => now - new Date(it.publishedAt).getTime() > 36 * 3600 * 1000);
if (tooOld.length) {
  console.warn(`CẢNH BÁO: ${tooOld.length} tin cũ hơn 36 giờ trong bản tin.`);
}

const bulletin = {
  date,
  timezone: "Asia/Bangkok",
  generatedAt: new Date().toISOString(),
  model: g.model,
  telegram: g.telegram,
  // Sap xep tin MOI NHAT TRUOC de nguoi doc thay tin nong nhat dau trang
  items: [...g.items]
    .map((it) => ({ ...it, publishedAt: new Date(it.publishedAt).toISOString() }))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)),
  summary: g.summary,
};

fs.writeFileSync(out, JSON.stringify(bulletin, null, 2), "utf8");
console.log("Da ghi:", out);
console.log("Ngay (Bangkok):", date, "| so tin:", bulletin.items.length);
