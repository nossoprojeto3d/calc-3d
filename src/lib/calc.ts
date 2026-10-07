/* =========================================================
   MOTOR DE CÁLCULO
   Porte fiel da lógica do script.js da V3, sem tela: mesmas fórmulas, mesma
   ordem de soma e os mesmos arredondamentos intermediários (a V3 guardava
   desgaste e taxas de marketplace em campos com toFixed(2), então esses
   valores entram na conta já arredondados em centavos).
   A conferência contra a V3 roda em tests/paridade (ver README).

   O estado do formulário usa as mesmas chaves (ids dos campos) da V3, pra que
   os orçamentos já salvos em "Meus orçamentos" continuem abrindo.
   ========================================================= */

import {
  CUSTOM_PRINTER_ID, CUSTOM_PRINTER_LIFESPAN_HOURS, DEFAULT_HOURLY_RATE, DEFAULT_JOB_NAME,
  GROUP1_PRO_COST_IDS, MATERIALS, MELI_DEFAULT_SETTINGS, MELI_PRICE_THRESHOLD, PRINTERS, PRO_COSTS,
  SHOPEE_DEFAULT_TIERS, SHOPEE_TIER_RANGES, type ProCost, type ProCostId,
} from "./data";

export type Mode = "basico" | "profissional";
export type ShopeeTier = 0 | 1 | 2 | "custom" | null;
export type MeliTier = "below" | "from" | "custom" | null;

/** Valores do formulário, com as chaves = ids dos campos da V3. */
export type FormValues = Record<string, string | boolean>;

export interface StoreSettings {
  kwhPrice: string; marginPct: string; failurePct: string;
  hourlyRate: string; defaultPrinter: string;
  storeName: string; city: string; whatsapp: string; instagram: string;
  roundDefault: boolean;
  /** validade padrão do orçamento do cliente, em dias ("" = sem validade) */
  validityDays: string;
}

export const defaultStoreSettings = (): StoreSettings => ({
  kwhPrice: "", marginPct: "", failurePct: "",
  hourlyRate: "", defaultPrinter: "",
  storeName: "", city: "", whatsapp: "", instagram: "",
  roundDefault: true,
  validityDays: "7",
});

/** "wear" -> "proWear" (mesmo id da V3) */
export const proFieldId = (id: ProCostId) => `pro${id.charAt(0).toUpperCase()}${id.slice(1)}`;
export const proToggleId = (id: ProCostId) => `${proFieldId(id)}Toggle`;

/** Formulário vazio, igual à V3 ao abrir (primeira impressora da lista, sem material). */
export function emptyValues(): FormValues {
  const v: FormValues = {
    customPrinterPower: "", customPrinterPrice: "",
    printerSelect: PRINTERS[0].id, kwhPrice: "",
    materialSelect: "", pricePerKg: "", customMaterialName: "",
    jobName: "", printHours: "", printMinutes: "", printGrams: "",
    marginPct: "", marginFixed: "", roundToggle: true,
    proMeliAdType: "premium",
    proShopeeCustomPct: "", proShopeeCustomFixed: "",
    proMeliCustomPct: "", proMeliCustomFixed: "",
    // dados do orçamento para o cliente (não entram na conta)
    clientName: "", deliveryTime: "", validityDays: "", notes: "",
  };
  PRO_COSTS.forEach((c) => { v[proToggleId(c.id)] = false; v[proFieldId(c.id)] = ""; });
  return v;
}

const str = (v: FormValues, id: string) => String(v[id] ?? "");
const bool = (v: FormValues, id: string) => v[id] === true;

// ---------------------------------------------------------
// ENTRADA DE NÚMEROS (iguais à V3)
// ---------------------------------------------------------

/** Campos de valor aceitam vírgula: ela vira ponto e sobra um separador só. */
export function sanitizeDecimal(raw: string): string {
  let value = String(raw).replace(/,/g, ".").replace(/[^\d.]/g, "");
  const dot = value.indexOf(".");
  if (dot >= 0) value = value.slice(0, dot + 1) + value.slice(dot + 1).replace(/\./g, "");
  return value;
}

