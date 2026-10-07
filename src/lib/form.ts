/* =========================================================
   ESTADO DO FORMULÁRIO
   Reducer com os mesmos comportamentos automáticos da V3:
   - material preenche o preço/kg (média do catálogo, ou 0.00 em "Outro");
   - margem em % e valor fixo se excluem;
   - desgaste recalcula sozinho quando muda impressora ou tempo (e continua
     editável à mão até uma dessas coisas mudar de novo);
   - Shopee e Mercado Livre: ao ligar, sugere a faixa pelo preço atual
     (só da primeira vez) e uma desliga a outra.
   ========================================================= */

import { MATERIALS, PRINTERS, PRO_COSTS, type ProCostId } from "./data";
import {
  computeAutoWearValue, computeMarketplaceFeeBase, emptyValues, getMeliAdTypeRate, hasCalculablePrintJob,
  pickMeliTier, pickShopeeTier, proFieldId, proToggleId, sanitizeDecimal, sanitizeInteger,
  type FormValues, type MeliTier, type Mode, type ShopeeTier, type StoreSettings,
} from "./calc";

export interface FormState {
  values: FormValues;
  mode: Mode;
  shopeeTier: ShopeeTier;
  meliTier: MeliTier;
  /** último valor que o desgaste preencheu sozinho */
  lastAutoWear: string | null;
  /** campos com erro visível (só aparecem depois de tocar em "Calcular") */
  errors: string[];
  /** aviso rápido pra tela mostrar (ex.: uma taxa de marketplace foi desligada) */
  notice: { text: string; at: number } | null;
}

/** Campos de valor que aceitam vírgula (data-decimal na V3). */
export const DECIMAL_FIELDS = new Set([
  "kwhPrice", "customPrinterPrice", "pricePerKg", "printGrams", "marginPct", "marginFixed",
  "proShopeeCustomPct", "proShopeeCustomFixed", "proMeliCustomPct", "proMeliCustomFixed",
  ...PRO_COSTS.filter((c) => c.id !== "shopee" && c.id !== "meli").map((c) => proFieldId(c.id)),
]);

/** Campos que, ao mudar, fazem o desgaste ser recalculado. */
const WEAR_TRIGGERS = new Set(["printerSelect", "printHours", "printMinutes", "customPrinterPower", "customPrinterPrice"]);

export type FormAction =
  | { type: "set"; id: string; value: string | boolean }
  | { type: "toggle"; cost: ProCostId; on: boolean; settings: StoreSettings }
  | { type: "shopeeTier"; tier: ShopeeTier }
  | { type: "meliTier"; tier: MeliTier }
  | { type: "mode"; mode: Mode }
  | { type: "showErrors"; ids: string[] }
  | { type: "clear"; settings: StoreSettings }
  | { type: "applySettings"; settings: StoreSettings; onlyIfEmpty: boolean }
  | { type: "restore"; snapshot: SavedFormState; settings: StoreSettings }
  | { type: "example"; settings: StoreSettings };

/** Formato salvo em "Meus orçamentos" (igual ao captureFormState da V3). */
export interface SavedFormState {
  mode: Mode;
  values: FormValues;
  shopeeTier: ShopeeTier;
  meliTier: MeliTier;
}

/** Desgaste automático: mesmo comportamento do recalcAutoWear da V3. */
function recalcWear(values: FormValues, lastAutoWear: string | null) {
  const details = computeAutoWearValue(values);
  const id = proFieldId("wear");
  if (!details) {
    if (lastAutoWear !== null && values[id] === lastAutoWear) values[id] = "";
    return null;
  }
  values[id] = details.value.toFixed(2);
  return values[id] as string;
}

