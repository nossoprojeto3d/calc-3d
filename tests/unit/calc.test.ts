// Testes do motor de cálculo. Rodam no GitHub Actions antes de publicar.
// "v3-amostra.json" guarda cenários e resultados gravados da V3 original
// (gerados por tests/parity); o motor novo precisa dar exatamente o mesmo.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculate, defaultStoreSettings, sanitizeDecimal, smartRoundUp, whatsAppHref, type StoreSettings } from "../../src/lib/calc";
import { formReducer, initialFormState, type FormAction, type FormState } from "../../src/lib/form";
import { buildClientWhatsAppText, getClientDetails } from "../../src/lib/cliente";

const amostra: { scenario: { settings: StoreSettings | null; actions: any[] }; v3: any }[] =
  JSON.parse(readFileSync(new URL("./v3-amostra.json", import.meta.url), "utf8"));

function run(sc: { settings: StoreSettings | null; actions: any[] }) {
  const settings = { ...defaultStoreSettings(), ...(sc.settings || {}) };
  let state: FormState = initialFormState(settings, "basico", {});
  const d = (a: FormAction) => { state = formReducer(state, a); };
  for (const a of sc.actions) {
    if (a.t === "mode") d({ type: "mode", mode: a.mode });
    else if (a.t === "set") d({ type: "set", id: a.id, value: a.v });
    else if (a.t === "toggle") d({ type: "toggle", cost: a.cost, on: a.on, settings });
    else if (a.t === "shopeeTier") d({ type: "shopeeTier", tier: a.tier });
    else if (a.t === "meliTier") d({ type: "meliTier", tier: a.tier });
  }
  const r = calculate(state.values, state.mode, settings, state.shopeeTier, state.meliTier);
  return { r, href: r ? whatsAppHref(r, settings) : null };
}

describe("motor de cálculo", () => {
  it("arredonda para o próximo ,99", () => {
    expect(smartRoundUp(6.78)).toBe(6.99);
    expect(smartRoundUp(14)).toBe(14.99);
    expect(smartRoundUp(9.99)).toBe(9.99);
    expect(smartRoundUp(10.990000000000002)).toBe(10.99);
  });

  it("aceita vírgula nos valores", () => {
    expect(sanitizeDecimal("109,90")).toBe("109.90");
    expect(sanitizeDecimal("1.234,5")).toBe("1.2345");
    expect(sanitizeDecimal("abc12,3,4")).toBe("12.34");
  });

  it(`${amostra.length} cenários dão o mesmo resultado da V3`, () => {
    for (const { scenario, v3 } of amostra) {
      const { r, href } = run(scenario);
      expect(!!r).toBe(v3.valid);
      if (!r) continue;
      expect(r.finalPrice).toBe(v3.result.finalPrice);
      expect(r.calculatedPrice).toBe(v3.result.calculatedPrice);
      expect(r.totalCost).toBe(v3.result.totalCost);
      expect(r.profit).toBe(v3.result.profit);
      expect(r.proCosts.map((c) => ({ id: c.id, rawValue: c.rawValue, value: c.value, adType: c.adType })))
        .toEqual(v3.result.proCosts.map((c: any) => ({ ...c, adType: c.adType ?? undefined })));
      expect(href).toBe(v3.href);
    }
  });
});

describe("orçamento para o cliente", () => {
  const settings = { ...defaultStoreSettings(), storeName: "Ateliê Camadas", city: "Goiânia/GO" };
  const base = { ...amostra.find((a) => a.v3.valid)!.scenario };
  const { r } = run(base);

  it("mostra só preço e dados do cliente, nunca custos ou lucro", () => {
    const at = new Date(2026, 9, 7, 10, 0);
    const d = getClientDetails({ clientName: " Maria ", deliveryTime: "5 dias", validityDays: "7", notes: "" }, at);
    const text = buildClientWhatsAppText({ ...r!, calculatedAt: at }, d, settings);
    expect(text.split("\n")[0]).toBe("Olá, Maria! Segue o orçamento 😊");
    expect(text).toContain("⏳ Válido até 14/10/2026");
    expect(text).toContain("🏪 Ateliê Camadas · Goiânia/GO");
    expect(text).not.toMatch(/Custo|Lucro|Energia|Filamento:|Taxa|Impostos/);
  });

  it("sem validade e sem nome, sai neutro", () => {
    const d = getClientDetails({ clientName: "", deliveryTime: "", validityDays: "", notes: "" }, new Date());
    const text = buildClientWhatsAppText(r!, d, defaultStoreSettings());
    expect(text.split("\n")[0]).toBe("Olá! Segue o orçamento 😊");
    expect(text).not.toContain("Válido");
    expect(text).not.toContain("🏪");
  });
});

