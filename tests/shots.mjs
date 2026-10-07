// Tira prints do app em celular (Safari/WebKit e Chrome) e desktop, e lista erros do console.
// Uso: node tests/shots.mjs http://localhost:4173/calc-3d/ <pasta-de-saída>
import { chromium, webkit, devices } from "@playwright/test";

const url = process.argv[2];
const out = process.argv[3];
const targets = [
  { name: "iphone-safari", engine: webkit, device: devices["iPhone 15"] },
  { name: "android-chrome", engine: chromium, device: devices["Pixel 7"] },
  { name: "desktop-chrome", engine: chromium, device: { viewport: { width: 1440, height: 900 } } },
];

for (const t of targets) {
  const browser = await t.engine.launch();
  for (const theme of ["dark", "light"]) {
    const ctx = await browser.newContext({ ...t.device, colorScheme: theme, locale: "pt-BR" });
    const page = await ctx.newPage();
    const logs = [];
    page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
    page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
    await page.route(/googletagmanager|cloudflareinsights|google-analytics/, (r) => r.abort());
    await page.addInitScript(() => localStorage.setItem("nossoprojeto3d-medicao", "denied"));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${out}/${t.name}-${theme}-inicio.png`, fullPage: false });
    await page.screenshot({ path: `${out}/${t.name}-${theme}-pagina.png`, fullPage: true });
    // exemplo preenchido + modo profissional
    await page.getByRole("button", { name: /Ver um exemplo/ }).click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${t.name}-${theme}-exemplo.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${t.name}/${theme}: rolagem horizontal=${overflow}px`, logs.length ? `\n  ${logs.join("\n  ")}` : "(console limpo)");
    await ctx.close();
  }
  await browser.close();
}