/** Aplica as Configurações da loja nos campos (applyStoreSettingsToCalculator da V3). */
function applySettings(state: FormState, settings: StoreSettings, onlyIfEmpty: boolean): FormState {
  let s = state;
  const setIfAllowed = (id: string, value: string) => {
    if (!value) return;
    if (onlyIfEmpty && String(s.values[id] ?? "").trim() !== "") return;
    s = setField(s, id, value);
  };
  setIfAllowed("kwhPrice", settings.kwhPrice);
  setIfAllowed("marginPct", settings.marginPct);
  setIfAllowed(proFieldId("failure"), settings.failurePct);
  setIfAllowed("validityDays", settings.validityDays);

  // impressora padrão: só ao abrir e em "Novo orçamento", nunca no meio de um
  if (!onlyIfEmpty && settings.defaultPrinter && PRINTERS.some((p) => p.id === settings.defaultPrinter)) {
    s = setField(s, "printerSelect", settings.defaultPrinter);
  }
  s = setField(s, "roundToggle", settings.roundDefault !== false);
  return s;
}

/** Atualiza um campo com os efeitos colaterais da V3. */
function setField(state: FormState, id: string, raw: string | boolean): FormState {
  const values = { ...state.values };
  let value = raw;
  if (typeof value === "string") {
    if (DECIMAL_FIELDS.has(id)) value = sanitizeDecimal(value);
    else if (id === "printHours") value = sanitizeInteger(value);
    else if (id === "printMinutes") value = sanitizeInteger(value, 59);
    else if (id === "validityDays") value = sanitizeInteger(value, 365);
  }
  values[id] = value;

  // margem: preencher um dos dois limpa o outro
  if (id === "marginPct" && String(value).trim() !== "") values.marginFixed = "";
  if (id === "marginFixed" && String(value).trim() !== "") values.marginPct = "";

  // material: preenche o preço/kg com a média do catálogo
  if (id === "materialSelect") {
    const material = MATERIALS.find((m) => m.id === value);
    if (material) {
      if (material.id === "outro") values.pricePerKg = "0.00";
      else {
        values.customMaterialName = "";
        values.pricePerKg = (material.pricePerKg as number).toFixed(2);
      }
    }
  }

  let lastAutoWear = state.lastAutoWear;
  if (WEAR_TRIGGERS.has(id)) lastAutoWear = recalcWear(values, lastAutoWear);

  // o erro do campo some assim que a pessoa mexe nele
  const cleared = new Set([id]);
  if (id === "printHours" || id === "printMinutes") { cleared.add("printTime"); }
  if (id === "marginPct" || id === "marginFixed") { cleared.add("margin"); cleared.add("marginPct"); }
  if (id === "customPrinterPrice") cleared.add("customPrinterPower");
  const errors = state.errors.some((e) => cleared.has(e)) ? state.errors.filter((e) => !cleared.has(e)) : state.errors;

  return { ...state, values, lastAutoWear, errors };
}

/** Liga/desliga um custo profissional (bindProCostEvents + exclusividade das taxas). */
function toggleCost(state: FormState, cost: ProCostId, on: boolean, settings: StoreSettings): FormState {
  let s: FormState = { ...state, values: { ...state.values, [proToggleId(cost)]: on } };
  const fieldId = proFieldId(cost);

  if (!on) {
    s.values[fieldId] = "";
    s.errors = s.errors.filter((e) => e !== fieldId);
    return s;
  }

  if (cost === "wear") s.lastAutoWear = recalcWear(s.values, s.lastAutoWear);

  if (cost === "shopee" || cost === "meli") {
    const other: ProCostId = cost === "shopee" ? "meli" : "shopee";
    if (s.values[proToggleId(other)] === true) {
      s.values[proToggleId(other)] = false;
      s.values[proFieldId(other)] = "";
      s.errors = s.errors.filter((e) => e !== proFieldId(other));
      s.notice = {
        text: `${other === "meli" ? "Taxa Mercado Livre" : "Taxa Shopee"} desligada: só dá pra usar uma taxa de marketplace por vez.`,
        at: Date.now(),
      };
    }
    s = ensureTiers(s, settings);
  }
  return s;
}

/**
 * Ainda sem faixa escolhida e com a taxa ligada: sugere a faixa pelo preço
 * atual (ou a primeira, se ainda não dá pra calcular). Depois disso, a
 * escolha da pessoa manda.
 */
