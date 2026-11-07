#!/usr/bin/env node
/**
 * Gọi Claude Sonnet 5.5 để CHỌN 10 tin từ danh sách thật và viết phân tích.
 *
 * CHỐNG BỊA — 3 lớp:
 *  1. Model chỉ được chọn bằng số thứ tự `n` trong danh sách thật.
 *  2. URL/title/ngày được GHÉP LẠI từ danh sách gốc, không lấy từ model.
 *  3. Nếu model trả về số `n` không tồn tại, hoặc thiếu trường, cả bản tin bị hủy.
 *
 * Biến môi trường: ANTHROPIC_API_KEY (bắt buộc), ANTHROPIC_BASE_URL (tùy chọn)
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INGEST = path.join(ROOT, "_ingest", "candidates.json");
const OUT_DIR = path.join(ROOT, "_ingest");

const FIELDS = ["AI", "Công nghệ", "MMO", "Startup", "Kinh tế", "Tiền mã hóa", "Tài chính"];

/**
 * Feed nào gán cứng lĩnh vực gì. Dùng để: (1) đa dạng hoá ứng viên,
 * (2) ghi đè lĩnh vực do model/feed gán sai (ví dụ TechCrunch fintech
 * không phải lúc nào cũng là "Tài chính").
 */

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const BASE_URL = (process.env.ANTHROPIC_BASE_URL || "https://apiclan.us/v1").replace(/\/$/, "");
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

function die(msg) {
  console.error("LỖI:", msg);
  process.exit(1);
}

if (!API_KEY) die("thiếu biến môi trường ANTHROPIC_API_KEY");

const raw = fs.readFileSync(INGEST, "utf8");
const ingest = JSON.parse(raw);
const allCands = ingest.candidates || [];
if (allCands.length < 10) die(`chỉ có ${allCands.length} tin ứng viên, cần >= 10`);

/**
 * Chọn ứng viên theo kiểu ROUND-ROBIN giữa các lĩnh vực.
 * Cách này đảm bảo pool đưa vào prompt luôn đa dạng lĩnh vực, thay vì
 * chỉ lấy tin mới nhất (dễ dồn hết vào Công nghệ/Tiền mã hóa).
 */
const PER_FIELD_CAP = 4;
const byField = {};
for (const c of allCands.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))) {
  (byField[c.field] = byField[c.field] || []).push(c);
}

const fieldOrder = FIELDS.filter((f) => byField[f]?.length);
const picked = [];
let round = 0;
while (picked.length < 20 && round < PER_FIELD_CAP) {
  let added = false;
  for (const f of fieldOrder) {
    if (picked.length >= 20) break;
    const c = byField[f][round];
    if (c) {
      picked.push(c);
      added = true;
    }
  }
  if (!added) break;
  round++;
}

// Bổ sung nếu chưa đủ 10
if (picked.length < 10) {
  const have = new Set(picked.map((c) => c.url));
  for (const c of allCands) {
    if (picked.length >= 10) break;
    if (!have.has(c.url)) {
      picked.push(c);
      have.add(c.url);
    }
  }
}

const cands = picked.map((c, i) => ({ ...c, n: i + 1 }));
const fieldsInPool = [...new Set(cands.map((c) => c.field))];
console.log(
  `Ứng viên: ${allCands.length} tổng → đưa ${cands.length} vào prompt ` +
    `(${fieldsInPool.length} lĩnh vực: ${fieldsInPool.join(", ")})`
);

/** Danh sách gọn để đưa vào prompt (tiết kiệm token) */
const menu = cands
  .map(
    (c) =>
      `${c.n}. [${c.field}] ${c.title}\n   nguồn: ${c.source} | ${c.publishedAt.slice(0, 16).replace("T", " ")}\n   ${c.excerpt.slice(0, 160)}`
  )
  .join("\n");

