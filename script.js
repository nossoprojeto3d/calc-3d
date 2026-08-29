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
// DADOS: CUSTOS PROFISSIONAIS (modo Profissional)
// unit "currency" = valor direto em R$ que soma ao custo base.
// unit "percent"  = porcentagem que incide sobre o custo base
// (filamento + energia), do mesmo jeito que a margem de lucro em %.
// unit "laborMinutes" = minutos de preparo informados, convertidos em
// R$ usando o valor-hora das Configurações da loja ((valor-hora ÷ 60) × minutos).
// O emoji é usado só na formatação do texto copiado pro WhatsApp.
// ---------------------------------------------------------
const PRO_COSTS = [
  { id: "wear",        label: "Desgaste da máquina", unit: "currency", placeholder: "Ex: 5,00",  emoji: "🔧",
    hint: "Calculado a partir do preço e vida útil da impressora, configurados nas Configurações da loja. Pode editar se quiser." },
  { id: "labor",       label: "Mão de obra",         unit: "laborMinutes", fieldLabel: "Tempo de preparo (minutos)",
    errorText: "Informe o tempo de preparo, em minutos.", placeholder: "Ex: 15", emoji: "🧑‍🔧",
    hint: "Calculado a partir do tempo de preparo informado e do seu valor-hora, configurado nas Configurações da loja." },
  { id: "failure",     label: "Margem de falha",     unit: "percent",  placeholder: "Ex: 10",    emoji: "⚠️",
    hint: "Ex: % do custo total pra cobrir peças que falham ou saem com defeito. Comum entre 5% e 15%.",
    shortcuts: [5, 10, 15], shortcutsHint: "Escolha um atalho ou digite o percentual que preferir." },
  { id: "packaging",   label: "Embalagem",           unit: "currency", placeholder: "Ex: 3,00",  emoji: "🎁",
    hint: "Ex: custo da caixa, plástico bolha, etiqueta de fechamento etc." },
  { id: "sticker",     label: "Etiqueta",            unit: "currency", placeholder: "Ex: 1,00",  emoji: "🏷️",
    hint: "Ex: custo da etiqueta impressa ou adesivo aplicado na peça." },
  { id: "magnet",      label: "Ímã",                 unit: "currency", placeholder: "Ex: 2,00",  emoji: "🧲",
    hint: "Ex: custo unitário do ímã usado na peça, se aplicável." },
  { id: "glue",        label: "Cola",                unit: "currency", placeholder: "Ex: 1,50",  emoji: "🧴",
    hint: "Ex: custo estimado de cola usada na montagem dessa peça." },
  { id: "paint",       label: "Pintura",             unit: "currency", placeholder: "Ex: 10,00", emoji: "🎨",
    hint: "Ex: tinta + tempo de acabamento manual, se a peça for pintada." },
  { id: "screws",      label: "Parafusos",           unit: "currency", placeholder: "Ex: 2,00",  emoji: "🔩",
    hint: "Ex: custo dos parafusos ou fixadores usados na montagem." },
  { id: "marketplace", label: "Marketplace",         unit: "percent",  placeholder: "Ex: 16",    emoji: "🛒",
    hint: "Ex: taxa cobrada pela plataforma de venda (Shopee, Elo7 etc.) sobre o preço final." },
  { id: "shipping",    label: "Frete",               unit: "currency", placeholder: "Ex: 15,00", emoji: "🚚",
    hint: "Ex: valor do frete que você paga ou repassa ao cliente." },
  { id: "taxes",       label: "Impostos",            unit: "percent",  placeholder: "Ex: 6",     emoji: "🏛️",
    hint: "Ex: % de imposto sobre o preço final (MEI, Simples Nacional etc.)." },
];

/** Gera o id-base dos elementos de um custo profissional (ex.: "wear" -> "proWear"). */
function proFieldId(cost) {
  return `pro${cost.id.charAt(0).toUpperCase()}${cost.id.slice(1)}`;
}

