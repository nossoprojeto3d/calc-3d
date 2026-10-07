// Roteiro de teste do CLAUDE.md, automatizado. Roda em celular (Safari e Chrome) e desktop.
// As contas são refeitas aqui, à mão, com a fórmula do README.
import { expect, test, type Page } from "@playwright/test";

const errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  // estatísticas externas fora do teste (e aviso de cookies já respondido)
  await page.route(/googletagmanager|cloudflareinsights|google-analytics/, (r) => r.abort());
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("np3d_teste")) {
      localStorage.clear();
      localStorage.setItem("nossoprojeto3d-medicao", "denied");
      localStorage.setItem("np3d_free_popup_last_shown", String(Date.now()));
      sessionStorage.setItem("np3d_teste", "1");
    }
  });
});

test.afterEach(() => {
  // só o bloqueio proposital das estatísticas pode aparecer
  expect(errors.filter((e) => !/ERR_FAILED|Failed to load resource|cloudflareinsights|Access-Control-Allow-Origin/.test(e))).toEqual([]);
});

const price = async (page: Page) => {
  await page.waitForTimeout(100);
  return Number(await page.locator("#precoFinal").getAttribute("data-value"));
};

async function pickPrinter(page: Page, search: string, name: RegExp) {
  await page.locator("#printerSelect").click();
  await page.getByRole("searchbox", { name: "Buscar impressora" }).fill(search);
  await page.getByRole("dialog").getByRole("button", { name }).first().click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function fillBasic(page: Page) {
  await pickPrinter(page, "P1S", /P1S/);
  await page.locator("#materialSelect").click();
  await page.getByRole("searchbox", { name: "Buscar filamento" }).fill("matte");
  await page.getByRole("dialog").getByRole("button", { name: /PLA Matte/ }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#pricePerKg")).toHaveValue("119,90");
  await page.fill("#kwhPrice", "0,92");
  await page.fill("#printHours", "3");
  await page.fill("#printMinutes", "15");
  await page.fill("#printGrams", "62,5");
  await page.fill("#marginPct", "150");
}

test("1. abre sem erros, sem violação de CSP e sem rolagem horizontal", async ({ page }) => {
  const csp: string[] = [];
  page.on("console", (m) => { if (/Content.Security.Policy|CSP/i.test(m.text())) csp.push(m.text()); });
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Quanto cobrar");
  expect(csp).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test("2. modo Básico confere com a fórmula, e 5. arredonda para ,99", async ({ page }) => {
  await page.goto("./");
  await fillBasic(page);
  // filamento + energia + 150% de lucro
  const filament = (62.5 / 1000) * 119.9;
  const energy = (350 / 1000) * 3.25 * 0.92;
  const expected = (filament + energy) * 2.5;
  expect(await price(page)).toBe(Math.floor(Math.round(expected * 100) / 100) + 0.99); // arredondado: 21,99
  await page.locator("#roundToggle").click();
  expect(await price(page)).toBeCloseTo(expected, 10);
});

test("3. modo Profissional: desgaste, mão de obra e embalagem sobem o preço", async ({ page }) => {
  await page.goto("./");
  await fillBasic(page);
  await page.locator("#roundToggle").click();
  const basic = await price(page);
  await page.getByRole("tab", { name: "Profissional" }).click();
  await page.locator("#proWearToggle").click();
  await expect(page.locator("#proWear")).toHaveValue("2,44"); // 7.500 ÷ 10.000h × 3h15
  await page.locator("#proLaborToggle").click();
  await page.fill("#proLabor", "20"); // 20min × R$ 30/h = R$ 10
  await page.locator("#proPackagingToggle").click();
  await page.fill("#proPackaging", "3,50");
  const base = (62.5 / 1000) * 119.9 + 0.35 * 3.25 * 0.92;
  const expected = (base + 2.44 + 10 + 3.5) * 2.5;
  const pro = await price(page);
  expect(pro).toBeCloseTo(expected, 10);
  expect(pro).toBeGreaterThan(basic);
});

test("4. Shopee e Mercado Livre: o preço final cobre a comissão e o imposto", async ({ page }) => {
  await page.goto("./");
  await fillBasic(page);
  await page.locator("#roundToggle").click();
  await page.getByRole("tab", { name: "Profissional" }).click();
  await page.locator("#proTaxesToggle").click();
  await page.fill("#proTaxes", "6");
  const costsAndProfit = ((62.5 / 1000) * 119.9 + 0.35 * 3.25 * 0.92) * 2.5;

  await page.locator("#proShopeeToggle").click();
  // faixa sugerida sozinha: R$ 8 a R$ 79,99 (20% + R$ 4)
  await expect(page.getByRole("button", { name: /De R\$ 8,00 a R\$ 79,99/ })).toHaveAttribute("aria-pressed", "true");
  let p = await price(page);
  expect(Math.abs(p * (1 - 0.20 - 0.06) - (costsAndProfit + 4))).toBeLessThan(0.01);

  await page.locator("#proMeliToggle").click();
  await expect(page.getByText("Taxa Shopee desligada")).toBeVisible();
  await expect(page.locator("#proShopeeToggle")).toHaveAttribute("aria-checked", "false");
  p = await price(page);
  // Premium 17%; abaixo de R$ 79 com R$ 6 fixo
  expect(Math.abs(p * (1 - 0.17 - 0.06) - (costsAndProfit + 6))).toBeLessThan(0.01);
});

test("6. Meus orçamentos: salvar, apagar com o lixinho e Limpar tudo", async ({ page }) => {
  await page.goto("./");
  await fillBasic(page);
  await page.fill("#jobName", "Vaso <b>teste</b>");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Meus orçamentos" })).toContainText("1");

  await page.getByRole("button", { name: "Novo orçamento" }).click();
  await page.getByRole("button", { name: /Ver um exemplo/ }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  await page.getByRole("button", { name: "Meus orçamentos" }).click();
  const sheet = page.getByRole("dialog");
  // texto digitado aparece como texto, nunca como HTML
  await expect(sheet.getByText("Vaso <b>teste</b>")).toBeVisible();
  await sheet.getByRole("button", { name: "Excluir Vaso <b>teste</b>" }).click();
  await expect(sheet.getByText("Vaso <b>teste</b>")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Limpar tudo" }).click();
  await expect(sheet.getByText("Tudo apagado")).toBeVisible();
  await sheet.getByRole("button", { name: "Desfazer" }).click();
  await expect(sheet.getByText("Suporte de celular")).toBeVisible();
  await sheet.getByRole("button", { name: "Limpar tudo" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("np3d_history") || "[]").length)).toBe(0);
});

test("6b. abre orçamentos salvos pela V3", async ({ page }) => {
  await page.goto("./");
  // orçamento salvo no formato da V3 (mesmas chaves)
  await page.evaluate(() => {
    localStorage.setItem("np3d_history", JSON.stringify([{
      id: "bv3teste", savedAt: Date.now() - 86400000, name: "Chaveiro V3", price: 18.99,
      printerName: "Bambu Lab A1 Mini", materialName: "PETG Basic", time: "1h10", grams: 22, proMode: true,
      state: { mode: "profissional", shopeeTier: null, meliTier: null, values: {
        customPrinterPower: "", customPrinterPrice: "", printerSelect: "a1-mini", kwhPrice: "0.85",
        materialSelect: "petg-basic", pricePerKg: "109.90", customMaterialName: "", jobName: "Chaveiro V3",
        printHours: "1", printMinutes: "10", printGrams: "22", marginPct: "200", marginFixed: "", roundToggle: true,
        proWearToggle: true, proWear: "0.42", proLaborToggle: true, proLabor: "15", proFailureToggle: false, proFailure: "",
        proPackagingToggle: true, proPackaging: "2", proMaterialsToggle: false, proMaterials: "",
        proShopeeToggle: false, proMeliToggle: false, proMeliAdType: "premium", proShippingToggle: false, proShipping: "",
        proTaxesToggle: false, proTaxes: "", proShopeeCustomPct: "", proShopeeCustomFixed: "", proMeliCustomPct: "", proMeliCustomFixed: "",
      } },
    }]));
  });
  // espera o service worker terminar de registrar antes de recarregar
  await page.evaluate(() => navigator.serviceWorker?.ready);
  await page.reload();
  await page.getByRole("button", { name: "Meus orçamentos" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Chaveiro V3/ }).click();
  // (2,4178 + 0,1402 + 0,42 + 7,50 + 2) × 3 = 37,43 → 37,99
  const base = (22 / 1000) * 109.9 + 0.18 * (1 + 10 / 60) * 0.85;
  const expected = Math.floor(Math.round((base + 0.42 + 7.5 + 2) * 3 * 100) / 100) + 0.99;
  expect(await price(page)).toBe(expected);
  await expect(page.locator("#proWear")).toHaveValue("0,42");
});

test("7. WhatsApp: link e emojis no texto (versão completa)", async ({ page }) => {
  await page.goto("./");
  await fillBasic(page);
  await page.getByRole("radio", { name: "Mim (completo)" }).click();
  const href = await page.getByRole("link", { name: "Enviar no WhatsApp" }).getAttribute("href");
  expect(href).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?text=/);
  // o real usa espaço não separável depois do "R$", como na V3
  const text = decodeURIComponent(href!.split("text=")[1]).replace(/\u00a0/g, " ");
  expect(text).toContain("🧾 *Orçamento — Peça personalizada*");
  expect(text).toContain("🖨️ Impressora: Bambu Lab P1S");
  expect(text).toContain("⚡ Energia: R$");
  expect(text).toContain("✅ *Preço final: R$ 21,99*");
  expect(text).not.toContain("�");
});

test("8. PDF: gera o arquivo", async ({ page }) => {
  await page.goto("./");
  await fillBasic(page);
  await page.fill("#jobName", "Suporte de fone");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^orcamento-suporte-de-fone-\d{4}-\d{2}-\d{2}\.pdf$/);
});

test("9. campos com 16px ou mais (sem zoom no iPhone)", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("tab", { name: "Profissional" }).click();
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("input, select, textarea")]
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => el.id || el.outerHTML.slice(0, 60)));
  expect(small).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test("validação: Calcular mostra o que falta e leva até o campo", async ({ page }) => {
  await page.goto("./");
  await page.locator("#calcBtn").click();
  // mesma ordem da V3: o material é o primeiro campo conferido
  await expect(page.getByText("Selecione um material.")).toBeVisible();
  await expect(page.getByText("Informe o valor do kWh da sua energia.")).toBeVisible();
  await expect(page.locator("#materialSelect")).toBeFocused();
  // e a tela rola até ele (no Safari o foco chegou a cancelar a rolagem)
  await expect(page.locator("#materialSelect")).toBeInViewport();
  await page.fill("#kwhPrice", "0,85");
  await expect(page.getByText("Informe o valor do kWh da sua energia.")).toHaveCount(0);
});

test("10. orçamento para o cliente: sem custos e com os dados da loja", async ({ page }) => {
  await page.goto("./");
  await fillBasic(page);
  // começa na versão do cliente, com lembrete pra configurar a loja
  await expect(page.getByRole("radio", { name: "Cliente", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Coloque o nome e o logo da sua loja")).toBeVisible();

  await page.getByRole("button", { name: /Dados para o cliente/ }).click();
  await page.fill("#clientName", "Maria <Souza>");
  await page.fill("#deliveryTime", "5 dias úteis");
  await expect(page.locator("#validityDays")).toHaveValue("7");
  await page.fill("#notes", "Cor preta 🖤");

  const href = await page.getByRole("link", { name: "Enviar ao cliente" }).getAttribute("href");
  const text = decodeURIComponent(href!.split("text=")[1]).replace(/\u00a0/g, " ");
  expect(text).toContain("Olá, Maria <Souza>! Segue o orçamento 😊");
  expect(text).toContain("🧾 *Peça personalizada*");
  expect(text).toContain("🧵 Material: PLA Matte");
  expect(text).toContain("📅 Prazo: 5 dias úteis");
  expect(text).toContain("💰 *Valor: R$ 21,99*");
  expect(text).toMatch(/⏳ Válido até \d{2}\/\d{2}\/\d{4}/);
  expect(text).toContain("📝 Cor preta 🖤");
  for (const internal of ["Custo", "Lucro", "Energia", "Filamento", "Impressora"]) expect(text).not.toContain(internal);
  expect(text).not.toContain("\uFFFD");

  // loja configurada: o lembrete some e a assinatura entra
  await page.getByRole("button", { name: "Configurar" }).click();
  await page.getByLabel("Escolher logo da loja").setInputFiles("public/assets/logo.png");
  await expect(page.getByRole("img", { name: "Logo da sua loja" })).toBeVisible();
  await page.fill("#settingsStoreName", "Ateliê Camadas");
  await page.getByRole("dialog").getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Coloque o nome e o logo da sua loja")).toHaveCount(0);
  const href2 = await page.getByRole("link", { name: "Enviar ao cliente" }).getAttribute("href");
  expect(decodeURIComponent(href2!)).toContain("🏪 Ateliê Camadas");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^orcamento-peca-personalizada-maria-souza-\d{4}-\d{2}-\d{2}\.pdf$/);
});
