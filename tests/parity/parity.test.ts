// Compara o motor novo com os resultados da V3 (v3-results.json), cenário a
// cenário: validade, todos os valores do orçamento e o link do WhatsApp.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculate, defaultStoreSettings, whatsAppHref, type StoreSettings } from "../../src/lib/calc";
import { formReducer, initialFormState, type FormAction, type FormState } from "../../src/lib/form";

const dir = new URL("./", import.meta.url);
const scenarios = JSON.parse(readFileSync(new URL("scenarios.json", dir), "utf8"));
const v3Path = new URL("v3-results.json", dir);
const v3 = existsSync(v3Path) ? JSON.parse(readFileSync(v3Path, "utf8")) : [];

function runNew(sc: { settings: StoreSettings | null; actions: any[] }) {
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
  return { state, r, href: r ? whatsAppHref(r, settings) : null };
}

describe.skipIf(!v3.length)("paridade com a V3", () => {
  it(`${v3.length} cenários dão exatamente o mesmo resultado`, () => {
    const diffs: string[] = [];
    let validCount = 0;
    for (const old of v3) {
      const sc = scenarios[old.n];
      const { state, r, href } = runNew(sc);
      const tag = `cenário ${old.n}`;
      if (!!r !== old.valid) { diffs.push(`${tag}: validade V3=${old.valid} (${old.firstInvalid}) nova=${!!r}`); continue; }
      if (state.shopeeTier !== old.shopeeTier) diffs.push(`${tag}: faixa Shopee V3=${old.shopeeTier} nova=${state.shopeeTier}`);
      if (state.meliTier !== old.meliTier) diffs.push(`${tag}: faixa ML V3=${old.meliTier} nova=${state.meliTier}`);
      if (!r) continue;
      validCount++;
      const keys = ["finalPrice", "calculatedPrice", "roundingDiff", "totalCost", "profit", "filamentCost", "energyCost",
        "energyKwh", "baseCost", "proCostsTotal", "totalHours", "grams", "hours", "minutes", "jobName", "materialName",
        "printerName", "hasCustomName", "shouldRound", "proMode"] as const;
      for (const k of keys) {
        if ((r as any)[k] !== old.result[k]) diffs.push(`${tag}: ${k} V3=${old.result[k]} nova=${(r as any)[k]}`);
      }
      const newCosts = r.proCosts.map((c) => ({ id: c.id, rawValue: c.rawValue, value: c.value, adType: c.adType }));
      if (JSON.stringify(newCosts) !== JSON.stringify(old.result.proCosts)) {
        diffs.push(`${tag}: custos PRO\n  V3  =${JSON.stringify(old.result.proCosts)}\n  nova=${JSON.stringify(newCosts)}`);
      }
      if (href !== old.href) diffs.push(`${tag}: texto do WhatsApp diferente`);
    }
    expect(diffs.slice(0, 15).join("\n")).toBe("");
    expect(validCount).toBeGreaterThan(v3.length * 0.5);
  });
});
