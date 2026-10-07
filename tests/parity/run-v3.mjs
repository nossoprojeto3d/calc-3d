// Roda os cenários na V3 original (servida de uma cópia da tag de backup) e
// grava os resultados em v3-results.json.
// Uso: node tests/parity/run-v3.mjs http://localhost:8765/index.html
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const url = process.argv[2];
const scenarios = JSON.parse(readFileSync(new URL("./scenarios.json", import.meta.url)));
const browser = await chromium.launch();
const page = await browser.newPage();
// bloqueia estatísticas externas
await page.route(/googletagmanager|cloudflareinsights|google-analytics|fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());
const results = [];

for (const sc of scenarios) {
  await page.goto("about:blank");
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate((settings) => {
    localStorage.clear();
    localStorage.setItem("nossoprojeto3d-medicao", "denied");
    if (settings) localStorage.setItem("np3d_store_settings", JSON.stringify(settings));
  }, sc.settings);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.getElementById("proWearToggle"));

  const out = await page.evaluate((actions) => {
    const el = (id) => document.getElementById(id);
    for (const a of actions) {
      if (a.t === "mode") document.querySelector(`.mode-switch-btn[data-mode="${a.mode}"]`).click();
      else if (a.t === "set") {
        const input = el(a.id);
        if (input.type === "checkbox") { input.checked = a.v; input.dispatchEvent(new Event("change", { bubbles: true })); }
        else if (input.tagName === "SELECT") { input.value = a.v; input.dispatchEvent(new Event("change", { bubbles: true })); }
        else { input.value = a.v; input.dispatchEvent(new Event("input", { bubbles: true })); }
      } else if (a.t === "toggle") {
        const t = el(`pro${a.cost[0].toUpperCase()}${a.cost.slice(1)}Toggle`);
        t.checked = a.on; t.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (a.t === "shopeeTier") {
        document.querySelector(`#proShopeeTierOptions .tier-option[data-tier="${a.tier}"]`).click();
      } else if (a.t === "meliTier") {
        document.querySelector(`#proMeliTierOptions .tier-option[data-tier="${a.tier}"]`).click();
      }
    }
    // garante que as taxas de marketplace estão em dia com o estado final
    recalcAutoShopee(); recalcAutoMeli();
    lastResult = null;
    const invalid = validateAll({ silent: true });
    if (!invalid) calculate();
    const r = lastResult;
    return {
      valid: !invalid,
      firstInvalid: invalid ? invalid.id : null,
      result: r && {
        ...r,
        proCosts: r.proCosts.map((c) => ({ id: c.id, rawValue: c.rawValue, value: c.value, adType: c.adType })),
        calculatedAt: undefined,
      },
      href: r ? el("whatsappBtn").getAttribute("href") : null,
      shopeeTier: shopeeSelectedTier, meliTier: meliSelectedTier,
    };
  }, sc.actions);
  results.push({ n: sc.n, ...out });
}

writeFileSync(new URL("./v3-results.json", import.meta.url), JSON.stringify(results));
console.log(`V3: ${results.length} cenários, ${results.filter((r) => r.valid).length} válidos`);
await browser.close();
