import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const g = JSON.parse(fs.readFileSync(path.join(ROOT,"_ingest","generated.json"),"utf8"));

/** Ngay theo mui gio Bangkok (KHONG dung UTC - UTC se ra ngay hom truoc) */
function bangkokDate(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso));
}

const dates = g.items.map(i => bangkokDate(i.publishedAt)).sort();
const date = dates.at(-1);

const out = path.join(ROOT,"content","news",`${date}.json`);
if (fs.existsSync(out)) {
  console.error(`LỖI: ${date}.json đã tồn tại. Không ghi đè bản tin cũ.`);
  process.exit(4);
}

const bulletin = {
  date,
  timezone: "Asia/Bangkok",
  generatedAt: new Date().toISOString(),
  model: g.model,
  telegram: g.telegram,
  // Sap xep tin MOI NHAT TRUOC de nguoi doc thay tin nong nhat dau trang
  items: [...g.items]
    .map(it => ({ ...it, publishedAt: new Date(it.publishedAt).toISOString() }))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)),
  summary: g.summary,
};

fs.writeFileSync(out, JSON.stringify(bulletin, null, 2), "utf8");
console.log("Da ghi:", out);
console.log("Ngay (Bangkok):", date, "| so tin:", bulletin.items.length);