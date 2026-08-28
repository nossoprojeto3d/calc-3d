/* =========================================================
   NOSSO PROJETO 3D — V1 BÁSICA — script.js
   Nesta versão os dados de impressoras e materiais ficam
   embutidos aqui mesmo (em vez de printers.json/materials.json)
   para o app funcionar 100% abrindo o index.html direto no
   navegador (duplo clique), sem precisar de servidor local.
   Na V2 esses dados são migrados para os arquivos .json.
   ========================================================= */

// ---------------------------------------------------------
// DADOS: IMPRESSORAS BAMBU LAB
// ---------------------------------------------------------
const PRINTERS = [
  { id: "a1-combo",   name: "Bambu Lab A1 Combo",   power: 150,  desc: "150W · Multicolor com AMS" },
  { id: "a1-mini",    name: "Bambu Lab A1 Mini",    power: 150,  desc: "150W · Compacta, ideal para peças pequenas" },
  { id: "p1s",        name: "Bambu Lab P1S",        power: 350,  desc: "350W · Câmara fechada, alta velocidade" },
  { id: "p1p",        name: "Bambu Lab P1P",        power: 350,  desc: "350W · Estrutura aberta, alta velocidade" },
  { id: "x1-carbon",  name: "Bambu Lab X1 Carbon",  power: 1000, desc: "1000W · Topo de linha, lidar ativo" },
];

// ---------------------------------------------------------
// DADOS: MATERIAIS (preço padrão por kg em R$)
// Ordenados alfabeticamente — "Outro" fica sempre por último,
// já que é a opção de personalizar um material fora da lista.
// ---------------------------------------------------------
const MATERIALS = [
  { id: "abs",       name: "ABS",        pricePerKg: 99.90 },
  { id: "asa",       name: "ASA",        pricePerKg: 129.90 },
  { id: "petg-basic",name: "PETG Basic", pricePerKg: 109.90 },
  { id: "pla-basic", name: "PLA Basic",  pricePerKg: 89.90 },
  { id: "pla-matte", name: "PLA Matte",  pricePerKg: 99.90 },
  { id: "silk-pla",  name: "Silk PLA",   pricePerKg: 119.90 },
  { id: "tpu-95a",   name: "TPU 95A",    pricePerKg: 149.90 },
  { id: "outro",     name: "Outro (personalizado)", pricePerKg: null },
];

// ---------------------------------------------------------
// REFERÊNCIAS DE ELEMENTOS
// ---------------------------------------------------------
const el = (id) => document.getElementById(id);

const printerSelect     = el("printerSelect");
const materialSelect    = el("materialSelect");
const printerHint       = el("printerHint");
const materialHint      = el("materialHint");
const customWrap        = el("customMaterialWrap");
const customPriceInput  = el("customMaterialPrice");
const jobNameInput      = el("jobName");
const printHoursInput   = el("printHours");
const printMinutesInput = el("printMinutes");
const printGramsInput   = el("printGrams");
const pricePerKgInput   = el("pricePerKg");
const kwhPriceInput     = el("kwhPrice");
const marginPctInput    = el("marginPct");
const marginFixedInput  = el("marginFixed");
const roundToggle       = el("roundToggle");
const copyBtn           = el("copyBtn");
const copyBtnLabel      = el("copyBtnLabel");

// Guarda o último resultado calculado com sucesso, usado pelo botão "Copiar"
let lastResult = null;

/**
 * Preenche os <select> de impressora e material a partir dos
 * arrays PRINTERS / MATERIALS acima.
 */
function populateSelects() {
  PRINTERS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    printerSelect.appendChild(opt);
  });

  MATERIALS.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name;
    materialSelect.appendChild(opt);
  });

  updatePrinterHint();
  syncMaterialUI(false); // na inicialização, só ajusta textos/visibilidade — não preenche o preço/kg
}