/** Horas e minutos: só dígitos, com teto opcional (minutos até 59). */
export function sanitizeInteger(raw: string, maxValue?: number): string {
  let digitsOnly = String(raw).replace(/[^\d]/g, "");
  if (typeof maxValue === "number" && digitsOnly !== "" && Number(digitsOnly) > maxValue) {
    digitsOnly = String(maxValue);
  }
  return digitsOnly;
}

// ---------------------------------------------------------
// IMPRESSORA, VALOR-HORA, DESGASTE
// ---------------------------------------------------------
export interface SelectedPrinter {
  id: string; name: string; power: number; avgPurchasePrice: number; avgLifespanHours: number; desc?: string;
}

export function getSelectedPrinter(v: FormValues): SelectedPrinter | null {
  if (str(v, "printerSelect") === CUSTOM_PRINTER_ID) {
    const power = parseFloat(str(v, "customPrinterPower")) || 0;
    if (power <= 0) return null;
    const price = parseFloat(str(v, "customPrinterPrice")) || 0;
    return {
      id: CUSTOM_PRINTER_ID,
      name: `Outra impressora (${power}W)`,
      power,
      avgPurchasePrice: price,
      avgLifespanHours: CUSTOM_PRINTER_LIFESPAN_HOURS,
    };
  }
  return PRINTERS.find((p) => p.id === str(v, "printerSelect")) || null;
}

export function getEffectiveHourlyRate(settings: StoreSettings) {
  const configured = parseFloat(settings.hourlyRate) || 0;
  return configured > 0
    ? { rate: configured, isDefault: false }
    : { rate: DEFAULT_HOURLY_RATE, isDefault: true };
}

/** (preço médio ÷ vida útil) × horas dessa impressão; null se não dá pra calcular. */
export function computeAutoWearValue(v: FormValues) {
  const printer = getSelectedPrinter(v);
  if (!printer || !(printer.avgPurchasePrice > 0)) return null;

  const hours = parseInt(str(v, "printHours"), 10) || 0;
  const minutes = parseInt(str(v, "printMinutes"), 10) || 0;
  const totalHours = hours + minutes / 60;
  if (totalHours <= 0) return null;

  const value = (printer.avgPurchasePrice / printer.avgLifespanHours) * totalHours;
  return { printer, hours, minutes, value };
}

// ---------------------------------------------------------
// IMPOSTO E BASE DAS TAXAS DE MARKETPLACE
// ---------------------------------------------------------

/** Alíquota (0–0,99) quando "Impostos" está ligado no modo Profissional. */
export function getTaxRate(v: FormValues, mode: Mode) {
  if (mode !== "profissional" || !bool(v, proToggleId("taxes"))) return 0;
  const pct = parseFloat(str(v, proFieldId("taxes"))) || 0;
  return Math.min(Math.max(pct, 0), 99) / 100;
}

/** Valor em R$ de um custo profissional digitado (sem Shopee/ML/Impostos). */
function proCostValue(cost: ProCost, rawValue: number, baseCost: number, hourlyRate: number) {
  return cost.unit === "percent" ? baseCost * (rawValue / 100)
    : cost.unit === "laborMinutes" ? (hourlyRate / 60) * rawValue
    : rawValue;
}

/**
 * "Base" das fórmulas reversas de Shopee e Mercado Livre: custo material +
 * custos do grupo 1 + lucro + frete. Nunca inclui as taxas de marketplace;
 * o imposto vai pelo taxRate, no denominador.
 */