export function ensureTiers(state: FormState, settings: StoreSettings): FormState {
  let { shopeeTier, meliTier } = state;
  const v = state.values;
  if (shopeeTier === null && v[proToggleId("shopee")] === true) {
    const base = computeMarketplaceFeeBase(v, state.mode, settings);
    if (base) shopeeTier = hasCalculablePrintJob(v) ? pickShopeeTier(base.base, base.taxRate).tierIndex : 0;
  }
  if (meliTier === null && v[proToggleId("meli")] === true) {
    const base = computeMarketplaceFeeBase(v, state.mode, settings);
    if (base) {
      if (hasCalculablePrintJob(v)) {
        const { commissionPct, fixedFee } = getMeliAdTypeRate(v);
        meliTier = pickMeliTier(base.base, commissionPct, fixedFee, base.taxRate).tier;
      } else meliTier = "below";
    }
  }
  return shopeeTier === state.shopeeTier && meliTier === state.meliTier ? state : { ...state, shopeeTier, meliTier };
}

export function initialFormState(settings: StoreSettings, mode: Mode, customPrinter: { power?: string; price?: string }): FormState {
  const values = emptyValues();
  if (customPrinter.power) values.customPrinterPower = customPrinter.power;
  if (customPrinter.price) values.customPrinterPrice = customPrinter.price;
  const base: FormState = { values, mode, shopeeTier: null, meliTier: null, lastAutoWear: null, errors: [], notice: null };
  return applySettings(base, settings, false);
}

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set":
      return setField(state, action.id, action.value);

    case "toggle":
      return toggleCost(state, action.cost, action.on, action.settings);

    case "shopeeTier":
      return { ...state, shopeeTier: action.tier };

    case "meliTier":
      return { ...state, meliTier: action.tier };

    case "mode":
      return { ...state, mode: action.mode };

    case "showErrors":
      return { ...state, errors: action.ids };

    case "applySettings":
      return applySettings(state, action.settings, action.onlyIfEmpty);

    case "clear": {
      // "Novo orçamento": tudo vazio, mas a "Outra impressora" e o modo ficam
      const values = emptyValues();
      values.customPrinterPower = state.values.customPrinterPower;
      values.customPrinterPrice = state.values.customPrinterPrice;
      const cleared: FormState = { ...state, values, shopeeTier: null, meliTier: null, lastAutoWear: null, errors: [] };
      return applySettings(cleared, action.settings, false);
    }

    case "restore": {
      const snap = action.snapshot;
      const values = { ...emptyValues(), ...state.values };
      // valores salvos por cima; as taxas de marketplace sempre se recalculam pela faixa
      Object.entries(snap.values || {}).forEach(([id, val]) => {
        if (id === proFieldId("shopee") || id === proFieldId("meli")) return;
        values[id] = val;
      });
      const auto = computeAutoWearValue(values);
      const lastAutoWear = auto && values[proFieldId("wear")] === auto.value.toFixed(2) ? auto.value.toFixed(2) : null;
      const next: FormState = {
        ...state,
        values,
        mode: snap.mode === "profissional" ? "profissional" : snap.mode === "basico" ? "basico" : state.mode,
        shopeeTier: snap.shopeeTier ?? null,
        meliTier: snap.meliTier ?? null,
        lastAutoWear,
        errors: [],
      };
      return ensureTiers(next, action.settings);
    }

    case "example": {
      // mesmo exemplo da V3: mantém impressora, kWh e margem se já houver
      const v = state.values;
      const keepPrinter = v.printerSelect && (v.printerSelect !== "custom" || Number(v.customPrinterPower) > 0);
      let s = state;
      const set = (id: string, value: string | boolean) => { s = setField(s, id, value); };
      set("printerSelect", keepPrinter ? String(v.printerSelect) : "a1-combo");
      set("materialSelect", "pla-basic");
      set("pricePerKg", "109.90");
      set("kwhPrice", String(v.kwhPrice || "").trim() || "0.85");
      set("jobName", "Suporte de celular");
      set("printHours", "2");
      set("printMinutes", "30");
      set("printGrams", "45");
      const margin = String(v.marginPct || "").trim() || (String(v.marginFixed || "").trim() ? "" : "100");
      if (margin) set("marginPct", margin);
      return ensureTiers({ ...s, errors: [] }, action.settings);
    }
  }
}
