const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:3111";
const OUT = "C:\\Users\\LENOVO\\Documents\\deepseek-harness\\default-workspace\\News\\dashboard\\_shots";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();

  for (const [name, vp] of [
    ["iphone", { width: 390, height: 1400, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ["android", { width: 412, height: 1400, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ]) {
    await page.setViewport(vp);
    await page.goto(BASE, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 500));

    const metrics = await page.evaluate(() => {
      const de = document.documentElement;
      // tìm phần tử tràn ngang
      const overflowing = [];
      document.querySelectorAll("*").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1 && r.width > 0) {
          overflowing.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || "").toString().slice(0, 40),
            right: Math.round(r.right),
          });
        }
      });
      return {
        innerWidth: window.innerWidth,
        clientWidth: de.clientWidth,
        scrollWidth: de.scrollWidth,
        bodyScroll: document.body.scrollWidth,
        overflowing: overflowing.slice(0, 6),
      };
    });

    console.log(`\n=== ${name} (${vp.width}px) ===`);
    console.log(`  innerWidth=${metrics.innerWidth} clientWidth=${metrics.clientWidth}`);
    console.log(`  scrollWidth=${metrics.scrollWidth} bodyScroll=${metrics.bodyScroll}`);

    const hasHScroll = metrics.scrollWidth > metrics.clientWidth + 1;
    console.log(`  tràn ngang: ${hasHScroll ? "CÓ ⚠" : "KHÔNG ✓"}`);
    if (metrics.overflowing.length) {
      console.log("  phần tử tràn:");
      metrics.overflowing.forEach((o) => console.log(`    ${o.tag}.${o.cls} right=${o.right}`));
    }

    await page.screenshot({ path: `${OUT}\\${name}.png`, fullPage: false });
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
