// Gera cenários aleatórios (com semente fixa) para o teste de paridade com a V3.
// Cada cenário é uma lista de ações aplicada igual na V3 e no motor novo.
import { writeFileSync } from "node:fs";

const PRINTER_IDS = ["a1-combo", "a1-mini", "a2l", "p1s", "x1-carbon", "h2c", "cr-k2-plus", "el-neptune4", "pr-mk4s", "sv-sv06", "custom"];
const MATERIAL_IDS = ["pla-basic", "pla-cf", "petg-basic", "abs", "pa-nylon", "tpu-95a", "outro"];
const PRO = ["wear", "labor", "failure", "packaging", "materials", "shopee", "meli", "shipping", "taxes"];

let seed = 20261007;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
const money = (max, dec = 2) => (rnd() * max).toFixed(dec);
// às vezes com vírgula, como no teclado do celular
const br = (s) => (chance(0.3) ? s.replace(".", ",") : s);

const scenarios = [];
const N = Number(process.argv[2] || 400);

for (let i = 0; i < N; i++) {
  const mode = chance(0.7) ? "profissional" : "basico";
  const settings = chance(0.4) ? {
    kwhPrice: "", marginPct: "", failurePct: "",
    hourlyRate: chance(0.6) ? money(80) : "",
    defaultPrinter: "",
    storeName: chance(0.5) ? "Loja Teste 3D" : "", city: chance(0.5) ? "Goiânia/GO" : "",
    whatsapp: chance(0.3) ? "(62) 98877-1020" : "", instagram: chance(0.3) ? "@loja3d" : "",
    roundDefault: true,
  } : null;

  const actions = [{ t: "mode", mode }];
  const printer = pick(PRINTER_IDS);
  if (printer === "custom") {
    actions.push({ t: "set", id: "customPrinterPower", v: String(Math.floor(rnd() * 1200) + 50) });
    if (chance(0.6)) actions.push({ t: "set", id: "customPrinterPrice", v: br(money(9000)) });
  }
  actions.push({ t: "set", id: "printerSelect", v: printer });
  const material = pick(MATERIAL_IDS);
  actions.push({ t: "set", id: "materialSelect", v: material });
  if (material === "outro") actions.push({ t: "set", id: "customMaterialName", v: "PA-CF <teste> & \"aspas\"" });
  if (material === "outro" || chance(0.5)) actions.push({ t: "set", id: "pricePerKg", v: br(money(300)) });
  actions.push({ t: "set", id: "kwhPrice", v: br(money(1.5, 3)) });
  if (chance(0.6)) actions.push({ t: "set", id: "jobName", v: pick(["Vaso geométrico", "Suporte 🎧 fone", "Peça <b>x</b>", "  "]) });
  actions.push({ t: "set", id: "printHours", v: String(Math.floor(rnd() * 30)) });
  actions.push({ t: "set", id: "printMinutes", v: String(Math.floor(rnd() * 60)) });
  actions.push({ t: "set", id: "printGrams", v: br(money(900, chance(0.5) ? 0 : 1)) });
  if (chance(0.25)) actions.push({ t: "set", id: "marginFixed", v: br(money(60)) });
  else actions.push({ t: "set", id: "marginPct", v: String(pick([0, 30, 50, 100, 150, 200, 75.5, 12])) });
  if (chance(0.3)) actions.push({ t: "set", id: "roundToggle", v: false });

  if (mode === "profissional") {
    for (const cost of PRO) {
      if (!chance(0.45)) continue;
      actions.push({ t: "toggle", cost, on: true });
      if (cost === "shopee") {
        const tier = pick(["auto", "auto", 0, 1, 2, "custom"]);
        if (tier !== "auto") actions.push({ t: "shopeeTier", tier });
        if (tier === "custom") {
          actions.push({ t: "set", id: "proShopeeCustomPct", v: br(money(30)) });
          actions.push({ t: "set", id: "proShopeeCustomFixed", v: br(money(8)) });
        }
      } else if (cost === "meli") {
        if (chance(0.5)) actions.push({ t: "set", id: "proMeliAdType", v: "classico" });
        const tier = pick(["auto", "auto", "below", "from", "custom"]);
        if (tier !== "auto") actions.push({ t: "meliTier", tier });
        if (tier === "custom") {
          actions.push({ t: "set", id: "proMeliCustomPct", v: br(money(25)) });
          actions.push({ t: "set", id: "proMeliCustomFixed", v: br(money(10)) });
        }
      } else if (cost === "wear") {
        if (chance(0.3)) actions.push({ t: "set", id: "proWear", v: br(money(20)) });
      } else if (cost === "labor") {
        actions.push({ t: "set", id: "proLabor", v: String(Math.floor(rnd() * 90)) });
      } else if (cost === "failure" || cost === "taxes") {
        actions.push({ t: "set", id: cost === "failure" ? "proFailure" : "proTaxes", v: String(pick([5, 10, 15, 6, 4.5, 11])) });
      } else {
        const id = { packaging: "proPackaging", materials: "proMaterials", shipping: "proShipping" }[cost];
        actions.push({ t: "set", id, v: br(money(30)) });
      }
    }
  }
  scenarios.push({ n: i, settings, actions });
}

writeFileSync(new URL("./scenarios.json", import.meta.url), JSON.stringify(scenarios, null, 1));
console.log(`${scenarios.length} cenários gerados`);
