/* =========================================================
   DADOS DA CALCULADORA
   Copiados sem alteração do script.js da V3 (impressoras, filamentos,
   custos profissionais e taxas dos marketplaces). Os valores são médias
   aproximadas de mercado. As taxas da Shopee e do Mercado Livre mudam com
   o tempo: confira no site oficial antes de alterar.
   ========================================================= */

export interface Printer {
  id: string;
  brand: string;
  name: string;
  /** potência nominal (W) usada no cálculo de energia */
  power: number;
  desc: string;
  /** preço médio de mercado (R$), usado no desgaste automático */
  avgPurchasePrice: number;
  /** vida útil estimada (horas), usada no desgaste automático */
  avgLifespanHours: number;
}

export const PRINTERS: Printer[] = [
  { id: "a1-combo",   brand: "Bambu Lab", name: "Bambu Lab A1 Combo",   power: 180,  desc: "180W · Multicolor com AMS",                avgPurchasePrice: 4400,  avgLifespanHours: 8000 },
  { id: "a1-mini",    brand: "Bambu Lab", name: "Bambu Lab A1 Mini",    power: 180,  desc: "180W · Compacta, ideal para peças pequenas", avgPurchasePrice: 2900,  avgLifespanHours: 8000 },
  { id: "a2l",        brand: "Bambu Lab", name: "Bambu Lab A2L",        power: 1000, desc: "1000W · Grande formato, estrutura aberta com kit de corte opcional", avgPurchasePrice: 5500,  avgLifespanHours: 8500 },
  { id: "p1p",        brand: "Bambu Lab", name: "Bambu Lab P1P",        power: 350,  desc: "350W · Estrutura aberta, alta velocidade",  avgPurchasePrice: 4800,  avgLifespanHours: 10000 },
  { id: "p1s",        brand: "Bambu Lab", name: "Bambu Lab P1S",        power: 350,  desc: "350W · Câmara fechada, alta velocidade",    avgPurchasePrice: 7500,  avgLifespanHours: 10000 },
  { id: "p2s",        brand: "Bambu Lab", name: "Bambu Lab P2S",        power: 350,  desc: "350W · Sucessora da P1S, extrusora servo e detecção de falhas por IA", avgPurchasePrice: 6500,  avgLifespanHours: 10000 },
  { id: "x1-carbon",  brand: "Bambu Lab", name: "Bambu Lab X1 Carbon",  power: 1000, desc: "1000W · Topo de linha, lidar ativo",        avgPurchasePrice: 13000, avgLifespanHours: 12000 },
  { id: "x2d",        brand: "Bambu Lab", name: "Bambu Lab X2D",        power: 1000, desc: "1000W · Sucessora da X1 Carbon, dupla extrusora e câmara aquecida", avgPurchasePrice: 8500,  avgLifespanHours: 12000 },
  { id: "h2s",        brand: "Bambu Lab", name: "Bambu Lab H2S",        power: 1000, desc: "1000W · Grande formato, bico único, linha profissional H", avgPurchasePrice: 15000, avgLifespanHours: 12000 },
  { id: "h2d",        brand: "Bambu Lab", name: "Bambu Lab H2D",        power: 1000, desc: "1000W · Dupla extrusora, plataforma de manufatura pessoal, corte e gravação opcionais", avgPurchasePrice: 22500, avgLifespanHours: 13000 },
  { id: "h2c",        brand: "Bambu Lab", name: "Bambu Lab H2C",        power: 1000, desc: "1000W · Topo de linha, 6 bicos intercambiáveis (sistema Vortek)", avgPurchasePrice: 29000, avgLifespanHours: 13000 },

  { id: "cr-ender3-v3-se", brand: "Creality", name: "Creality Ender-3 V3 SE", power: 350,  desc: "350W · Entrada, cama aberta",                 avgPurchasePrice: 1500, avgLifespanHours: 6000 },
  { id: "cr-ender3-v3-ke", brand: "Creality", name: "Creality Ender-3 V3 KE", power: 350,  desc: "350W · Klipper, alta velocidade",             avgPurchasePrice: 2000, avgLifespanHours: 6000 },
  { id: "cr-k1c",          brand: "Creality", name: "Creality K1C",           power: 350,  desc: "350W · Câmara fechada, bico endurecido",       avgPurchasePrice: 3500, avgLifespanHours: 8000 },
  { id: "cr-k1-max",       brand: "Creality", name: "Creality K1 Max",        power: 1000, desc: "1000W · Grande formato, câmara fechada",       avgPurchasePrice: 5500, avgLifespanHours: 8000 },
  { id: "cr-k2-plus",      brand: "Creality", name: "Creality K2 Plus Combo", power: 1200, desc: "1200W · Grande formato, multicolor com CFS",   avgPurchasePrice: 9500, avgLifespanHours: 10000 },

  { id: "el-neptune4",     brand: "Elegoo", name: "Elegoo Neptune 4",       power: 310, desc: "310W · Klipper, cama aberta",                  avgPurchasePrice: 1500, avgLifespanHours: 6000 },
  { id: "el-neptune4-pro", brand: "Elegoo", name: "Elegoo Neptune 4 Pro",   power: 310, desc: "310W · Klipper, cama com aquecimento por zonas", avgPurchasePrice: 1900, avgLifespanHours: 6000 },
  { id: "el-centauri",     brand: "Elegoo", name: "Elegoo Centauri Carbon", power: 350, desc: "350W · CoreXY, câmara fechada",                avgPurchasePrice: 2700, avgLifespanHours: 8000 },

  { id: "pr-mk4s",     brand: "Prusa", name: "Prusa MK4S",     power: 240, desc: "240W · Referência em confiabilidade",  avgPurchasePrice: 7500,  avgLifespanHours: 12000 },
  { id: "pr-core-one", brand: "Prusa", name: "Prusa CORE One", power: 350, desc: "350W · CoreXY, câmara fechada",        avgPurchasePrice: 10500, avgLifespanHours: 12000 },

  { id: "ac-kobra3",   brand: "Anycubic", name: "Anycubic Kobra 3 Combo",  power: 400, desc: "400W · Multicolor com ACE Pro",       avgPurchasePrice: 3300, avgLifespanHours: 7000 },
  { id: "ac-kobra-s1", brand: "Anycubic", name: "Anycubic Kobra S1 Combo", power: 400, desc: "400W · Câmara fechada, multicolor",   avgPurchasePrice: 4500, avgLifespanHours: 8000 },

  { id: "ff-ad5m",     brand: "Flashforge", name: "Flashforge Adventurer 5M",     power: 350, desc: "350W · CoreXY compacta",          avgPurchasePrice: 2500, avgLifespanHours: 7000 },
  { id: "ff-ad5m-pro", brand: "Flashforge", name: "Flashforge Adventurer 5M Pro", power: 350, desc: "350W · CoreXY, câmara fechada",   avgPurchasePrice: 3300, avgLifespanHours: 7000 },

  { id: "qd-q1-pro", brand: "Qidi",  name: "Qidi Q1 Pro", power: 350, desc: "350W · Câmara aquecida",          avgPurchasePrice: 3300, avgLifespanHours: 8000 },
  { id: "sv-sv06",   brand: "Sovol", name: "Sovol SV06",  power: 300, desc: "300W · Entrada, estilo Prusa",    avgPurchasePrice: 1400, avgLifespanHours: 6000 },
];

