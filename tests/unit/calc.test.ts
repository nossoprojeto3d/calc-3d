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
