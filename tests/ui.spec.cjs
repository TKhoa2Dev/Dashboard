// Kiểm thử tương tác thật trên Chrome headless: favourite, phân tích, lọc, tìm kiếm, theme.
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:3111";

const log = (ok, msg) => console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);

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
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  let failures = 0;
  const check = (cond, msg) => {
    log(cond, msg);
    if (!cond) failures++;
  };

  await page.goto(BASE, { waitUntil: "networkidle0" });

  // 1. Số tin
  const cards = await page.$$eval("article.card", (n) => n.length);
  check(cards === 5, `Có đúng 5 tin (thực tế: ${cards})`);

  // 2. Mở panel phân tích
  const toggle = await page.$(".analysis-toggle");
  await toggle.click();
  await new Promise((r) => setTimeout(r, 350));
  const analysisVisible = await page.$eval(".analysis-body", (el) => el.offsetHeight > 0).catch(() => false);
  check(analysisVisible, "Bấm mở được 'Phân tích Claude Sonnet 5.5'");

  const analysisText = await page.$eval(".analysis-body", (el) => el.innerText);
  check(/Mức độ chắc chắn/.test(analysisText), "Panel phân tích có mục 'Mức độ chắc chắn'");
  check(/Cơ hội đáng nghiên cứu/.test(analysisText), "Panel phân tích có mục 'Cơ hội đáng nghiên cứu'");

  // 3. Favourite
  const star = await page.$(".star-btn");
  const before = await page.$$eval(".star-btn[data-on='true']", (n) => n.length);
  await star.click();
  await new Promise((r) => setTimeout(r, 350));
  const after = await page.$$eval(".star-btn[data-on='true']", (n) => n.length);
  check(after === before + 1, `Bấm sao lưu được favourite (${before} → ${after})`);

  // 4. Persist qua reload
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  const afterReload = await page.$$eval(".star-btn[data-on='true']", (n) => n.length);
  check(afterReload === 1, `Favourite còn sau khi reload (thực tế: ${afterReload})`);

  // 5. Trang Yêu thích
  await page.goto(`${BASE}/favourites`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const favCards = await page.$$eval("article.card", (n) => n.length);
  check(favCards === 1, `Trang Yêu thích hiển thị 1 tin (thực tế: ${favCards})`);

  // 6. Bỏ favourite -> empty state
  await page.click(".star-btn");
  await new Promise((r) => setTimeout(r, 400));
  const emptyShown = await page.$eval(".empty-title", (el) => el.textContent || "").catch(() => "");
  check(/Chưa có tin yêu thích/.test(emptyShown), "Bỏ hết favourite hiện empty state");

  // 7. Lọc theo lĩnh vực
  await page.goto(BASE, { waitUntil: "networkidle0" });
  const chips = await page.$$(".chips .chip");
  // chip[0] = Tất cả, chip[1] = AI
  await chips[1].click();
  await new Promise((r) => setTimeout(r, 350));
  const aiCards = await page.$$eval("article.card", (n) => n.length);
  check(aiCards === 1, `Lọc "AI" còn 1 tin (thực tế: ${aiCards})`);

  // 8. Tìm kiếm
  await page.click(".chips .chip"); // về Tất cả
  await new Promise((r) => setTimeout(r, 250));
  await page.type(".search input", "Binance");
  await new Promise((r) => setTimeout(r, 450));
  const searchCards = await page.$$eval("article.card", (n) => n.length);
  check(searchCards === 1, `Tìm "Binance" còn 1 tin (thực tế: ${searchCards})`);

  // 9. Tìm không ra
  await page.click(".search input", { clickCount: 3 });
  await page.type(".search input", "zzzznope");
  await new Promise((r) => setTimeout(r, 450));
  const emptySearch = await page.$eval(".empty-title", (el) => el.textContent || "").catch(() => "");
  check(/Không có tin nào khớp/.test(emptySearch), "Tìm không ra hiện empty state");

  // 10. Theme toggle
  await page.goto(BASE, { waitUntil: "networkidle0" });
  const themeBefore = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  await page.click(".icon-btn");
  await new Promise((r) => setTimeout(r, 300));
  const themeAfter = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check(themeBefore !== themeAfter, `Đổi được theme (${themeBefore} → ${themeAfter})`);

  // 11. Link nguồn mở tab mới, đúng URL
  const src = await page.$eval(".source-link", (a) => ({
    href: a.getAttribute("href"),
    target: a.getAttribute("target"),
    rel: a.getAttribute("rel"),
  }));
  check(/^https?:\/\//.test(src.href) && src.target === "_blank", `Link nguồn hợp lệ + target=_blank (${src.href.slice(0, 42)}…)`);
  check((src.rel || "").includes("noopener"), "Link nguồn có rel=noopener");

  // 12. Không có lỗi console
  check(errors.length === 0, `Không có lỗi console (${errors.length} lỗi)`);
  if (errors.length) errors.slice(0, 5).forEach((e) => console.log("   ! " + e));

  await browser.close();
  console.log(`\n${failures === 0 ? "TẤT CẢ PASS" : failures + " TEST FAIL"}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error("LỖI CHẠY TEST:", e);
  process.exit(1);
});