export function computeMarketplaceFeeBase(v: FormValues, mode: Mode, settings: StoreSettings) {
  const printer = getSelectedPrinter(v);
  if (!printer) return null;

  const hours = parseInt(str(v, "printHours"), 10) || 0;
  const minutes = parseInt(str(v, "printMinutes"), 10) || 0;
  const totalHours = hours + minutes / 60;
  const grams = parseFloat(str(v, "printGrams")) || 0;
  const pricePerKg = parseFloat(str(v, "pricePerKg")) || 0;
  const kwhPrice = parseFloat(str(v, "kwhPrice")) || 0;

  const filamentCost = (grams / 1000) * pricePerKg;
  const energyCost = ((printer.power / 1000) * totalHours) * kwhPrice;
  const baseCost = filamentCost + energyCost;

  const hourlyRate = getEffectiveHourlyRate(settings).rate;
  let group1Total = 0;
  let group2NonFeeTotal = 0;

  if (mode === "profissional") {
    PRO_COSTS.forEach((cost) => {
      if (cost.id === "shopee" || cost.id === "meli" || cost.id === "taxes") return;
      if (!bool(v, proToggleId(cost.id))) return;
      const rawValue = parseFloat(str(v, proFieldId(cost.id))) || 0;
      const value = proCostValue(cost, rawValue, baseCost, hourlyRate);
      if (GROUP1_PRO_COST_IDS.includes(cost.id)) group1Total += value;
      else group2NonFeeTotal += value;
    });
  }

  const marginBase = baseCost + group1Total;
  const usingFixedMargin = str(v, "marginFixed").trim() !== "";
  const profit = usingFixedMargin
    ? parseFloat(str(v, "marginFixed")) || 0
    : marginBase * ((parseFloat(str(v, "marginPct")) || 0) / 100);

  return { base: marginBase + profit + group2NonFeeTotal, taxRate: getTaxRate(v, mode) };
}

// ---------------------------------------------------------
// SHOPEE
// ---------------------------------------------------------
export const getEffectiveShopeeTiers = () => SHOPEE_DEFAULT_TIERS.map((def) => ({ ...def }));

/** (Base + taxa fixa) ÷ (1 − comissão − imposto); null se a conta for inválida. */
export function computeShopeeCandidate(base: number, tier: { commissionPct: number; fixedFee: number }, taxRate = 0) {
  const commission = Math.min(Math.max(tier.commissionPct, 0), 99.999);
  const denominator = 1 - commission / 100 - taxRate;
  if (denominator <= 0.01) return null;
  return (base + Math.max(tier.fixedFee, 0)) / denominator;
}

/** Primeira faixa cujo preço candidato cai dentro do próprio intervalo. */
export function pickShopeeTier(base: number, taxRate = 0) {
  const tiers = getEffectiveShopeeTiers();
  for (let i = 0; i < tiers.length; i++) {
    const candidate = computeShopeeCandidate(base, tiers[i], taxRate);
    if (candidate === null) continue;
    if (candidate >= SHOPEE_TIER_RANGES[i].min && candidate < SHOPEE_TIER_RANGES[i].max) {
      return { tierIndex: i as 0 | 1 | 2, tier: tiers[i], finalPrice: candidate };
    }
  }
  const lastIndex = tiers.length - 1;
  const fallbackCandidate = computeShopeeCandidate(base, tiers[lastIndex], taxRate);
  return { tierIndex: lastIndex as 2, tier: tiers[lastIndex], finalPrice: fallbackCandidate ?? base };
}

export function getSelectedShopeeRate(v: FormValues, tier: ShopeeTier) {
  if (tier === "custom") {
    return {
      commissionPct: parseFloat(str(v, "proShopeeCustomPct")) || 0,
      fixedFee: parseFloat(str(v, "proShopeeCustomFixed")) || 0,
    };
  }
  const tiers = getEffectiveShopeeTiers();
  return tiers[typeof tier === "number" ? tier : 0];
}

/** Taxa Shopee com a faixa escolhida (o preço final já desconta o imposto). */
export function computeShopeeFee(v: FormValues, mode: Mode, settings: StoreSettings, tier: ShopeeTier) {
  const baseDetails = computeMarketplaceFeeBase(v, mode, settings);
  if (!baseDetails) return null;
  const { base, taxRate } = baseDetails;
  const rate = getSelectedShopeeRate(v, tier);
  const finalPrice = computeShopeeCandidate(base, rate, taxRate) ?? base;
  const feeValue = Math.max(finalPrice - base - finalPrice * taxRate, 0);
  return { base, feeValue, rate, finalPrice };
}

// ---------------------------------------------------------
// MERCADO LIVRE
// ---------------------------------------------------------
export const getEffectiveMeliSettings = () => ({ ...MELI_DEFAULT_SETTINGS });

export function computeMeliCandidate(base: number, commissionPct: number, fixedFee: number, taxRate = 0) {
  const commission = Math.min(Math.max(commissionPct, 0), 99.999);
  const denominator = 1 - commission / 100 - taxRate;
  if (denominator <= 0.01) return null;
  return (base + Math.max(fixedFee, 0)) / denominator;
}

