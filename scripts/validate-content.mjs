#!/usr/bin/env node
/**
 * Kiểm tra toàn bộ content/news/*.json trước khi deploy.
 * Chạy: npm run validate
 * Exit code 1 nếu có lỗi -> dùng được trong CI.
 */
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "news");
const FIELDS = ["AI", "Công nghệ", "Tiền mã hóa", "Tài chính"];
const CONFIDENCE = ["Thấp", "Trung bình", "Cao"];

const errors = [];
const warnings = [];
const seenIds = new Map();

function err(file, msg) {
  errors.push(`${file}: ${msg}`);
}
function warn(file, msg) {
  warnings.push(`${file}: ${msg}`);
}

if (!fs.existsSync(DIR)) {
  console.error(`Không thấy thư mục ${DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();

if (files.length === 0) {
  console.error("Chưa có file bản tin nào trong content/news/");
  process.exit(1);
}

for (const file of files) {
  const full = path.join(DIR, file);
  let b;
  try {
    b = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    err(file, `JSON không hợp lệ — ${e.message}`);
    continue;
  }

  // Tên file phải khớp trường date
  const base = file.replace(/\.json$/, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) {
    err(file, "Tên file phải có dạng YYYY-MM-DD.json");
  }
  if (b.date !== base) {
    err(file, `"date" (${b.date}) không khớp tên file (${base})`);
  }
  if (!b.timezone) warn(file, "thiếu \"timezone\"");
  if (!b.generatedAt) warn(file, "thiếu \"generatedAt\"");

  if (!Array.isArray(b.items) || b.items.length === 0) {
    err(file, "\"items\" phải là mảng không rỗng");
    continue;
  }

  if (b.items.length !== 5) {
    warn(
      file,
      `có ${b.items.length} tin thay vì 5 — chỉ chấp nhận nếu thực sự thiếu tin đủ chất lượng`
    );
  }

  b.items.forEach((it, i) => {
    const tag = `items[${i}]${it?.id ? ` (${it.id})` : ""}`;

    for (const req of ["id", "title", "field", "summary", "whyItMatters"]) {
      if (!it?.[req] || typeof it[req] !== "string" || !it[req].trim()) {
        err(file, `${tag}: thiếu hoặc rỗng "${req}"`);
      }
    }

    if (it?.id) {
      if (seenIds.has(it.id)) {
        err(
          file,
          `${tag}: "id" bị trùng với ${seenIds.get(it.id)} — favourite sẽ lưu sai tin`
        );
      } else {
        seenIds.set(it.id, file);
      }
      if (!/^[a-z0-9-]+$/.test(it.id)) {
        warn(file, `${tag}: "id" nên chỉ gồm a-z, 0-9 và dấu gạch nối`);
      }
    }

    if (it?.field && !FIELDS.includes(it.field)) {
      err(file, `${tag}: "field" = "${it.field}" không thuộc ${FIELDS.join(" / ")}`);
    }

    if (!Array.isArray(it?.sources) || it.sources.length === 0) {
      err(file, `${tag}: phải có ít nhất 1 nguồn`);
    } else {
      let hasPrimary = false;
      it.sources.forEach((s, j) => {
        if (!s?.url || !/^https?:\/\//.test(s.url)) {
          err(file, `${tag}.sources[${j}]: "url" phải là http(s) tuyệt đối`);
        }
        if (!s?.name) err(file, `${tag}.sources[${j}]: thiếu "name"`);
        if (s?.role === "primary") hasPrimary = true;
        if (!["primary", "cross-check"].includes(s?.role)) {
          err(file, `${tag}.sources[${j}]: "role" phải là "primary" hoặc "cross-check"`);
        }
      });
      if (!hasPrimary) {
        warn(file, `${tag}: không có nguồn "primary"`);
      }
    }

    const a = it?.analysis;
    if (!a) {
      err(file, `${tag}: thiếu "analysis"`);
    } else {
      for (const req of ["strengths", "opportunity", "risks", "confidence", "confidenceNote"]) {
        if (!a[req] || typeof a[req] !== "string" || !a[req].trim()) {
          err(file, `${tag}.analysis: thiếu hoặc rỗng "${req}"`);
        }
      }
      if (a.confidence && !CONFIDENCE.includes(a.confidence)) {
        err(
          file,
          `${tag}.analysis.confidence = "${a.confidence}" không thuộc ${CONFIDENCE.join(" / ")}`
        );
      }
    }
  });

  // Không được khai man model
  if (b.model) {
    if (b.model.verified === true && !b.model.usedModelId) {
      err(file, `"model.verified" = true nhưng thiếu "usedModelId"`);
    }
    if (b.model.verified === true && b.model.requested && b.model.usedModelId) {
      const norm = (s) => s.toLowerCase().replace(/[\s_.]+/g, "-");
      if (norm(b.model.requested) !== norm(b.model.usedModelId)) {
        warn(
          file,
          `model.requested ("${b.model.requested}") khác usedModelId ("${b.model.usedModelId}") — ghi rõ trong "note"`
        );
      }
    }
  }
}

// Tab cuối
console.log(`\nĐã kiểm tra ${files.length} file bản tin.`);

if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} cảnh báo:`);
  warnings.forEach((w) => console.log("   - " + w));
}

if (errors.length) {
  console.log(`\n✗  ${errors.length} LỖI:`);
  errors.forEach((e) => console.log("   - " + e));
  console.log("");
  process.exit(1);
}

console.log(`\n✓  Không có lỗi. Sẵn sàng build/deploy.\n`);