// "Outra impressora": potência (e, opcionalmente, o preço pago) informados
// pela pessoa. A vida útil usa um padrão genérico.
export const CUSTOM_PRINTER_ID = "custom";
export const CUSTOM_PRINTER_LIFESPAN_HOURS = 8000;

export interface Material {
  id: string;
  group: string;
  name: string;
  pricePerKg: number | null;
}

// Filamentos (preço médio por kg em R$), agrupados por tipo.
// "Outro" fica sempre por último: é a opção de personalizar.
export const MATERIALS: Material[] = [
  { id: "pla-basic",   group: "PLA",        name: "PLA Basic",   pricePerKg: 109.90 },
  { id: "pla-matte",   group: "PLA",        name: "PLA Matte",   pricePerKg: 119.90 },
  { id: "silk-pla",    group: "PLA",        name: "PLA Silk",    pricePerKg: 129.90 },
  { id: "pla-cf",      group: "PLA",        name: "PLA-CF (fibra de carbono)", pricePerKg: 179.90 },
  { id: "petg-basic",  group: "Engenharia", name: "PETG Basic",  pricePerKg: 109.90 },
  { id: "petg-cf",     group: "Engenharia", name: "PETG-CF",     pricePerKg: 169.90 },
  { id: "abs",         group: "Engenharia", name: "ABS",         pricePerKg: 99.90 },
  { id: "asa",         group: "Engenharia", name: "ASA",         pricePerKg: 129.90 },
  { id: "pc",          group: "Engenharia", name: "PC (policarbonato)", pricePerKg: 199.90 },
  { id: "pa-nylon",    group: "Engenharia", name: "PA / Nylon",  pricePerKg: 249.90 },
  { id: "tpu-95a",     group: "Flexível",   name: "TPU 95A",     pricePerKg: 149.90 },
  { id: "outro",       group: "Outro",      name: "Outro (personalizado)", pricePerKg: null },
];

// Valor-hora usado no cálculo de "Mão de obra" quando a pessoa ainda não
// configurou o próprio valor-hora nas Configurações da loja.
export const DEFAULT_HOURLY_RATE = 30;