// ---------------------------------------------------------
// REFERÊNCIAS DE ELEMENTOS
// ---------------------------------------------------------
const el = (id) => document.getElementById(id);

const printerSelect     = el("printerSelect");
const materialSelect    = el("materialSelect");
const printerHint       = el("printerHint");
const materialHint      = el("materialHint");
const customWrap        = el("customMaterialWrap");
const customNameInput   = el("customMaterialName");
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
const proItemGrid       = el("proItemGrid");
const proSection        = el("proSection");

// Guarda o último resultado calculado com sucesso, usado pelo botão "Copiar"
let lastResult = null;

// Modo atual da calculadora: "basico" (padrão, fluxo inalterado) ou "profissional"
let currentMode = "basico";
const isProMode = () => currentMode === "profissional";

// ---------------------------------------------------------
// ANIMAÇÃO DE EXPANSÃO (.reveal)
// Mostra/esconde um bloco com transição suave de altura (usada na
// seção "Custos profissionais" e em cada campo de custo individual).
// Só remove o [hidden] de vez depois que a transição de fechamento
// termina, pra não sobrar espaço vazio no layout enquanto fechado.
// ---------------------------------------------------------
function setExpanded(container, expanded) {
  if (expanded) {
    container.hidden = false;
    void container.offsetHeight; // força reflow pra animar a abertura
    container.classList.add("open");
  } else {
    container.classList.remove("open");
    const onEnd = (event) => {
      if (event.propertyName !== "grid-template-rows") return;
      container.removeEventListener("transitionend", onEnd);
      if (!container.classList.contains("open")) container.hidden = true;
    };
    container.addEventListener("transitionend", onEnd);
  }
}

// ---------------------------------------------------------
// MODO BÁSICO / PROFISSIONAL
// ---------------------------------------------------------
function setMode(mode) {
  currentMode = mode;

  document.querySelectorAll(".mode-switch-btn").forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  setExpanded(proSection, mode === "profissional");
  localStorage.setItem("np3d_mode", mode);
}

function initModeSwitch() {
  document.querySelectorAll(".mode-switch-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  const saved = localStorage.getItem("np3d_mode");
  setMode(saved === "profissional" ? "profissional" : "basico");
}

// ---------------------------------------------------------
// CUSTOS PROFISSIONAIS — MONTAGEM DOS CAMPOS
// Cada item é gerado a partir de PRO_COSTS (mesmo espírito de
// populateSelects, que monta os <option> a partir de PRINTERS/MATERIALS),
// pra não repetir 12x o mesmo bloco de HTML na mão.
// ---------------------------------------------------------
function populateProCosts() {
  PRO_COSTS.forEach((cost) => {
    const fieldId = proFieldId(cost);
    const unitSuffix = cost.unit === "percent" ? "%"
      : cost.unit === "laborMinutes" ? "min"
      : "R$";
    const unitLabel = cost.fieldLabel || `${cost.label} (${unitSuffix})`;
    const step = cost.unit === "percent" || cost.unit === "laborMinutes" ? "1" : "0.01";
    const errorText = cost.errorText || `Informe o valor de ${cost.label.toLowerCase()}.`;

    // Botões de atalho (ex.: 5%/10%/15% na Margem de falha) — opcional,
    // só os itens com "shortcuts" no PRO_COSTS ganham essa fileira.
    const shortcutsHtml = cost.shortcuts ? `
      <div class="chip-row" id="${fieldId}Shortcuts">
        ${cost.shortcuts.map((v) => `<button type="button" class="chip-btn" data-value="${v}">${v}%</button>`).join("")}
      </div>
    ` : "";
    const shortcutsHintHtml = cost.shortcutsHint ? `<p class="hint">${cost.shortcutsHint}</p>` : "";

    const item = document.createElement("div");
    item.className = "pro-item";
    item.id = `${fieldId}Item`;
    item.innerHTML = `
      <div class="pro-item-head">
        <span class="pro-item-label">${unitLabel}</span>
        <label class="switch">
          <input type="checkbox" class="pro-toggle" id="${fieldId}Toggle">
          <span class="switch-track"><span class="switch-thumb"></span></span>
        </label>
      </div>
      <div class="reveal" id="${fieldId}Body" hidden>
        <div class="reveal-inner">
          <div class="field" style="margin-top: 10px;">
            <input type="number" id="${fieldId}" min="0" step="${step}" placeholder="${cost.placeholder}" aria-label="${unitLabel}">
            ${shortcutsHtml}
            ${shortcutsHintHtml}
            <p class="field-error-text" id="${fieldId}Error" hidden>${errorText}</p>
            <p class="hint">${cost.hint}</p>
          </div>
        </div>
      </div>
    `;

    proItemGrid.appendChild(item);
  });
}

/** Destaca o botão de atalho (5%/10%/15%) que bate com o valor atual do campo, se houver. */
function syncShortcutActiveState(cost, input) {
  if (!cost.shortcuts) return;
  const wrap = el(`${proFieldId(cost)}Shortcuts`);
  wrap.querySelectorAll(".chip-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === input.value.trim());
  });
}