export function pickMeliTier(base: number, commissionPct: number, fixedFee: number, taxRate = 0) {
  const belowCandidate = computeMeliCandidate(base, commissionPct, fixedFee, taxRate);
  if (belowCandidate !== null && belowCandidate >= 0 && belowCandidate < MELI_PRICE_THRESHOLD) {
    return { tier: "below" as const, finalPrice: belowCandidate, fixedFeeUsed: fixedFee };
  }
  const fromCandidate = computeMeliCandidate(base, commissionPct, 0, taxRate);
  if (fromCandidate !== null && fromCandidate >= MELI_PRICE_THRESHOLD) {
    return { tier: "from" as const, finalPrice: fromCandidate, fixedFeeUsed: 0 };
  }
  return { tier: "from" as const, finalPrice: fromCandidate ?? base, fixedFeeUsed: 0 };
}

export function getMeliAdTypeRate(v: FormValues) {
  const adType = str(v, "proMeliAdType") === "classico" ? "classico" : "premium";
  const s = getEffectiveMeliSettings();
  const commissionPct = adType === "classico" ? s.commissionClassico : s.commissionPremium;
  return { adType, commissionPct, fixedFee: s.fixedFee } as const;
}

export function getSelectedMeliRate(v: FormValues, tier: MeliTier) {
  if (tier === "custom") {
    return {
      commissionPct: parseFloat(str(v, "proMeliCustomPct")) || 0,
      fixedFee: parseFloat(str(v, "proMeliCustomFixed")) || 0,
    };
  }
  const { commissionPct, fixedFee } = getMeliAdTypeRate(v);
  return { commissionPct, fixedFee: tier === "below" ? fixedFee : 0 };
}

export function computeMeliFee(v: FormValues, mode: Mode, settings: StoreSettings, tier: MeliTier) {
  const baseDetails = computeMarketplaceFeeBase(v, mode, settings);
  if (!baseDetails) return null;
  const { base, taxRate } = baseDetails;
  const rate = getSelectedMeliRate(v, tier);
  const finalPrice = computeMeliCandidate(base, rate.commissionPct, rate.fixedFee, taxRate) ?? base;
  const feeValue = Math.max(finalPrice - base - finalPrice * taxRate, 0);
  return { base, feeValue, rate, finalPrice };
}

// ---------------------------------------------------------
// VALIDAÇÃO
// ---------------------------------------------------------
export const printHoursTest = (v: string) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;
export const printMinutesTest = (v: string) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 59;

/** Já dá pra calcular um preço de verdade? Decide a faixa sugerida das taxas. */
export function hasCalculablePrintJob(v: FormValues) {
  if (!getSelectedPrinter(v)) return false;
  if (!printHoursTest(str(v, "printHours")) || !printMinutesTest(str(v, "printMinutes"))) return false;
  if (Number(str(v, "printHours")) === 0 && Number(str(v, "printMinutes")) === 0) return false;
  if (!(parseFloat(str(v, "printGrams")) > 0)) return false;
  if (!(parseFloat(str(v, "pricePerKg")) > 0)) return false;
  if (!(parseFloat(str(v, "kwhPrice")) > 0)) return false;
  return true;
}

export interface Validation {
  /** ids dos campos inválidos, na ordem do formulário */
  invalid: string[];
  printTimeZero: boolean;
  marginInvalid: boolean;
  /** primeiro problema (id do campo), pra rolar a tela até ele */
  first: string | null;
}

/**
 * Mesmas regras da V3. "values" já precisa ter os valores das taxas de
 * marketplace e do desgaste resolvidos (ver resolveDerived).
 */