// Nome usado no orçamento quando a pessoa não dá nome à peça.
export const DEFAULT_JOB_NAME = "Peça personalizada";

export type ProCostId =
  | "wear" | "labor" | "failure" | "packaging" | "materials"
  | "shopee" | "meli" | "shipping" | "taxes";

export interface ProCost {
  id: ProCostId;
  label: string;
  /** "currency" soma direto em R$; "percent" incide sobre filamento + energia;
   *  "laborMinutes" vira R$ com o valor-hora ((valor-hora ÷ 60) × minutos) */
  unit: "currency" | "percent" | "laborMinutes";
  placeholder: string;
  /** usado só no texto do WhatsApp */
  emoji: string;
  hint: string;
  fieldLabel?: string;
  errorText?: string;
  shortcuts?: number[];
  warningText?: string;
}

// Custos do modo Profissional. A ordem é a mesma da V3: ela define a ordem
// das linhas no orçamento (WhatsApp e PDF) e na composição do preço.
export const PRO_COSTS: ProCost[] = [
  { id: "wear",      label: "Desgaste da máquina", unit: "currency", placeholder: "5,00", emoji: "🔧",
    hint: "Calculado sozinho com o preço médio e a vida útil da impressora." },
  { id: "labor",     label: "Mão de obra",         unit: "laborMinutes", fieldLabel: "Tempo de preparo",
    errorText: "Informe o tempo de preparo, em minutos.", placeholder: "15", emoji: "🧑‍🔧",
    hint: "" },
  { id: "failure",   label: "Margem de falha",     unit: "percent",  placeholder: "10", emoji: "⚠️",
    hint: "% sobre filamento + energia, pra cobrir peças que falham. O comum é entre 5% e 15%.",
    shortcuts: [5, 10, 15] },
  { id: "packaging", label: "Embalagem",           unit: "currency", placeholder: "3,00", emoji: "🎁",
    hint: "Caixa, plástico bolha, fita, etiqueta, sacola: tudo o que você gasta pra embalar." },
  { id: "materials", label: "Materiais e insumos", unit: "currency", placeholder: "5,00", emoji: "🧲",
    hint: "Ímã, cola, tinta, parafusos e outros insumos além do filamento." },
  { id: "shopee",    label: "Taxa Shopee",         unit: "currency", placeholder: "4,00", emoji: "🛒",
    hint: "Escolha a faixa em que o preço final se encaixa. A taxa é calculada sozinha." },
  { id: "meli",      label: "Taxa Mercado Livre",  unit: "currency", placeholder: "10,00", emoji: "🛍️",
    warningText: "Aproximação: não considera a categoria do produto (a comissão real varia) nem o frete grátis subsidiado acima de R$ 79. Confira no Simulador de Custos do Mercado Livre.",
    hint: "Comissão do tipo de anúncio + custo fixo, já embutidos no preço final." },
  { id: "shipping",  label: "Frete",               unit: "currency", placeholder: "15,00", emoji: "🚚",
    hint: "Valor do frete que você paga ou repassa ao cliente. Não gera lucro." },
  { id: "taxes",     label: "Impostos",            unit: "percent",  placeholder: "6", emoji: "🏛️",
    hint: "% sobre o preço final (MEI, Simples Nacional etc.). Já sai embutido no preço." },
];

// Custos que entram na base da margem de lucro (geram lucro proporcional).
// Os demais (Shopee, Mercado Livre, Frete, Impostos) só são repassados.
export const GROUP1_PRO_COST_IDS: ProCostId[] = ["wear", "labor", "failure", "packaging", "materials"];

// ---------------------------------------------------------
// SHOPEE: 3 faixas de preço com comissão + taxa fixa
// ---------------------------------------------------------
export const SHOPEE_TIER_RANGES = [
  { min: 0,  max: 8 },
  { min: 8,  max: 80 },
  { min: 80, max: Infinity },
];

export const SHOPEE_TIER_OPTION_LABELS = ["Abaixo de R$ 8,00", "De R$ 8,00 a R$ 79,99", "A partir de R$ 80,00"];

export const SHOPEE_DEFAULT_TIERS = [
  { commissionPct: 50, fixedFee: 0 },
  { commissionPct: 20, fixedFee: 4 },
  { commissionPct: 14, fixedFee: 20 },
];

// ---------------------------------------------------------
// MERCADO LIVRE: comissão do tipo de anúncio; custo fixo abaixo de R$ 79
// ---------------------------------------------------------
export const MELI_PRICE_THRESHOLD = 79;

export const MELI_DEFAULT_SETTINGS = {
  commissionClassico: 12,
  commissionPremium: 17,
  fixedFee: 6,
};