/** Liga o switch de cada custo profissional à exibição/limpeza do seu campo,
 *  e os botões de atalho (quando existirem) ao preenchimento do valor. */
function bindProCostEvents() {
  PRO_COSTS.forEach((cost) => {
    const fieldId = proFieldId(cost);
    const toggle  = el(`${fieldId}Toggle`);
    const body    = el(`${fieldId}Body`);
    const input   = el(fieldId);

    toggle.addEventListener("change", () => {
      setExpanded(body, toggle.checked);
      if (!toggle.checked) {
        input.value = "";
        clearFieldError(input);
        syncShortcutActiveState(cost, input);
      }
    });

    input.addEventListener("input", () => {
      clearFieldError(input);
      syncShortcutActiveState(cost, input);
    });

    if (cost.shortcuts) {
      el(`${fieldId}Shortcuts`).querySelectorAll(".chip-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          input.value = btn.dataset.value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus();
        });
      });
    }
  });
}

// ---------------------------------------------------------
// CONFIGURAÇÕES DA LOJA (V2.2)
// Preferências opcionais salvas em uma única chave no localStorage.
// Ao carregar a página (e depois de "Limpar tudo"), os valores salvos
// preenchem automaticamente os campos correspondentes — sem travá-los,
// a pessoa pode sempre sobrescrever na hora.
// ---------------------------------------------------------
const STORE_SETTINGS_KEY = "np3d_store_settings";

function defaultStoreSettings() {
  return {
    kwhPrice: "", marginPct: "", failurePct: "",
    printerPrice: "", printerLifespanHours: "", hourlyRate: "",
    storeName: "", city: "", whatsapp: "", instagram: "",
    roundDefault: true,
  };
}

function loadStoreSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_SETTINGS_KEY));
    return { ...defaultStoreSettings(), ...(saved || {}) };
  } catch (err) {
    return defaultStoreSettings();
  }
}

/**
 * Aplica as preferências salvas nos campos correspondentes da calculadora.
 * Com onlyIfEmpty=true (usado ao clicar "Salvar" com a calculadora já em
 * uso), só preenche campos que ainda estão vazios — não sobrescreve um
 * orçamento que a pessoa já está preenchendo. No carregamento da página
 * e depois de "Limpar tudo" os campos já estão vazios, então tanto faz.
 */