describe("peças na mesa", () => {
  const settings = { ...defaultStoreSettings(), hourlyRate: "30" };
  function plate(qty: string, extra: FormAction[] = [], mode: "basico" | "profissional" = "basico") {
    let state: FormState = initialFormState(settings, mode, {});
    const d = (a: FormAction) => { state = formReducer(state, a); };
    d({ type: "set", id: "printerSelect", value: "a1-combo" });
    d({ type: "set", id: "kwhPrice", value: "0.85" });
    d({ type: "set", id: "materialSelect", value: "pla-basic" });
    d({ type: "set", id: "printHours", value: "5" });
    d({ type: "set", id: "printMinutes", value: "0" });
    d({ type: "set", id: "printGrams", value: "120" });
    d({ type: "set", id: "marginPct", value: "100" });
    d({ type: "set", id: "plateQty", value: qty });
    extra.forEach(d);
    return { r: calculate(state.values, state.mode, settings, state.shopeeTier, state.meliTier)!, state };
  }
  const piece = (extra: FormAction[] = [], mode: "basico" | "profissional" = "basico") => {
    // a mesma peça calculada sozinha: 1/20 do tempo (15 min) e do peso (6 g)
    let state: FormState = initialFormState(settings, mode, {});
    const d = (a: FormAction) => { state = formReducer(state, a); };
    d({ type: "set", id: "printerSelect", value: "a1-combo" });
    d({ type: "set", id: "kwhPrice", value: "0.85" });
    d({ type: "set", id: "materialSelect", value: "pla-basic" });
    d({ type: "set", id: "printHours", value: "0" });
    d({ type: "set", id: "printMinutes", value: "15" });
    d({ type: "set", id: "printGrams", value: "6" });
    d({ type: "set", id: "marginPct", value: "100" });
    extra.forEach(d);
    return calculate(state.values, state.mode, settings, state.shopeeTier, state.meliTier)!;
  };

  it("vazio ou 1 é igual ao cálculo de sempre", () => {
    expect(plate("").r.finalPrice).toBe(plate("1").r.finalPrice);
    expect(plate("1").r.quantity).toBe(1);
    expect(whatsAppHref(plate("1").r, settings)).not.toContain(encodeURIComponent("por peça"));
  });

  it("20 peças: cada uma custa 1/20 da mesa, e o total é preço × 20", () => {
    const { r } = plate("20");
    const one = piece();
    expect(r.quantity).toBe(20);
    expect(r.filamentCost).toBeCloseTo(one.filamentCost, 10);
    expect(r.energyCost).toBeCloseTo(one.energyCost, 10);
    expect(r.finalPrice).toBe(one.finalPrice);
    expect(r.plateTotal).toBe(Math.round(r.finalPrice * 20 * 100) / 100);
    expect(r.pieceGrams).toBe(6);
    expect(r.pieceMinutes).toBeCloseTo(15, 10);
  });

  it("profissional: preparo é da mesa (dividido); embalagem e taxa da Shopee são por peça", () => {
    const pro = (s: FormAction[]) => s;
    const costs = pro([
      { type: "toggle", cost: "labor", on: true, settings },
      { type: "set", id: "proLabor", value: "20" },
      { type: "toggle", cost: "packaging", on: true, settings },
      { type: "set", id: "proPackaging", value: "1.5" },
      { type: "toggle", cost: "shopee", on: true, settings },
    ]);
    const { r } = plate("20", costs, "profissional");
    const one = piece([
      { type: "toggle", cost: "labor", on: true, settings },
      { type: "set", id: "proLabor", value: "1" },
      { type: "toggle", cost: "packaging", on: true, settings },
      { type: "set", id: "proPackaging", value: "1.5" },
      { type: "toggle", cost: "shopee", on: true, settings },
    ], "profissional");
    const value = (x: typeof r, id: string) => x.proCosts.find((c) => c.id === id)!.value;
    expect(value(r, "labor")).toBeCloseTo(0.5, 10); // 20min × R$30/h ÷ 20
    expect(value(r, "packaging")).toBe(1.5);
    expect(value(r, "shopee")).toBe(value(one, "shopee"));
    expect(r.finalPrice).toBe(one.finalPrice);
  });

  it("desgaste automático é dividido entre as peças", () => {
    const wear = [{ type: "toggle", cost: "wear", on: true, settings }] as FormAction[];
    const a = plate("1", wear, "profissional").state.values.proWear;
    const b = plate("4", wear, "profissional").state.values.proWear;
    expect(Number(b)).toBeCloseTo(Number(a) / 4, 2);
  });

  it("textos: completo por peça com total; cliente com quantidade e total, sem custos", () => {
    const { r } = plate("20");
    const full = decodeURIComponent(whatsAppHref(r, settings).split("text=")[1]);
    expect(full).toContain("🔢 Peças na mesa: 20");
    expect(full).toContain("15min por peça");
    expect(full).toContain(`✅ *Preço por peça: `);
    expect(full).toContain(`🧮 *Total (20 peças): `);
    const d = getClientDetails({ clientName: "", deliveryTime: "", validityDays: "", notes: "" }, new Date());
    const client = buildClientWhatsAppText(r, d, settings);
    expect(client).toContain("🔢 Quantidade: 20 peças");
    expect(client).toContain("💵 Valor por peça: ");
    expect(client).toContain("💰 *Total: ");
    expect(client).not.toMatch(/Custo|Lucro|Energia|Filamento:|Taxa|Impostos|preparo/);
  });
});