/** Atualiza a descrição (potência) exibida abaixo do select de impressora. */
function updatePrinterHint() {
  const printer = PRINTERS.find((p) => p.id === printerSelect.value);
  printerHint.textContent = printer ? printer.desc : "—";
}

/**
 * Ajusta a interface conforme o material selecionado: mostra/esconde
 * o campo de preço personalizado e atualiza a dica de preço padrão.
 * Quando prefillPrice=true (mudança feita pelo usuário), também
 * preenche automaticamente o campo "Preço do filamento (R$/kg)".
 * Na carga inicial da página (prefillPrice=false) o campo de preço
 * permanece vazio, para respeitar a regra de página limpa ao começar.
 */
function syncMaterialUI(prefillPrice) {
  const material = MATERIALS.find((m) => m.id === materialSelect.value);
  const isCustom = material.id === "outro";

  customWrap.hidden = !isCustom;

  if (isCustom) {
    materialHint.textContent = "Informe o preço por kg deste material abaixo.";
    if (prefillPrice) pricePerKgInput.value = customPriceInput.value || "";
  } else {
    if (prefillPrice) {
      customPriceInput.value = "";
      clearFieldError(customPriceInput);
      pricePerKgInput.value = material.pricePerKg.toFixed(2);
      clearFieldError(pricePerKgInput);
    }
    materialHint.textContent = `Preço padrão: R$ ${material.pricePerKg.toFixed(2).replace(".", ",")}/kg`;
  }
}

// ---------------------------------------------------------
// FORÇAR NÚMEROS INTEIROS (horas e minutos)
// Remove qualquer caractere que não seja dígito conforme o
// usuário digita, garantindo que nunca haja valor quebrado.
// ---------------------------------------------------------
function enforceIntegerInput(inputEl, maxValue) {
  inputEl.addEventListener("input", () => {
    let digitsOnly = inputEl.value.replace(/[^\d]/g, "");
    if (typeof maxValue === "number" && digitsOnly !== "" && Number(digitsOnly) > maxValue) {
      digitsOnly = String(maxValue);
    }
    if (inputEl.value !== digitsOnly) inputEl.value = digitsOnly;
  });
}

// ---------------------------------------------------------
// MARGEM DE LUCRO — SELEÇÃO MUTUAMENTE EXCLUSIVA (% x VALOR FIXO)
// Preencher um dos campos bloqueia o outro, até que o campo
// preenchido seja esvaziado novamente.
// ---------------------------------------------------------
function bindMarginExclusivity() {
  marginPctInput.addEventListener("input", () => {
    const filled = marginPctInput.value.trim() !== "";
    marginFixedInput.disabled = filled;
    marginFixedInput.classList.toggle("disabled-field", filled);
    if (filled) marginFixedInput.value = "";
    clearMarginError();
  });

  marginFixedInput.addEventListener("input", () => {
    const filled = marginFixedInput.value.trim() !== "";
    marginPctInput.disabled = filled;
    marginPctInput.classList.toggle("disabled-field", filled);
    if (filled) marginPctInput.value = "";
    clearMarginError();
  });
}

function showMarginError() {
  marginPctInput.classList.add("invalid");
  marginFixedInput.classList.add("invalid");
  el("marginError").hidden = false;
}

function clearMarginError() {
  marginPctInput.classList.remove("invalid");
  marginFixedInput.classList.remove("invalid");
  el("marginError").hidden = true;
}

// ---------------------------------------------------------
// VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
// ---------------------------------------------------------
function fieldGroupOf(inputEl) {
  return inputEl.closest(".field");
}

function showFieldError(inputEl, message) {
  inputEl.classList.add("invalid");
  const group = fieldGroupOf(inputEl);
  const errorEl = group ? group.querySelector(".field-error-text") : null;
  if (errorEl) {
    errorEl.textContent = message || errorEl.textContent;
    errorEl.hidden = false;
  }
}