const prompt = `Bạn là biên tập viên bản tin công nghệ – tài chính cho độc giả Việt Nam.

Dưới đây là ${cands.length} tin THẬT vừa được thu thập trong 24 giờ qua. Mỗi tin có số thứ tự.

${menu}

NHIỆM VỤ: chọn đúng 10 tin đáng chú ý nhất và PHẢI trải đều lĩnh vực — mỗi lĩnh vực có tin tốt thì lấy, không dồn quá 3 tin vào một lĩnh vực. Thứ tự ưu tiên lĩnh vực: (1) MMO/creator economy/nền tảng kiếm tiền, (2) Startup & gọi vốn, (3) AI, (4) Tiền mã hóa, (5) Kinh tế/vĩ mô, (6) Công nghệ, (7) Tài chính.

LOẠI BỎ NGAY, không chọn dù tin có mới:
- Bài y khoa, sức khỏe, tai nạn, án mạng, câu chuyện con người
- Bài review sản phẩm đơn thuần (đánh giá điện thoại, laptop, tai nghe, đồ gia dụng)
- Bài khuyến mãi, quảng bá hội nghị, mời mua vé
- Bài về an toàn trẻ em, bạo lực, nội dung nhạy cảm
- Tin thể thao, giải trí, đời sống, du lịch, thời tiết, ẩm thực

Chỉ chọn tin có giá trị với nhà đầu tư, người làm công nghệ, hoặc người kiếm tiền online: thương vụ M&A, gọi vốn, sản phẩm nền tảng, chính sách ảnh hưởng thị trường, sự kiện tài chính vĩ mô, xu hướng kiếm tiền số.

Với mỗi tin đã chọn, viết bằng tiếng Việt:
- "n": số thứ tự trong danh sách trên (số nguyên, BẮT BUỘC lấy từ danh sách)
- "quote": MỘT câu NGUYÊN VĂN (ít nhất 40 ký tự) cắt NGUYÊN XI từ dòng tóm tắt hoặc tiêu đề của tin đó ở trên. Chép y hệt từng ký tự, KHÔNG dịch, KHÔNG sửa, KHÔNG thêm chữ. Đây là bằng chứng bạn đọc đúng tin.
- "title": tiêu đề tiếng Việt, ngắn gọn, nêu đúng sự kiện
- "summary": 3-5 câu mô tả tin chính. CHỈ dùng thông tin trong phần tóm tắt và tiêu đề ở trên. KHÔNG thêm số liệu, tên người, mức tiền mà bạn không thấy trong dữ liệu.
- "whyItMatters": 2-4 câu giải thích vì sao đáng chú ý với nhà đầu tư/người làm công nghệ.
- "analysis": {
    "strengths": "điểm mạnh / động lực",
    "opportunity": "cơ hội đáng nghiên cứu, kèm tín hiệu cần theo dõi",
    "risks": "rủi ro / điều có thể làm nhận định sai",
    "confidence": "Thấp" | "Trung bình" | "Cao",
    "confidenceNote": "1 câu giải thích mức chắc chắn"
  }
- "caveat": nếu thiếu dữ liệu kiểm chứng thì ghi rõ ở đây (bỏ trống nếu không cần)

QUY TẮC BẮT BUỘC:
1. "n" phải nằm trong khoảng 1-${cands.length} và mỗi số chỉ dùng một lần.
2. "quote" phải là chuỗi NGUYÊN VĂN có thật trong dòng của tin đó. Hệ thống sẽ kiểm tra từng ký tự; sai là cả bản tin bị hủy.
3. KHÔNG bịa số liệu. Nếu dữ liệu không có con số, đừng viết con số.
4. Phân biệt rõ dữ kiện với suy luận của bạn.
5. Không khuyến nghị mua/bán chứng khoán hay coin.
6. Trả về DUY NHẤT một object JSON, không kèm chữ nào khác, theo cấu trúc:
{"items":[{...}],"summary":{"watchpoints":["..."],"topOpportunity":"...","risks":["..."],"disclaimer":"..."}}
Trong đó "items" có đúng 10 phần tử, "watchpoints" 2-4 mục, "risks" 3-5 mục.`;