function applyStoreSettingsToCalculator(settings, { onlyIfEmpty = false } = {}) {
  const setIfAllowed = (input, value) => {
    if (!value) return;
    if (onlyIfEmpty && input.value.trim() !== "") return;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  setIfAllowed(kwhPriceInput, settings.kwhPrice);
  setIfAllowed(marginPctInput, settings.marginPct);
  setIfAllowed(el("proFailure"), settings.failurePct);

  roundToggle.checked = settings.roundDefault !== false;
  roundToggle.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Troca o Instagram do rodapé pelo da loja configurada — ou mantém o padrão do projeto. */
function applyStoreBranding(settings) {
  const link = el("footerSocialLink");
  const handleEl = el("footerSocialHandle");
  const instagram = (settings.instagram || "").trim();

  if (instagram) {
    const handle = instagram
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/$/, "");
    link.href = `https://www.instagram.com/${handle}`;
    handleEl.textContent = `@${handle}`;
  } else {
    link.href = "https://www.instagram.com/nossoprojeto3d";
    handleEl.textContent = "@nossoprojeto3d";
  }
}

/** Linha de assinatura (loja/cidade/WhatsApp/Instagram) pro texto do WhatsApp — só com o que estiver preenchido. */
function buildStoreSignatureLine(settings) {
  const parts = [settings.storeName, settings.city, settings.whatsapp, settings.instagram]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return parts.length ? `🏪 ${parts.join(" · ")}` : "";
}

function updateSettingsRoundText() {
  el("settingsRoundToggleText").textContent = el("settingsRoundToggle").checked
    ? "Arredondar para .99 acima"
    : "Sem arredondamento";
}

function openSettingsModal() {
  const settings = loadStoreSettings();
  el("settingsKwh").value = settings.kwhPrice;
  el("settingsMarginPct").value = settings.marginPct;
  el("settingsFailurePct").value = settings.failurePct;
  el("settingsPrinterPrice").value = settings.printerPrice;
  el("settingsPrinterLifespan").value = settings.printerLifespanHours;
  el("settingsHourlyRate").value = settings.hourlyRate;
  el("settingsStoreName").value = settings.storeName;
  el("settingsCity").value = settings.city;
  el("settingsWhatsapp").value = settings.whatsapp;
  el("settingsInstagram").value = settings.instagram;
  el("settingsRoundToggle").checked = settings.roundDefault !== false;
  updateSettingsRoundText();
  el("settingsModalOverlay").hidden = false;
}

function closeSettingsModal() {
  el("settingsModalOverlay").hidden = true;
}

function saveStoreSettings() {
  const settings = {
    kwhPrice: el("settingsKwh").value.trim(),
    marginPct: el("settingsMarginPct").value.trim(),
    failurePct: el("settingsFailurePct").value.trim(),
    printerPrice: el("settingsPrinterPrice").value.trim(),
    printerLifespanHours: el("settingsPrinterLifespan").value.trim(),
    hourlyRate: el("settingsHourlyRate").value.trim(),
    storeName: el("settingsStoreName").value.trim(),
    city: el("settingsCity").value.trim(),
    whatsapp: el("settingsWhatsapp").value.trim(),
    instagram: el("settingsInstagram").value.trim(),
    roundDefault: el("settingsRoundToggle").checked,
  };

  localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(settings));
  applyStoreSettingsToCalculator(settings, { onlyIfEmpty: true });
  applyStoreBranding(settings);
  recalcAutoWear();
  closeSettingsModal();
}

function restoreStoreSettingsDefaults() {
  localStorage.removeItem(STORE_SETTINGS_KEY);

  [el("settingsKwh"), el("settingsMarginPct"), el("settingsFailurePct"),
   el("settingsPrinterPrice"), el("settingsPrinterLifespan"), el("settingsHourlyRate"),
   el("settingsStoreName"), el("settingsCity"), el("settingsWhatsapp"), el("settingsInstagram")]
    .forEach((input) => { input.value = ""; });
  el("settingsRoundToggle").checked = true;
  updateSettingsRoundText();

  applyStoreBranding(defaultStoreSettings());
  closeSettingsModal();
}