function clearFieldError(inputEl) {
  inputEl.classList.remove("invalid");
  const group = fieldGroupOf(inputEl);
  const errorEl = group ? group.querySelector(".field-error-text") : null;
  if (errorEl) errorEl.hidden = true;
}

/**
 * Roda todas as validações obrigatórias. Se algum campo estiver
 * inválido, destaca o campo, mostra a mensagem de erro e retorna
 * o próprio elemento (para poder rolar a tela até ele). Se tudo
 * estiver válido, retorna null.
 */
function validateAll() {
  const isCustomMaterial = materialSelect.value === "outro";

  const rules = [
    { input: jobNameInput, test: (v) => v.trim().length > 0 },
    { input: printHoursInput, test: (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0 },
    { input: printMinutesInput, test: (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) > 0 && Number(v) <= 59 },
    { input: printGramsInput, test: (v) => v !== "" && Number(v) > 0 },
    { input: pricePerKgInput, test: (v) => v !== "" && Number(v) > 0 },
    { input: kwhPriceInput, test: (v) => v !== "" && Number(v) > 0 },
  ];

  if (isCustomMaterial) {
    rules.push({ input: customPriceInput, test: (v) => v !== "" && Number(v) > 0 });
  }

  let firstInvalid = null;

  rules.forEach(({ input, test }) => {
    const valid = test(input.value);
    if (valid) {
      clearFieldError(input);
    } else {
      showFieldError(input);
      if (!firstInvalid) firstInvalid = input;
    }
  });

  // Margem de lucro: exatamente um dos dois campos (% ou valor fixo) precisa estar preenchido
  const pctVal = marginPctInput.value.trim();
  const fixedVal = marginFixedInput.value.trim();
  const marginValid = (pctVal !== "" && Number(pctVal) >= 0) || (fixedVal !== "" && Number(fixedVal) >= 0);

  if (marginValid) {
    clearMarginError();
  } else {
    showMarginError();
    if (!firstInvalid) firstInvalid = marginPctInput;
  }

  return firstInvalid;
}

// ---------------------------------------------------------
// ARREDONDAMENTO INTELIGENTE
// Regra: sempre arredonda PARA CIMA até o próximo ",99".
// Ex.: 6,78  -> 6,99   |   14,00 -> 14,99   |   9,99 -> 9,99
// ---------------------------------------------------------
function smartRoundUp(value) {
  const floorValue = Math.floor(value);
  const candidate = floorValue + 0.99;
  return value > candidate ? floorValue + 1 + 0.99 : candidate;
}

// ---------------------------------------------------------
// CÁLCULO PRINCIPAL
// ---------------------------------------------------------
function calculate() {
  const firstInvalid = validateAll();
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus({ preventScroll: true });
    return;
  }

  const printer     = PRINTERS.find((p) => p.id === printerSelect.value);
  const hours       = parseInt(printHoursInput.value, 10) || 0;
  const minutes     = parseInt(printMinutesInput.value, 10) || 0;
  const totalHours  = hours + (minutes / 60);
  const grams       = parseFloat(printGramsInput.value) || 0;
  const pricePerKg  = parseFloat(pricePerKgInput.value) || 0;
  const kwhPrice    = parseFloat(kwhPriceInput.value) || 0;
  const shouldRound = roundToggle.checked;

  // 1) Custo do filamento = (gramas / 1000) * preço por kg
  const filamentCost = (grams / 1000) * pricePerKg;

  // 2) Energia consumida (kWh) = (potência em W / 1000) * horas totais de impressão
  const energyKwh = (printer.power / 1000) * totalHours;

  // 3) Custo de energia = energia consumida (kWh) * valor do kWh
  const energyCost = energyKwh * kwhPrice;

  // 4) Custo total da peça = filamento + energia
  const totalCost = filamentCost + energyCost;

  // 5) Lucro: se o usuário informou um valor fixo, o lucro é esse valor direto.
  //    Caso contrário, o lucro é a porcentagem informada sobre o custo total.
  const usingFixedMargin = marginFixedInput.value.trim() !== "";
  const profit = usingFixedMargin
    ? parseFloat(marginFixedInput.value) || 0
    : totalCost * ((parseFloat(marginPctInput.value) || 0) / 100);

  // 6) Preço calculado (sem arredondar) = custo total + lucro
  const calculatedPrice = totalCost + profit;

  // 7) Preço final = aplica arredondamento inteligente, se ativado
  const finalPrice = shouldRound ? smartRoundUp(calculatedPrice) : calculatedPrice;

  // 8) Diferença adicionada pelo arredondamento
  const roundingDiff = finalPrice - calculatedPrice;

  const result = {
    jobName: jobNameInput.value.trim(),
    printerName: printer.name,
    materialName: MATERIALS.find((m) => m.id === materialSelect.value).name,
    hours, minutes, grams,
    filamentCost, energyCost, energyKwh, totalCost,
    profit, calculatedPrice, finalPrice, roundingDiff,
    shouldRound,
  };

  lastResult = result;
  renderResult(result);
}