export function validateAll(v: FormValues, mode: Mode): Validation {
  const rules: { id: string; test: (x: string) => boolean }[] = [
    { id: "materialSelect", test: (x) => x !== "" },
    { id: "printHours", test: printHoursTest },
    { id: "printMinutes", test: printMinutesTest },
    { id: "printGrams", test: (x) => x !== "" && Number(x) > 0 },
    { id: "pricePerKg", test: (x) => x !== "" && Number(x) > 0 },
    { id: "kwhPrice", test: (x) => x !== "" && Number(x) > 0 },
  ];
  if (str(v, "materialSelect") === "outro") {
    rules.push({ id: "customMaterialName", test: (x) => x.trim().length > 0 });
  }
  if (str(v, "printerSelect") === CUSTOM_PRINTER_ID) {
    rules.unshift({ id: "customPrinterPower", test: (x) => x !== "" && Number(x) > 0 });
  }
  if (mode === "profissional") {
    PRO_COSTS.forEach((cost) => {
      if (!bool(v, proToggleId(cost.id))) return;
      rules.push({ id: proFieldId(cost.id), test: (x) => x !== "" && Number(x) > 0 });
    });
  }

  const invalid = rules.filter(({ id, test }) => !test(str(v, id))).map(({ id }) => id);
  let first: string | null = invalid[0] ?? null;

  const printTimeZero = printHoursTest(str(v, "printHours")) && printMinutesTest(str(v, "printMinutes"))
    && Number(str(v, "printHours")) === 0 && Number(str(v, "printMinutes")) === 0;
  if (printTimeZero && !first) first = "printHours";

  const pctVal = str(v, "marginPct").trim();
  const fixedVal = str(v, "marginFixed").trim();
  const marginValid = (pctVal !== "" && Number(pctVal) >= 0) || (fixedVal !== "" && Number(fixedVal) >= 0);
  if (!marginValid && !first) first = "marginPct";

  return { invalid, printTimeZero, marginInvalid: !marginValid, first };
}

// ---------------------------------------------------------
// VALORES DERIVADOS (o que a V3 escrevia sozinha nos campos)
// ---------------------------------------------------------

/**
 * Preenche os campos que a V3 calculava sozinha e guardava com toFixed(2):
 * Taxa Shopee e Taxa Mercado Livre (sempre recalculadas a partir da faixa).
 * O desgaste é tratado no reducer do formulário, porque ele continua
 * editável à mão (ver form.ts).
 */
export function resolveDerived(v: FormValues, mode: Mode, settings: StoreSettings, shopeeTier: ShopeeTier, meliTier: MeliTier): FormValues {
  const out = { ...v };
  const shopee = computeShopeeFee(v, mode, settings, shopeeTier);
  out[proFieldId("shopee")] = shopee ? shopee.feeValue.toFixed(2) : "";
  const meli = computeMeliFee(v, mode, settings, meliTier);
  out[proFieldId("meli")] = meli ? meli.feeValue.toFixed(2) : "";
  return out;
}

// ---------------------------------------------------------
// ARREDONDAMENTO: sempre para cima até o próximo ",99"
// 6,78 -> 6,99 | 14,00 -> 14,99 | 9,99 -> 9,99
// ---------------------------------------------------------
export function smartRoundUp(value: number) {
  // arredonda pros centavos antes: 10.990000000000002 não pode virar 11,99
  value = Math.round(value * 100) / 100;
  const floorValue = Math.floor(value);
  const candidate = floorValue + 0.99;
  return value > candidate ? floorValue + 1 + 0.99 : candidate;
}

// ---------------------------------------------------------
// CÁLCULO PRINCIPAL
// ---------------------------------------------------------
export interface ProCostLine extends ProCost {
  rawValue: number;
  value: number;
  hourlyRate: number;
  adType?: string;
}

export interface CalcResult {
  jobName: string;
  hasCustomName: boolean;
  totalHours: number;
  printerName: string;
  materialName: string;
  hours: number; minutes: number; grams: number;
  filamentCost: number; energyCost: number; energyKwh: number; baseCost: number;
  proCosts: ProCostLine[]; proCostsTotal: number; totalCost: number;
  profit: number; calculatedPrice: number; finalPrice: number; roundingDiff: number;
  shouldRound: boolean; proMode: boolean;
  calculatedAt: Date;
}

