// Kiểm thử trên PRODUCTION (Vercel), không phải local.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://dashboard-ten-weld-9syckepzij.vercel.app";
const OUT = "C:\\Users\\LENOVO\\Documents\\deepseek-harness\\default-workspace\\News\\dashboard\\_shots";

let fail = 0;
const check = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) fail++;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1100, height: 900 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("requestfailed", (r) => errors.push("REQFAIL " + r.url()));

  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });

  const cards = await page.$$eval("article.card", (n) => n.length);
  check(cards === 5, `5 tin hiển thị (thực tế ${cards})`);

  // Nội dung tiếng Việt có dấu đúng
  const bodyText = await page.evaluate(() => document.body.innerText);
  check(/Tin chính/.test(bodyText), "Nhãn 'Tin chính' giữ đúng dấu tiếng Việt");
  check(/Vì sao đáng chú ý/.test(bodyText), "Nhãn 'Vì sao đáng chú ý' đúng");
  check(/Mức độ chắc chắn|Phân tích Claude Sonnet 5\.5/.test(bodyText), "Có khối phân tích Sonnet");

  // Favourite + persist
  await page.click(".star-btn");
  await new Promise((r) => setTimeout(r, 400));
  const on = await page.$$eval(".star-btn[data-on='true']", (n) => n.length);
  check(on === 1, `Favourite bấm được (${on})`);

  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 700));
  const onReload = await page.$$eval(".star-btn[data-on='true']", (n) => n.length);
  check(onReload === 1, `Favourite còn sau reload trên production (${onReload})`);

  // Trang favourites
  await page.goto(`${BASE}/favourites`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  const favCards = await page.$$eval("article.card", (n) => n.length);
  check(favCards === 1, `Trang Yêu thích có 1 tin (${favCards})`);

  // Mở panel phân tích
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.click(".analysis-toggle");
  await new Promise((r) => setTimeout(r, 400));
  const analysisText = await page.$eval(".analysis-body", (el) => el.innerText);
  check(/Cơ hội đáng nghiên cứu/.test(analysisText), "Panel phân tích mở được");

  // Link nguồn
  const src = await page.$eval(".source-link", (a) => ({
    href: a.getAttribute("href"),
    target: a.getAttribute("target"),
  }));
  check(src.href.startsWith("https://") && src.target === "_blank", "Link nguồn https + tab mới");

  // Mobile thật
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  check(m.sw <= m.cw + 1, `Mobile 390px không tràn ngang (sw=${m.sw} cw=${m.cw})`);
  await page.screenshot({ path: `${OUT}\\prod-mobile.png` });

  // Manifest
  const man = await page.evaluate(async () => {
    const l = document.querySelector('link[rel="manifest"]');
    if (!l) return null;
    const r = await fetch(l.href);
    return { ok: r.ok, json: await r.json() };
  });
  check(man?.ok === true, "Manifest tải được");
  check(man?.json?.display === "standalone", `Manifest display=standalone (${man?.json?.display})`);

  check(errors.length === 0, `0 lỗi console/network (${errors.length})`);
  if (errors.length) errors.slice(0, 6).forEach((e) => console.log("   ! " + e));

  await browser.close();
  console.log(`\n${fail === 0 ? "✓ TẤT CẢ PASS TRÊN PRODUCTION" : "✗ " + fail + " FAIL"}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error("LOI:", e); process.exit(1); });