// ---------------------------------------------------------
// FORMATAÇÃO E EXIBIÇÃO DO RESULTADO
// ---------------------------------------------------------
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function renderResult(r) {
  el("finalPrice").textContent   = brl(r.finalPrice);
  el("totalCost").textContent    = brl(r.totalCost);
  el("profitValue").textContent  = brl(r.profit);
  el("filamentCost").textContent = brl(r.filamentCost);
  el("energyCost").textContent   = brl(r.energyCost);

  el("filamentGramsSub").textContent = `${r.grams.toLocaleString("pt-BR")} g utilizados`;
  el("energyKwhSub").textContent     = `${r.energyKwh.toFixed(2).replace(".", ",")} kWh consumidos`;

  el("roundingNote").textContent = r.shouldRound && r.roundingDiff > 0.001
    ? `Preço calculado: ${brl(r.calculatedPrice)} · arredondado (+${brl(r.roundingDiff)})`
    : "";

  // pequena animação de destaque ao recalcular (elemento de assinatura)
  const valueEl = el("finalPrice");
  valueEl.classList.remove("pulse");
  void valueEl.offsetWidth; // força reflow para reiniciar a animação
  valueEl.classList.add("pulse");

  // habilita o botão de copiar assim que existir um resultado válido
  copyBtn.disabled = false;
  copyBtn.classList.remove("copied");
  copyBtnLabel.textContent = "Copiar orçamento para o WhatsApp";
}

// ---------------------------------------------------------
// LIMPAR TUDO — volta a página ao estado inicial, 100% vazio
// ---------------------------------------------------------
function clearAll() {
  jobNameInput.value = "";
  printerSelect.selectedIndex = 0;
  materialSelect.selectedIndex = 0;
  updatePrinterHint();
  syncMaterialUI(false);

  printHoursInput.value = "";
  printMinutesInput.value = "";
  printGramsInput.value = "";
  pricePerKgInput.value = "";
  customPriceInput.value = "";
  kwhPriceInput.value = "";

  marginPctInput.value = "";
  marginFixedInput.value = "";
  marginPctInput.disabled = false;
  marginFixedInput.disabled = false;
  marginPctInput.classList.remove("disabled-field");
  marginFixedInput.classList.remove("disabled-field");
  clearMarginError();

  roundToggle.checked = true;
  el("roundToggleText").textContent = "Arredondar para .99 acima";

  [jobNameInput, printHoursInput, printMinutesInput, printGramsInput,
   pricePerKgInput, customPriceInput, kwhPriceInput]
    .forEach(clearFieldError);

  el("finalPrice").textContent   = "R$ 0,00";
  el("totalCost").textContent    = "R$ 0,00";
  el("profitValue").textContent  = "R$ 0,00";
  el("filamentCost").textContent = "R$ 0,00";
  el("energyCost").textContent   = "R$ 0,00";
  el("filamentGramsSub").textContent = "0 g utilizados";
  el("energyKwhSub").textContent     = "0,00 kWh consumidos";
  el("roundingNote").textContent = "";

  lastResult = null;
  copyBtn.disabled = true;
  copyBtn.classList.remove("copied");
  copyBtnLabel.textContent = "Copiar orçamento para o WhatsApp";

  jobNameInput.focus();
}