/** Calcula o orçamento. Devolve null se algum dado obrigatório faltar. */
export function calculate(rawValues: FormValues, mode: Mode, settings: StoreSettings, shopeeTier: ShopeeTier, meliTier: MeliTier, now = new Date()): CalcResult | null {
  const v = resolveDerived(rawValues, mode, settings, shopeeTier, meliTier);
  if (validateAll(v, mode).first) return null;

  const proMode = mode === "profissional";
  const printer = getSelectedPrinter(v)!;
  const hours = parseInt(str(v, "printHours"), 10) || 0;
  const minutes = parseInt(str(v, "printMinutes"), 10) || 0;
  const totalHours = hours + (minutes / 60);
  const grams = parseFloat(str(v, "printGrams")) || 0;
  const pricePerKg = parseFloat(str(v, "pricePerKg")) || 0;
  const kwhPrice = parseFloat(str(v, "kwhPrice")) || 0;
  const shouldRound = bool(v, "roundToggle");

  // 1) filamento = (gramas / 1000) × preço por kg
  const filamentCost = (grams / 1000) * pricePerKg;
  // 2) energia (kWh) = (potência / 1000) × horas
  const energyKwh = (printer.power / 1000) * totalHours;
  // 3) custo de energia = kWh × valor do kWh
  const energyCost = energyKwh * kwhPrice;
  // 4) custo material = filamento + energia
  const baseCost = filamentCost + energyCost;

  // 5) custos profissionais ligados; só o grupo 1 entra na base do lucro
  const proCosts: ProCostLine[] = [];
  let proCostsTotal = 0;
  let group1ProCostsTotal = 0;
  const hourlyRate = getEffectiveHourlyRate(settings).rate;

  if (proMode) {
    PRO_COSTS.forEach((cost) => {
      if (!bool(v, proToggleId(cost.id))) return;
      if (cost.id === "taxes") return; // calculado no fim, sobre o preço final
      const rawValue = parseFloat(str(v, proFieldId(cost.id))) || 0;
      const value = proCostValue(cost, rawValue, baseCost, hourlyRate);
      proCostsTotal += value;
      if (GROUP1_PRO_COST_IDS.includes(cost.id)) group1ProCostsTotal += value;
      const extra = cost.id === "meli" ? { adType: str(v, "proMeliAdType") } : {};
      proCosts.push({ ...cost, rawValue, value, hourlyRate, ...extra });
    });
  }

  // 6) base da margem = custo material + grupo 1
  const marginBase = baseCost + group1ProCostsTotal;
  // 7) custo total = custo material + custos profissionais
  let totalCost = baseCost + proCostsTotal;

  // 8) lucro: valor fixo, ou % sobre a base da margem
  const usingFixedMargin = str(v, "marginFixed").trim() !== "";
  const profit = usingFixedMargin
    ? parseFloat(str(v, "marginFixed")) || 0
    : marginBase * ((parseFloat(str(v, "marginPct")) || 0) / 100);

  // 9) impostos: % sobre o preço final → preço = (tudo o mais) ÷ (1 − alíquota)
  const taxRate = proMode ? getTaxRate(v, mode) : 0;
  if (taxRate > 0) {
    const taxesCost = PRO_COSTS.find((c) => c.id === "taxes")!;
    const beforeTaxes = totalCost + profit;
    const taxValue = beforeTaxes / (1 - taxRate) - beforeTaxes;
    proCosts.push({ ...taxesCost, rawValue: taxRate * 100, value: taxValue, hourlyRate });
    proCostsTotal += taxValue;
    totalCost += taxValue;
  }

  // 10) preço calculado = custo total + lucro
  const calculatedPrice = totalCost + profit;
  // 11) preço final, com o arredondamento para ",99" se ligado
  const finalPrice = shouldRound ? smartRoundUp(calculatedPrice) : calculatedPrice;
  // 12) diferença do arredondamento
  const roundingDiff = finalPrice - calculatedPrice;

  const selectedMaterial = MATERIALS.find((m) => m.id === str(v, "materialSelect"))!;
  const materialName = selectedMaterial.id === "outro"
    ? (str(v, "customMaterialName").trim() || "Outro (personalizado)")
    : selectedMaterial.name;

  return {
    jobName: str(v, "jobName").trim() || DEFAULT_JOB_NAME,
    hasCustomName: str(v, "jobName").trim() !== "",
    totalHours,
    printerName: printer.name,
    materialName,
    hours, minutes, grams,
    filamentCost, energyCost, energyKwh, baseCost, proCosts, proCostsTotal, totalCost,
    profit, calculatedPrice, finalPrice, roundingDiff,
    shouldRound, proMode,
    calculatedAt: now,
  };
}