function initSettingsModal() {
  el("settingsBtn").addEventListener("click", openSettingsModal);
  el("settingsSaveBtn").addEventListener("click", saveStoreSettings);
  el("settingsResetBtn").addEventListener("click", restoreStoreSettingsDefaults);
  el("settingsRoundToggle").addEventListener("change", updateSettingsRoundText);

  // fecha ao clicar fora do card, igual a maioria dos modais por aí
  el("settingsModalOverlay").addEventListener("click", (event) => {
    if (event.target === el("settingsModalOverlay")) closeSettingsModal();
  });

  // aplica as preferências salvas assim que a página carrega
  const settings = loadStoreSettings();
  applyStoreSettingsToCalculator(settings);
  applyStoreBranding(settings);
}

// ---------------------------------------------------------
// "DESGASTE DA MÁQUINA" — CÁLCULO AUTOMÁTICO
// Se a loja configurou preço + vida útil da impressora, o campo
// "Desgaste da máquina (R$)" é preenchido sozinho com
// (preço ÷ vida útil em horas) × tempo total dessa impressão.
// O campo continua editável: como o recálculo só roda quando a
// impressora ou o tempo de impressão mudam, um valor digitado à mão
// fica intocado até uma dessas duas coisas mudar de novo.
// ---------------------------------------------------------
function computeAutoWearValue() {
  const settings = loadStoreSettings();
  const price = parseFloat(settings.printerPrice) || 0;
  const lifespan = parseFloat(settings.printerLifespanHours) || 0;
  if (price <= 0 || lifespan <= 0) return null;

  const hours = parseInt(printHoursInput.value, 10) || 0;
  const minutes = parseInt(printMinutesInput.value, 10) || 0;
  const totalHours = hours + minutes / 60;
  if (totalHours <= 0) return null;

  return (price / lifespan) * totalHours;
}