// ---------------------------------------------------------
// COPIAR ORÇAMENTO FORMATADO PARA O WHATSAPP
// ---------------------------------------------------------
function buildWhatsAppText(r) {
  const timeLabel = `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`;

  return [
    `🧾 *Orçamento — ${r.jobName}*`,
    ``,
    `🖨️ Impressora: ${r.printerName}`,
    `🧵 Material: ${r.materialName}`,
    `⏱️ Tempo de impressão: ${timeLabel}`,
    ``,
    `*Custos*`,
    `🧵 Filamento: ${brl(r.filamentCost)} (${r.grams} g utilizados)`,
    `⚡ Energia: ${brl(r.energyCost)} (${r.energyKwh.toFixed(2).replace(".", ",")} kWh consumidos)`,
    `📦 Custo total: ${brl(r.totalCost)}`,
    `📈 Lucro: ${brl(r.profit)}`,
    ``,
    `✅ *Preço final: ${brl(r.finalPrice)}*`,
  ].join("\n");
}

async function copyBudget() {
  if (!lastResult) return;

  const text = buildWhatsAppText(lastResult);

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback para navegadores/contexto sem permissão de clipboard
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  copyBtn.classList.add("copied");
  copyBtnLabel.textContent = "Copiado! Cole no WhatsApp";
  setTimeout(() => {
    copyBtn.classList.remove("copied");
    copyBtnLabel.textContent = "Copiar orçamento para o WhatsApp";
  }, 2200);
}

// ---------------------------------------------------------
// TEMA CLARO / ESCURO
// ---------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem("np3d_theme");
  if (saved === "light") applyTheme("light");

  el("themeToggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  });
}

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    el("iconMoon").style.display = "none";
    el("iconSun").style.display = "inline-block";
  } else {
    document.documentElement.removeAttribute("data-theme");
    el("iconMoon").style.display = "inline-block";
    el("iconSun").style.display = "none";
  }
  localStorage.setItem("np3d_theme", theme);
}

// ---------------------------------------------------------
// EVENTOS
// ---------------------------------------------------------
function bindEvents() {
  printerSelect.addEventListener("change", updatePrinterHint);

  materialSelect.addEventListener("change", () => syncMaterialUI(true));

  customPriceInput.addEventListener("input", () => {
    pricePerKgInput.value = customPriceInput.value;
    clearFieldError(customPriceInput);
    clearFieldError(pricePerKgInput);
  });

  roundToggle.addEventListener("change", () => {
    el("roundToggleText").textContent = roundToggle.checked
      ? "Arredondar para .99 acima"
      : "Sem arredondamento";
  });

  el("calcBtn").addEventListener("click", calculate);
  el("clearBtn").addEventListener("click", clearAll);
  copyBtn.addEventListener("click", copyBudget);

  // Limpa o erro do campo assim que o usuário começar a corrigi-lo
  [jobNameInput, printHoursInput, printMinutesInput, printGramsInput,
   pricePerKgInput, kwhPriceInput].forEach((input) => {
    input.addEventListener("input", () => clearFieldError(input));
  });

  enforceIntegerInput(printHoursInput);
  enforceIntegerInput(printMinutesInput, 59);

  bindMarginExclusivity();
}

// ---------------------------------------------------------
// INICIALIZAÇÃO
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  populateSelects();
  initTheme();
  bindEvents();
});