describe("preço de venda próprio", () => {
  const settings = defaultStoreSettings();
  function calc(extra: FormAction[] = [], mode: "basico" | "profissional" = "basico") {
    let state: FormState = initialFormState(settings, mode, {});
    const d = (a: FormAction) => { state = formReducer(state, a); };
    d({ type: "set", id: "printerSelect", value: "a1-combo" });
    d({ type: "set", id: "kwhPrice", value: "0.85" });
    d({ type: "set", id: "materialSelect", value: "pla-basic" });
    d({ type: "set", id: "printHours", value: "2" });
    d({ type: "set", id: "printMinutes", value: "30" });
    d({ type: "set", id: "printGrams", value: "45" });
    d({ type: "set", id: "marginPct", value: "100" });
    extra.forEach(d);
    return calculate(state.values, state.mode, settings, state.shopeeTier, state.meliTier)!;
  }
  const sale = (v: string): FormAction => ({ type: "set", id: "salePrice", value: v });

  it("vazio: igual ao sugerido", () => {
    const r = calc();
    expect(r.customPrice).toBe(false);
    expect(r.suggestedPrice).toBe(r.finalPrice);
  });

  it("básico: o preço é o digitado e o lucro é preço − custo", () => {
    const sug = calc();
    const r = calc([sale("25,00")]);
    expect(r.customPrice).toBe(true);
    expect(r.finalPrice).toBe(25);
    expect(r.suggestedPrice).toBe(sug.finalPrice);
    expect(r.totalCost).toBeCloseTo(sug.totalCost, 10);
    expect(r.profit).toBeCloseTo(25 - sug.totalCost, 10);
    expect(r.roundingDiff).toBe(0);
    expect(decodeURIComponent(whatsAppHref(r, settings)).replace(/\u00a0/g, " ")).toContain("✅ *Preço final: R$ 25,00*");
  });

  it("abaixo do custo: lucro negativo", () => {
    expect(calc([sale("1")]).profit).toBeLessThan(0);
  });

  it("imposto e Shopee são refeitos sobre o preço digitado", () => {
    const pro: FormAction[] = [
      { type: "toggle", cost: "taxes", on: true, settings },
      { type: "set", id: "proTaxes", value: "6" },
      { type: "toggle", cost: "shopee", on: true, settings },
    ];
    const r = calc([...pro, sale("50")], "profissional");
    const value = (id: string) => r.proCosts.find((c) => c.id === id)!.value;
    expect(value("taxes")).toBeCloseTo(3, 10); // 6% de 50
    expect(value("shopee")).toBeCloseTo(50 * 0.2 + 4, 10); // faixa de R$ 8 a R$ 80
    // o que sobra depois de todos os custos é o lucro
    expect(r.finalPrice - r.totalCost).toBeCloseTo(r.profit, 10);
  });

  it("várias peças: o preço é por peça e o total multiplica", () => {
    const r = calc([{ type: "set", id: "plateQty", value: "4" }, sale("12,5")]);
    expect(r.finalPrice).toBe(12.5);
    expect(r.plateTotal).toBe(50);
  });
});