function recalcAutoWear() {
  const value = computeAutoWearValue();
  if (value === null) return;

  const input = el("proWear");
  input.value = value.toFixed(2);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function bindAutoWearRecalc() {
  printerSelect.addEventListener("change", recalcAutoWear);
  printHoursInput.addEventListener("input", recalcAutoWear);
  printMinutesInput.addEventListener("input", recalcAutoWear);

  // Ao ligar o switch, já tenta preencher sozinho em vez de esperar
  // a próxima troca de impressora/tempo pra calcular pela primeira vez.
  el("proWearToggle").addEventListener("change", () => {
    if (el("proWearToggle").checked) recalcAutoWear();
  });
}

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
 * o campo de nome personalizado (quando for "Outro") e prepara o
 * campo "Preço do filamento" na seção seguinte.
 * Quando prefillPrice=true (mudança feita pelo usuário), preenche o
 * campo de preço: com o valor padrão do catálogo para materiais
 * conhecidos, ou com "0.00" para "Outro" (a pessoa ajusta manualmente).
 * Na carga inicial da página (prefillPrice=false) o campo de preço
 * permanece vazio, para respeitar a regra de página limpa ao começar.
 * A dica abaixo do select é sempre o mesmo texto fixo — não fala mais
 * de valores, já que o preço agora vive só no campo da seção 2.
 */
function syncMaterialUI(prefillPrice) {
  const material = MATERIALS.find((m) => m.id === materialSelect.value);
  const isCustom = material.id === "outro";

  customWrap.hidden = !isCustom;
  materialHint.textContent = "Material utilizado na impressão";

  if (isCustom) {
    if (prefillPrice) {
      pricePerKgInput.value = "0.00";
      clearFieldError(pricePerKgInput);
    }
  } else {
    customNameInput.value = "";
    clearFieldError(customNameInput);
    if (prefillPrice) {
      pricePerKgInput.value = material.pricePerKg.toFixed(2);
      clearFieldError(pricePerKgInput);
    }
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
    rules.push({ input: customNameInput, test: (v) => v.trim().length > 0 });
  }

  // Custos profissionais: só valida os que estiverem com o switch ligado
  // (e só no modo Profissional) — os desligados nem entram na validação.
  if (isProMode()) {
    PRO_COSTS.forEach((cost) => {
      const fieldId = proFieldId(cost);
      if (!el(`${fieldId}Toggle`).checked) return;
      rules.push({ input: el(fieldId), test: (v) => v !== "" && Number(v) > 0 });
    });
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

  const proMode     = isProMode();
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

  // 4) Custo base = filamento + energia. É a mesma base usada pela margem
  //    de lucro em % (item 6) e, agora, pelos custos profissionais em %
  //    (item 5) — nenhum dos dois incide em cascata sobre o outro.
  const baseCost = filamentCost + energyCost;

  // 5) Custos profissionais (só no modo Profissional): cada item com o
  //    switch ligado entra na soma — os informados em R$ somam direto ao
  //    custo base, os informados em % incidem sobre o custo base (filamento
  //    + energia), do mesmo jeito que a margem de lucro em % já funciona.
  const proCosts = [];
  let proCostsTotal = 0;
  const hourlyRate = parseFloat(loadStoreSettings().hourlyRate) || 0;

  if (proMode) {
    PRO_COSTS.forEach((cost) => {
      const fieldId = proFieldId(cost);
      if (!el(`${fieldId}Toggle`).checked) return;
      const rawValue = parseFloat(el(fieldId).value) || 0;
      const value = cost.unit === "percent" ? baseCost * (rawValue / 100)
        : cost.unit === "laborMinutes" ? (hourlyRate / 60) * rawValue
        : rawValue;
      proCostsTotal += value;
      proCosts.push({ ...cost, rawValue, value, hourlyRate });
    });
  }

  // 6) Custo total da peça = custo base + custos profissionais ativos
  //    (no modo Básico, proCostsTotal é sempre 0 — custo total = custo base,
  //    exatamente como antes desta versão)
  const totalCost = baseCost + proCostsTotal;

  // 7) Lucro: se o usuário informou um valor fixo, o lucro é esse valor direto.
  //    Caso contrário, o lucro é a porcentagem informada sobre o custo base
  //    (filamento + energia) — igual já funcionava antes dos custos profissionais.
  const usingFixedMargin = marginFixedInput.value.trim() !== "";
  const profit = usingFixedMargin
    ? parseFloat(marginFixedInput.value) || 0
    : baseCost * ((parseFloat(marginPctInput.value) || 0) / 100);

  // 8) Preço calculado (sem arredondar) = custo total (com profissionais) + lucro
  const calculatedPrice = totalCost + profit;

  // 9) Preço final = aplica arredondamento inteligente, se ativado
  const finalPrice = shouldRound ? smartRoundUp(calculatedPrice) : calculatedPrice;

  // 10) Diferença adicionada pelo arredondamento
  const roundingDiff = finalPrice - calculatedPrice;

  const selectedMaterial = MATERIALS.find((m) => m.id === materialSelect.value);
  const materialName = selectedMaterial.id === "outro"
    ? (customNameInput.value.trim() || "Outro (personalizado)")
    : selectedMaterial.name;

  const result = {
    jobName: jobNameInput.value.trim(),
    printerName: printer.name,
    materialName,
    hours, minutes, grams,
    filamentCost, energyCost, energyKwh, baseCost, proCosts, proCostsTotal, totalCost,
    profit, calculatedPrice, finalPrice, roundingDiff,
    shouldRound, proMode,
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

  renderPieChart(r);

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
// GRÁFICO DE PIZZA — breakdown visual dos custos (SVG puro, sem lib)
// Fatias: Filamento, Energia, Custos profissionais (agrupados em uma
// só fatia — mais legível que 12 fatias individuais) e Lucro.
// ---------------------------------------------------------
function buildPieSlices(r) {
  const slices = [
    { label: "Filamento", value: r.filamentCost, color: "var(--accent-1)" },
    { label: "Energia", value: r.energyCost, color: "var(--accent-2)" },
  ];

  if (r.proMode && r.proCostsTotal > 0) {
    slices.push({ label: "Custos profissionais", value: r.proCostsTotal, color: "var(--amber)" });
  }

  slices.push({ label: "Lucro", value: r.profit, color: "var(--accent-mid)" });

  return slices.filter((s) => s.value > 0);
}

/** Converte um ângulo (em graus, 0 = topo, sentido horário) em coordenadas x/y no círculo. */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPieSVG(slices) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return "";

  const cx = 54, cy = 54, r = 50;
  let angle = 0;

  const shapes = slices.map((s) => {
    const fraction = s.value / total;
    const startAngle = angle;
    const endAngle = angle + fraction * 360;
    angle = endAngle;

    // Fatia única (100% do total) não forma um arco válido — desenha o círculo inteiro.
    if (fraction >= 0.9999) {
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${s.color}"></circle>`;
    }

    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
    return `<path d="${d}" fill="${s.color}"></path>`;
  }).join("");

  return `<svg viewBox="0 0 108 108" width="108" height="108" role="img" aria-label="Gráfico de pizza com o breakdown dos custos">${shapes}</svg>`;
}

function renderPieChart(r) {
  const slices = buildPieSlices(r);
  const pieWrap = el("readoutPie");

  if (!slices.length) {
    pieWrap.hidden = true;
    return;
  }

  el("pieChart").innerHTML = buildPieSVG(slices);
  el("pieLegend").innerHTML = slices.map((s) => `
    <div class="pie-legend-item">
      <span class="pie-legend-swatch" style="background:${s.color}"></span>
      <span class="pie-legend-label">${s.label}</span>
      <span class="pie-legend-value">${brl(s.value)}</span>
    </div>
  `).join("");

  pieWrap.hidden = false;
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
  customNameInput.value = "";
  kwhPriceInput.value = "";

  marginPctInput.value = "";
  marginFixedInput.value = "";
  marginPctInput.disabled = false;
  marginFixedInput.disabled = false;
  marginPctInput.classList.remove("disabled-field");
  marginFixedInput.classList.remove("disabled-field");
  clearMarginError();

  // Custos profissionais: desliga todos os switches e limpa valores/erros
  PRO_COSTS.forEach((cost) => {
    const fieldId = proFieldId(cost);
    const toggle  = el(`${fieldId}Toggle`);
    const input   = el(fieldId);
    toggle.checked = false;
    setExpanded(el(`${fieldId}Body`), false);
    input.value = "";
    clearFieldError(input);
  });

  [jobNameInput, printHoursInput, printMinutesInput, printGramsInput,
   pricePerKgInput, customNameInput, kwhPriceInput]
    .forEach(clearFieldError);

  // Reaplica as preferências da loja (kWh, margem, margem de falha,
  // desgaste/hora e arredondamento) sobre os campos agora vazios —
  // "Limpar tudo" começa um orçamento novo, não desliga os padrões salvos.
  applyStoreSettingsToCalculator(loadStoreSettings());

  el("finalPrice").textContent   = "R$ 0,00";
  el("totalCost").textContent    = "R$ 0,00";
  el("profitValue").textContent  = "R$ 0,00";
  el("filamentCost").textContent = "R$ 0,00";
  el("energyCost").textContent   = "R$ 0,00";
  el("filamentGramsSub").textContent = "0 g utilizados";
  el("energyKwhSub").textContent     = "0,00 kWh consumidos";
  el("roundingNote").textContent = "";

  el("readoutPie").hidden = true;
  el("pieChart").innerHTML = "";
  el("pieLegend").innerHTML = "";

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

  // Custos profissionais ativos, um por linha — mesmo formato de
  // Filamento/Energia acima (emoji + nome + valor). "Mão de obra" também
  // mostra a conta, já que o valor é derivado, não digitado direto.
  const proLines = r.proMode
    ? r.proCosts.map((c) => {
        if (c.unit === "laborMinutes") return `${c.emoji} ${c.label}: ${brl(c.value)} (${c.rawValue}min de preparo × ${brl(c.hourlyRate)}/h)`;
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
    `🧵 Filamento: ${brl(r.filamentCost)} (${r.grams} g utilizados)`,
    `⚡ Energia: ${brl(r.energyCost)} (${r.energyKwh.toFixed(2).replace(".", ",")} kWh consumidos)`,
    ...proLines,
    `📦 Custo total: ${brl(r.totalCost)}`,
    `📈 Lucro: ${brl(r.profit)}`,
    ``,
    `✅ *Preço final: ${brl(r.finalPrice)}*`,
  ];

  // Assinatura da loja (nome/cidade/WhatsApp/Instagram) — só entra o que
  // estiver configurado nas Configurações da loja.
  const signature = buildStoreSignatureLine(loadStoreSettings());
  if (signature) lines.push(``, signature);

  return lines.join("\n");
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

  customNameInput.addEventListener("input", () => clearFieldError(customNameInput));

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
  bindProCostEvents();
  bindAutoWearRecalc();
}

// ---------------------------------------------------------
// PWA — REGISTRA O SERVICE WORKER E CONTROLA O BOTÃO "INSTALAR APP"
// ---------------------------------------------------------
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // Sem problema se falhar (ex: rodando via file:// direto do disco) —
      // o app continua funcionando normalmente, só sem o modo offline/instalação.
    });
  });
}

