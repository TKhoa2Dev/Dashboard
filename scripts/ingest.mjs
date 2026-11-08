#!/usr/bin/env node
/**
 * Thu thập tin thật từ RSS trong 24h gần nhất.
 *
 * NGUYÊN TẮC CHỐNG BỊA:
 * Chỉ lấy title/url/ngày THẬT từ feed. Model về sau chỉ được chọn trong danh sách này
 * và chỉ được viết phân tích — không được tự sinh tin mới.
 *
 * Xuất ra: _ingest/candidates.json
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "_ingest");
const WINDOW_HOURS = 24;

const FEEDS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", field: "AI", source: "TechCrunch" },
  { url: "https://techcrunch.com/category/startups/feed/", field: "Startup", source: "TechCrunch" },
  { url: "https://techcrunch.com/category/venture/feed/", field: "Startup", source: "TechCrunch" },
  { url: "https://techcrunch.com/category/fintech/feed/", field: "Tài chính", source: "TechCrunch" },
  { url: "https://techcrunch.com/category/apps/feed/", field: "Công nghệ", source: "TechCrunch" },
  { url: "https://techcrunch.com/category/social/feed/", field: "MMO", source: "TechCrunch" },
  { url: "https://www.theverge.com/rss/index.xml", field: "Công nghệ", source: "The Verge" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", field: "Tiền mã hóa", source: "CoinDesk" },
  { url: "https://feeds.arstechnica.com/arstechnica/index", field: "Công nghệ", source: "Ars Technica" },
  { url: "https://hnrss.org/frontpage", field: "Công nghệ", source: "Hacker News" },
  // Kinh tế vĩ mô & tài chính — bổ sung để 10 tin không dồn vào 2 lĩnh vực
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", field: "Kinh tế", source: "CNBC" },
  { url: "https://www.cnbc.com/id/10000664/device/rss/rss.html", field: "Tài chính", source: "CNBC" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", field: "Kinh tế", source: "BBC Business" },
  { url: "https://www.theguardian.com/uk/business/rss", field: "Kinh tế", source: "The Guardian" },
  { url: "https://www.economist.com/finance-and-economics/rss.xml", field: "Kinh tế", source: "The Economist" },
  // Creator economy / nền tảng kiếm tiền trực tuyến
  { url: "https://www.theverge.com/rss/creators/index.xml", field: "MMO", source: "The Verge" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Bóc CDATA và entity HTML */
function clean(s) {
  if (!s) return "";
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Lấy nội dung giữa hai thẻ (không dùng XML parser để tránh vỡ feed lỗi) */
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? clean(m[1]) : "";
}

function parseItems(xml) {
  const items = [];
  // RSS <item> và Atom <entry>
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];

  for (const b of blocks) {
    let link = tag(b, "link");
    if (!link) {
      // Atom: <link href="..."/>
      const m = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (m) link = m[1];
    }
    const title = tag(b, "title");
    const dateRaw =
      tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date");
    const desc =
      tag(b, "description") || tag(b, "summary") || tag(b, "content:encoded") || "";

    if (!title || !link) continue;
    const d = dateRaw ? new Date(dateRaw) : null;
    if (!d || Number.isNaN(d.getTime())) continue;

    items.push({
      title,
      url: link,
      publishedAt: d.toISOString(),
      publishedTs: d.getTime(),
      excerpt: desc.slice(0, 500),
    });
  }
  return items;
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseItems(xml).map((it) => ({ ...it, field: feed.field, source: feed.source }));
}

async function main() {
  const now = Date.now();
  const cutoff = now - WINDOW_HOURS * 3600 * 1000;

  console.log(`Cửa sổ: ${WINDOW_HOURS}h tính đến ${new Date(now).toISOString()}`);

  const all = [];
  const failures = [];

  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f)));

  results.forEach((r, i) => {
    const feed = FEEDS[i];
    if (r.status === "fulfilled") {
      const fresh = r.value.filter((it) => it.publishedTs >= cutoff && it.publishedTs <= now);
      console.log(`  OK  ${feed.source.padEnd(12)} ${String(fresh.length).padStart(2)} tin trong 24h / ${r.value.length} tổng`);
      all.push(...fresh);
    } else {
      console.log(`  LỖI ${feed.source.padEnd(12)} ${r.reason?.message}`);
      failures.push({ feed: feed.url, error: String(r.reason?.message) });
    }
  });

  // Khử trùng theo URL (không dấu / cuối) và theo tiêu đề
  const seenUrl = new Set();
  const seenTitle = new Set();
  const unique = [];
  const dropped = [];

  // Tiêu đề bị loại: khuyến mãi, giá giảm, review sản phẩm, đời sống
  const BANNED = [
    /\bis down to (its )?lowest price\b/i,
    /\blowest price since\b/i,
    /\bbest deals?\b/i,
    /\bdeal of the day\b/i,
    /\bblack friday\b/i,
    /\bcyber monday\b/i,
    /\bdiscount(ed)?\b/i,
    /\b\d+% off\b/i,
    /\bsave \$\d+/i,
    /\bprime day\b/i,
    /\bcoupon\b/i,
    /\bhow to watch\b/i,
    /\breview:\s/i,
    /^\s*review\b/i,
    /\bhands[- ]on\b/i,
  ];

  for (const it of all.sort((a, b) => b.publishedTs - a.publishedTs)) {
    const u = it.url.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
    const t = it.title.toLowerCase().replace(/\s+/g, " ");
    if (seenUrl.has(u) || seenTitle.has(t)) continue;

    const banned = BANNED.find((re) => re.test(it.title));
    if (banned) {
      dropped.push({ title: it.title, reason: "khuyến mãi/review" });
      continue;
    }

    seenUrl.add(u);
    seenTitle.add(t);
    unique.push(it);
  }

  if (dropped.length) {
    console.log(`\nĐã loại ${dropped.length} tin khuyến mãi/review ở tầng thu thập.`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const payload = {
    generatedAt: new Date(now).toISOString(),
    windowHours: WINDOW_HOURS,
    totalFresh: unique.length,
    failures,
    candidates: unique.map((it, i) => ({
      n: i + 1,
      title: it.title,
      url: it.url,
      publishedAt: it.publishedAt,
      field: it.field,
      source: it.source,
      excerpt: it.excerpt,
    })),
  };
  fs.writeFileSync(path.join(OUT_DIR, "candidates.json"), JSON.stringify(payload, null, 2), "utf8");

  console.log(`\nTổng: ${unique.length} tin duy nhất trong 24h`);
  if (failures.length) console.log(`Cảnh báo: ${failures.length} feed lỗi`);

  // Không đủ tin thì báo lỗi rõ ràng, không tạo bản tin rỗng
  if (unique.length < 10) {
    console.error(`\nLỖI: chỉ có ${unique.length} tin, cần tối thiểu 10. Không tạo bản tin.`);
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("LỖI INGEST:", e);
  process.exit(1);
});