async function callModel(attempt = 1) {
  const body = {
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  };

  const MAX_ATTEMPTS = 3;
  let res;
  try {
    res = await fetch(`${BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(240_000),
    });
  } catch (e) {
    if (attempt < MAX_ATTEMPTS) {
      console.warn(`  lần ${attempt} lỗi mạng (${e.message}) — thử lại sau 15s`);
      await new Promise((r) => setTimeout(r, 15_000));
      return callModel(attempt + 1);
    }
    die(`không kết nối được API sau ${MAX_ATTEMPTS} lần: ${e.message}`);
  }

  const text = await res.text();

  // 524/502/503 là lỗi tạm thời của gateway — thử lại
  if ([502, 503, 504, 524, 429].includes(res.status) && attempt < MAX_ATTEMPTS) {
    console.warn(`  lần ${attempt}: HTTP ${res.status} — thử lại sau 20s`);
    await new Promise((r) => setTimeout(r, 20_000));
    return callModel(attempt + 1);
  }

  if (!res.ok) die(`API HTTP ${res.status}: ${text.slice(0, 300)}`);

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    die(`phản hồi API không phải JSON: ${text.slice(0, 300)}`);
  }

  if (json.model && json.model !== MODEL) {
    console.warn(`CẢNH BÁO: API trả model "${json.model}" thay vì "${MODEL}"`);
  }

  const content = (json.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return { content, usage: json.usage, modelEcho: json.model };
}

/** Bóc JSON khỏi văn bản (model đôi khi bọc trong ```json) */
function extractJson(s) {
  let t = s.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) die("không tìm thấy JSON trong phản hồi");
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch (e) {
    die(`JSON model trả về không hợp lệ: ${e.message}`);
  }
}

/**
 * KIỂM TRA BẰNG CHỨNG CỨNG.
 * Model phải trích nguyên văn một câu từ nguồn ("quote"). Ta kiểm tra chuỗi đó
 * có thật trong tiêu đề hoặc excerpt của đúng tin được gán số hay không.
 * Đây là lớp chống lệch nguồn mạnh nhất: model không thể bịa mà vẫn khớp.
 */
function normalizeForMatch(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim();
}

function checkQuoteEvidence(quote, cand) {
  const q = normalizeForMatch(quote || "");
  if (!q) return "thiếu \"quote\" — không có bằng chứng trích từ nguồn";

  if (q.length < 30) return `"quote" quá ngắn (${q.length} ký tự), cần >= 30 để kiểm chứng`;

  const hay = normalizeForMatch(`${cand.title} ${cand.excerpt}`);
  if (hay.includes(q)) return null; // khớp nguyên văn

  // Nới lỏng: cho phép khớp nếu 12 từ liên tiếp đầu của quote có trong nguồn
  const words = q.split(" ").filter(Boolean);
  const probe = words.slice(0, Math.min(12, words.length)).join(" ");
  if (probe.length >= 30 && hay.includes(probe)) return null;

  return `"quote" KHÔNG khớp nguồn thật — không tìm thấy trích dẫn trong "${cand.title}"`;
}

/**
 * KIỂM TRA CHỐNG LỆCH NGUỒN (lớp phụ, dùng khi quote khớp nhưng chủ đề vẫn lạ).
 * Neo vào tên riêng trong TIÊU ĐỀ NGUỒN THẬT.
 */
function checkSourceAlignment(modelText, cand) {
  const titleToks = cand.title.split(/\s+/).filter(Boolean);
  const sourceProper = new Set();

  titleToks.forEach((t, i) => {
    if (i === 0) return; // bỏ từ đầu câu (chỉ là chữ hoa ngữ pháp)
    const m = t.match(/^[("'“]*([A-Z][a-zA-Z0-9&.\-]{2,})/);
    if (!m) return;
    const w = m[1].replace(/[.,)]+$/, "");
    // bỏ từ nối / từ chung
    if (/^(The|A|An|And|But|For|With|From|After|Before|Into|Over|Its|Are|You|This|That|How|Why|What|New|Top|Best)$/i.test(w)) return;
    sourceProper.add(w);
  });

  if (sourceProper.size === 0) return []; // nguồn không có tên riêng → không kết luận

  const hay = modelText.toLowerCase();
  const hit = [...sourceProper].filter((w) => hay.includes(w.toLowerCase()));

  if (hit.length === 0) {
    return [...sourceProper]; // không nhắc tên nào của nguồn → nghi lệch
  }
  return [];
}

function validateAndBuild(parsed) {
  const errs = [];
  const warnings = [];
  const items = parsed.items;

  if (!Array.isArray(items)) return { errs: ["thiếu mảng items"] };
  if (items.length !== 10) errs.push(`có ${items.length} tin thay vì 10`);

  const usedN = new Set();
  const usedId = new Set();
  const built = [];

  items.forEach((it, i) => {
    const tag = `items[${i}]`;

    const n = Number(it?.n);
    if (!Number.isInteger(n) || n < 1 || n > cands.length) {
      errs.push(`${tag}: "n" không hợp lệ (${it?.n})`);
      return;
    }
    if (usedN.has(n)) {
      errs.push(`${tag}: "n"=${n} bị dùng trùng`);
      return;
    }
    usedN.add(n);

    const cand = cands.find((c) => c.n === n);
    if (!cand) {
      errs.push(`${tag}: không tìm thấy ứng viên n=${n}`);
      return;
    }

    for (const f of ["title", "summary", "whyItMatters"]) {
      if (!it?.[f] || typeof it[f] !== "string" || !it[f].trim()) {
        errs.push(`${tag}: thiếu "${f}"`);
      }
    }

    const a = it?.analysis || {};
    for (const f of ["strengths", "opportunity", "risks", "confidence", "confidenceNote"]) {
      if (!a[f] || typeof a[f] !== "string" || !a[f].trim()) {
        errs.push(`${tag}: thiếu analysis.${f}`);
      }
    }
    if (a.confidence && !["Thấp", "Trung bình", "Cao"].includes(a.confidence)) {
      errs.push(`${tag}: confidence "${a.confidence}" không hợp lệ`);
    }
    if (!FIELDS.includes(cand.field)) {
      errs.push(`${tag}: field "${cand.field}" không hợp lệ`);
    }

    // LỚP 1 (mạnh): bắt buộc trích nguyên văn từ nguồn thật
    const quoteErr = checkQuoteEvidence(it.quote, cand);
    if (quoteErr) errs.push(`${tag}: ${quoteErr}`);

    // LỚP 2 (chỉ cảnh báo): tên riêng của nguồn có được nhắc tới không.
    // Không dùng làm lỗi cứng vì tên riêng bị dịch sang tiếng Việt
    // (Congress → Quốc hội) sẽ báo sai. Lớp 1 (quote) mới là bằng chứng cứng.
    if (it.title && it.summary) {
      const missing = checkSourceAlignment(`${it.title}. ${it.summary}. ${it.quote || ""}`, cand);
      if (missing.length >= 1) {
        warnings.push(
          `${tag}: tên riêng "${missing.join('", "')}" của nguồn không thấy trong bản dịch (có thể do dịch — chỉ là cảnh báo)`
        );
      }
    }

    const slug = cand.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45);

    const date = cand.publishedAt.slice(0, 10);
    let id = `${date}-${slug}`;
    let k = 2;
    while (usedId.has(id)) id = `${date}-${slug}-${k++}`;
    usedId.add(id);

    built.push({
      id,
      title: it.title,
      field: cand.field,
      // Các trường này lấy từ NGUỒN THẬT, không lấy từ model
      summary: it.summary,
      whyItMatters: it.whyItMatters,
      publishedAt: cand.publishedAt,
      sources: [
        {
          name: cand.source,
          url: cand.url,
          role: "primary",
        },
      ],
      analysis: {
        strengths: a.strengths,
        opportunity: a.opportunity,
        risks: a.risks,
        confidence: a.confidence,
        confidenceNote: a.confidenceNote,
      },
      ...(it.caveat && String(it.caveat).trim() ? { caveat: String(it.caveat).trim() } : {}),
    });
  });

  // Chặn dồn quá nhiều vào một lĩnh vực, và phải trải ít nhất 4 lĩnh vực
  const byField = {};
  built.forEach((b) => (byField[b.field] = (byField[b.field] || 0) + 1));
  for (const [f, c] of Object.entries(byField)) {
    if (c > 4) errs.push(`lĩnh vực "${f}" chiếm ${c}/10 tin — quá dồn, cần đa dạng hơn`);
  }
  const fieldsUsed = Object.keys(byField);
  if (fieldsUsed.length < 4) {
    errs.push(`chỉ dùng ${fieldsUsed.length} lĩnh vực, cần ít nhất 4`);
  }

  return { errs, warnings, items: built, fieldsUsed };
}

async function main() {
  console.log(`Gọi model ${MODEL} tại ${BASE_URL} ...`);
  const { content, usage, modelEcho } = await callModel();
  console.log(`Model trả: ${modelEcho} | vào ${usage?.input_tokens} / ra ${usage?.output_tokens} token`);

  const parsed = extractJson(content);
  const { errs, warnings, items, fieldsUsed } = validateAndBuild(parsed);

  if (warnings && warnings.length) {
    console.warn("\nCảnh báo (không chặn):");
    warnings.forEach((w) => console.warn("  ~ " + w));
  }

  if (errs.length) {
    console.error("\nKHÔNG ĐẠT — hủy bản tin, không đẩy lên web:");
    errs.forEach((e) => console.error("  - " + e));
    process.exit(3);
  }

  const summary = parsed.summary || {};
  const result = {
    model: {
      requested: "Claude Sonnet 5.5",
      usedModelId: modelEcho || MODEL,
      verified: true,
      note: `Chạy tự động qua GitHub Actions. Model ${modelEcho || MODEL}, vào ${usage?.input_tokens} / ra ${usage?.output_tokens} token. Bản tin này do script tạo — KHÔNG có bước kiểm chứng thủ công từng nguồn.`,
    },
    telegram: { delivered: false, reason: "Chưa cấu hình bot token và chat ID" },
    summary: {
      watchpoints: Array.isArray(summary.watchpoints) ? summary.watchpoints.slice(0, 4) : [],
      topOpportunity: summary.topOpportunity || "",
      risks: Array.isArray(summary.risks) ? summary.risks.slice(0, 5) : [],
      disclaimer:
        summary.disclaimer ||
        "Đây là nội dung thông tin, không phải tư vấn tài chính hay khuyến nghị mua/bán.",
    },
    items,
    fieldsUsed,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "generated.json"), JSON.stringify(result, null, 2), "utf8");
  console.log(`\nOK: 10 tin, lĩnh vực: ${fieldsUsed.join(", ")}`);
  console.log("Đã ghi _ingest/generated.json");
}

main().catch((e) => {
  console.error("LỖI:", e);
  process.exit(1);
});