// ---------------------------------------------------------
// FORMATAÇÃO E TEXTO DO WHATSAPP
// ---------------------------------------------------------
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "2h30", "0h45" */
export const formatPrintTime = (hours: number, minutes: number) => `${hours}h${String(minutes).padStart(2, "0")}`;

/** Assinatura da loja: só o que estiver preenchido. */
export function buildStoreSignatureLine(settings: StoreSettings) {
  const parts = [settings.storeName, settings.city, settings.whatsapp, settings.instagram]
    .map((x) => (x || "").trim())
    .filter(Boolean);
  return parts.length ? `🏪 ${parts.join(" · ")}` : "";
}

/** Mesmo texto da V3, linha por linha. */
export function buildWhatsAppText(r: CalcResult, settings: StoreSettings) {
  const timeLabel = `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`;

  const proLines = r.proMode
    ? r.proCosts.map((c) => {
        if (c.unit === "laborMinutes") return `${c.emoji} ${c.label}: ${brl(c.value)} (${c.rawValue}min de preparo × ${brl(c.hourlyRate)}/h)`;
        if (c.id === "meli") return `${c.emoji} ${c.label}: ${brl(c.value)} (anúncio ${c.adType === "classico" ? "Clássico" : "Premium"})`;
        return `${c.emoji} ${c.label}: ${brl(c.value)}`;
      })
    : [];

  const lines = [
    `🧾 *Orçamento — ${r.jobName}*`,
    ``,
    `🖨️ Impressora: ${r.printerName}`,
    `🧵 Material: ${r.materialName}`,
    `⏱️ Tempo de impressão: ${timeLabel}`,
    ``,
    `*Custos*`,
    `🧵 Filamento: ${brl(r.filamentCost)} (${r.grams.toLocaleString("pt-BR")} g utilizados)`,
    `⚡ Energia: ${brl(r.energyCost)} (${r.energyKwh.toFixed(2).replace(".", ",")} kWh consumidos)`,
    ...proLines,
    `📦 Custo total: ${brl(r.totalCost)}`,
    `📈 Lucro: ${brl(r.profit)}`,
    ``,
    `✅ *Preço final: ${brl(r.finalPrice)}*`,
  ];

  const signature = buildStoreSignatureLine(settings);
  if (signature) lines.push(``, signature);
  return lines.join("\n");
}

/** api.whatsapp.com direto (não wa.me): o redirecionamento do wa.me troca os emojis por "�". */
export const whatsAppHref = (r: CalcResult, settings: StoreSettings) =>
  `https://api.whatsapp.com/send?text=${encodeURIComponent(buildWhatsAppText(r, settings))}`;

// ---------------------------------------------------------
// PROGRESSO (o que falta preencher)
// ---------------------------------------------------------
export function getProgressItems(v: FormValues, mode: Mode) {
  const pctVal = str(v, "marginPct").trim();
  const fixedVal = str(v, "marginFixed").trim();
  const timeOk = printHoursTest(str(v, "printHours")) && printMinutesTest(str(v, "printMinutes"))
    && !(Number(str(v, "printHours")) === 0 && Number(str(v, "printMinutes")) === 0);
  const materialOk = str(v, "materialSelect") !== ""
    && (str(v, "materialSelect") !== "outro" || str(v, "customMaterialName").trim() !== "");

  return [
    { id: "printerSelect", label: "Impressora", done: !!getSelectedPrinter(v) },
    { id: "kwhPrice", label: "Energia", done: Number(str(v, "kwhPrice")) > 0 },
    { id: "materialSelect", label: "Material", done: materialOk },
    { id: "pricePerKg", label: "Preço do filamento", done: Number(str(v, "pricePerKg")) > 0 },
    { id: "printHours", label: "Tempo", done: timeOk },
    { id: "printGrams", label: "Peso", done: Number(str(v, "printGrams")) > 0 },
    { id: "marginPct", label: "Margem", done: (pctVal !== "" && Number(pctVal) >= 0) || (fixedVal !== "" && Number(fixedVal) >= 0) },
    ...(mode === "profissional"
      ? PRO_COSTS.filter((c) => bool(v, proToggleId(c.id))).map((c) => ({
          id: proFieldId(c.id), label: c.label, done: Number(str(v, proFieldId(c.id))) > 0,
        }))
      : []),
  ];
}