function initInstallPrompt() {
  const installBtn = el("installBtn");
  const banner = el("installBanner");
  const bannerBtn = el("installBannerBtn");
  const dismissBtn = el("dismissInstallBanner");
  const modalOverlay = el("installModalOverlay");

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
  if (isStandalone) return; // já instalado, não precisa mostrar nada

  const wasDismissed = localStorage.getItem("np3d_install_banner_dismissed") === "1";
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  function showInstallUI() {
    installBtn.hidden = false;
    if (!wasDismissed) banner.hidden = false;
  }

  function hideInstallUI() {
    installBtn.hidden = true;
    banner.hidden = true;
  }

  dismissBtn.addEventListener("click", () => {
    banner.hidden = true;
    localStorage.setItem("np3d_install_banner_dismissed", "1");
  });

  if (isIOS) {
    // Safari no iOS não dispara "beforeinstallprompt" — mostramos o botão
    // e o banner direto, e ao clicar exibimos o passo a passo manual.
    showInstallUI();
    const openInstructions = () => { modalOverlay.hidden = false; };
    installBtn.addEventListener("click", openInstructions);
    bannerBtn.addEventListener("click", openInstructions);
    el("closeInstallModal").addEventListener("click", () => { modalOverlay.hidden = true; });
    return;
  }

  // Chrome/Edge/Android: o navegador avisa quando o app pode ser instalado.
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallUI();
  });

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hideInstallUI();
  };

  installBtn.addEventListener("click", triggerInstall);
  bannerBtn.addEventListener("click", triggerInstall);

  window.addEventListener("appinstalled", hideInstallUI);
}

// ---------------------------------------------------------
// BANNER "PROJETO GRATUITO" — reaparece a cada nova visita/sessão.
// Usa sessionStorage (não localStorage) de propósito: fechando o X,
// ele some só enquanto essa aba/sessão do navegador estiver aberta.
// Ao abrir de novo depois (nova aba, navegador fechado e reaberto
// etc.), o banner volta a aparecer.
// ---------------------------------------------------------
function initFreeBanner() {
  const seenThisSession = sessionStorage.getItem("np3d_free_banner_seen") === "1";
  if (seenThisSession) return;

  const banner = el("freeBanner");
  banner.hidden = false;

  el("closeFreeBanner").addEventListener("click", () => {
    banner.hidden = true;
    sessionStorage.setItem("np3d_free_banner_seen", "1");
  });
}

// ---------------------------------------------------------
// INICIALIZAÇÃO
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  populateSelects();
  populateProCosts();
  initTheme();
  initModeSwitch();
  bindEvents();
  initSettingsModal();
  registerServiceWorker();
  initInstallPrompt();
  initFreeBanner();
});
