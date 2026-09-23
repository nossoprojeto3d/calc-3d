/* =========================================================
   NOSSO PROJETO 3D — CALCULADORA V3 — script.js
   Os dados de impressoras e materiais ficam embutidos aqui mesmo
   pro app funcionar 100% abrindo o index.html direto no navegador
   (e offline, instalado como app), sem servidor.
   ========================================================= */

// ---------------------------------------------------------
// DADOS: IMPRESSORAS (agrupadas por marca no seletor)
// ---------------------------------------------------------
// power = potência nominal (W) usada no cálculo de energia.
// avgPurchasePrice/avgLifespanHours = preço médio de mercado (R$) e vida útil
// estimada, usados pelo cálculo automático de "Desgaste da máquina" no
// modo Profissional (ver computeAutoWearValue). Valores aproximados.
const PRINTERS = [
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
// pela pessoa — ver getSelectedPrinter. A vida útil usa um padrão genérico.
const CUSTOM_PRINTER_ID = "custom";
const CUSTOM_PRINTER_LIFESPAN_HOURS = 8000;
const CUSTOM_PRINTER_STORAGE_KEY = "np3d_custom_printer";

// ---------------------------------------------------------
// DADOS: FILAMENTOS (preço médio por kg em R$), agrupados por tipo.
// "Outro" fica sempre por último — é a opção de personalizar.
// ---------------------------------------------------------
const MATERIALS = [
  { id: "pla-basic",   group: "PLA",        name: "PLA Basic",   pricePerKg: 109.90 },
  { id: "pla-plus",    group: "PLA",        name: "PLA+",        pricePerKg: 99.90 },
  { id: "pla-matte",   group: "PLA",        name: "PLA Matte",   pricePerKg: 119.90 },
  { id: "silk-pla",    group: "PLA",        name: "Silk PLA",    pricePerKg: 129.90 },
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

// ---------------------------------------------------------
// DADOS: CUSTOS PROFISSIONAIS (modo Profissional)
// unit "currency" = valor direto em R$ que soma ao custo base.
// unit "percent"  = porcentagem que incide sobre o custo base
// (filamento + energia), do mesmo jeito que a margem de lucro em %.
// unit "laborMinutes" = minutos de preparo informados, convertidos em
// R$ usando o valor-hora das Configurações da loja ((valor-hora ÷ 60) × minutos).
// Se a pessoa não configurou o valor-hora, usa DEFAULT_HOURLY_RATE — o
// campo sempre calcula sozinho, nunca fica esperando configuração.
// "wear" e "shopee" também são "currency", mas com o valor recalculado
// sozinho por lógica própria (recalcAutoWear / recalcAutoShopee) sempre que
// um dado do qual dependem muda — o campo em si continua editável na mão.
// O emoji é usado só na formatação do texto copiado pro WhatsApp.
// ---------------------------------------------------------

// Valor-hora usado no cálculo de "Mão de obra" quando a pessoa ainda não
// configurou o próprio valor-hora nas Configurações da loja.
const DEFAULT_HOURLY_RATE = 30;

// Nome usado no orçamento quando a pessoa não dá nome à peça (o campo é opcional).
const DEFAULT_JOB_NAME = "Peça personalizada";

const PRO_COSTS = [
  { id: "wear",        label: "Desgaste da máquina", unit: "currency", placeholder: "Ex: 5,00",  emoji: "🔧",
    hint: "Calculado automaticamente a partir do preço médio de mercado e da vida útil estimada da impressora selecionada. Edite o valor acima se quiser usar outra conta." },
  { id: "labor",       label: "Mão de obra",         unit: "laborMinutes", fieldLabel: "Tempo de preparo (minutos)",
    errorText: "Informe o tempo de preparo, em minutos.", placeholder: "Ex: 15", emoji: "🧑‍🔧",
    hint: "Pra calcular sua mão de obra direito, você precisa informar quanto vale a sua hora de trabalho. Como você ainda não fez isso, estamos usando um valor padrão de R$ 30,00 por hora: 0min × R$ 30,00 ÷ 60 = R$ 0,00. Esse valor pode estar bem diferente da sua realidade — vale a pena configurar o seu valor-hora de verdade em Configurações da loja (ícone de engrenagem, no canto superior direito da página), pra cobrar um preço justo pelo seu trabalho." },
  { id: "failure",     label: "Margem de falha",     unit: "percent",  placeholder: "Ex: 10",    emoji: "⚠️",
    hint: "Ex: % do custo total pra cobrir peças que falham ou saem com defeito. Comum entre 5% e 15%.",
    shortcuts: [5, 10, 15], shortcutsHint: "Escolha um atalho ou digite o percentual que preferir." },
  { id: "packaging",   label: "Embalagem",           unit: "currency", placeholder: "Ex: 3,00",  emoji: "🎁",
    hint: "Inclua tudo que você gasta pra embalar o produto — caixa, plástico bolha, fita, etiqueta, sacola, ou qualquer material de embalagem, seja pra envio ou entrega presencial." },
  { id: "materials",   label: "Materiais e insumos", unit: "currency", placeholder: "Ex: 5,00",  emoji: "🧲",
    hint: "Inclua aqui qualquer material extra usado na peça, além do filamento — ímã, cola, tinta, parafusos, ou qualquer outro insumo usado na montagem ou no acabamento." },
  { id: "shopee",      label: "Taxa Shopee",         unit: "currency", placeholder: "Ex: 4,00",  emoji: "🛒",
    hint: "Selecione a faixa de preço em que o valor final do seu produto se encaixa, para calcularmos a taxa da Shopee automaticamente." },
  { id: "meli",        label: "Taxa Mercado Livre",  unit: "currency", placeholder: "Ex: 10,00", emoji: "🛍️",
    adTypeSelect: true,
    warningText: "Aproximação: não considera a categoria do produto (a comissão real varia por categoria) nem o frete grátis subsidiado em vendas acima de R$79. Vale a pena conferir a comissão exata da sua categoria no Simulador de Custos do Mercado Livre.",
    hint: "Calculado automaticamente com a comissão do tipo de anúncio selecionado + custo fixo (valores editáveis nas Configurações da loja), ajustando o preço pra você continuar recebendo o valor desejado depois da taxa. Edite o valor acima se quiser usar outra conta." },
  { id: "shipping",    label: "Frete",               unit: "currency", placeholder: "Ex: 15,00", emoji: "🚚",
    hint: "Ex: valor do frete que você paga ou repassa ao cliente." },
  { id: "taxes",       label: "Impostos",            unit: "percent",  placeholder: "Ex: 6",     emoji: "🏛️",
    hint: "Ex: % de imposto sobre o preço final (MEI, Simples Nacional etc.)." },
];

// Custos profissionais que entram na base da margem de lucro (geram lucro
// proporcional, igual filamento e energia). Os demais (Shopee, Mercado Livre,
// Frete, Impostos) são só repassados ao preço final, sem gerar margem.
const GROUP1_PRO_COST_IDS = ["wear", "labor", "failure", "packaging", "materials"];

// Cor fixa de cada custo profissional no gráfico de pizza — uma por tipo,
// sempre a mesma (ver os tokens --pro-* em style.css), diferente das cores
// de Filamento/Energia/Lucro.
const PRO_COST_PIE_COLORS = {
  wear: "var(--pro-wear)",
  labor: "var(--pro-labor)",
  failure: "var(--pro-failure)",
  packaging: "var(--pro-packaging)",
  materials: "var(--pro-materials)",
  shopee: "var(--pro-shopee)",
  meli: "var(--pro-meli)",
  shipping: "var(--pro-shipping)",
  taxes: "var(--pro-taxes)",
};

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
const exportPdfBtn      = el("exportPdfBtn");
const exportPdfBtnLabel = el("exportPdfBtnLabel");
const proItemGrid       = el("proItemGrid");
const proSection        = el("proSection");

const customPrinterPowerInput = el("customPrinterPower");
const customPrinterPriceInput = el("customPrinterPrice");

/** Impressora selecionada — do catálogo, ou a "Outra impressora" montada com
 *  a potência (e o preço pago, se informado) digitados pela pessoa. */
function getSelectedPrinter() {
  if (printerSelect.value === CUSTOM_PRINTER_ID) {
    const power = parseFloat(customPrinterPowerInput.value) || 0;
    if (power <= 0) return null;
    const price = parseFloat(customPrinterPriceInput.value) || 0;
    return {
      id: CUSTOM_PRINTER_ID,
      name: `Outra impressora (${power}W)`,
      power,
      avgPurchasePrice: price,
      avgLifespanHours: CUSTOM_PRINTER_LIFESPAN_HOURS,
    };
  }
  return PRINTERS.find((p) => p.id === printerSelect.value) || null;
}

// Guarda o último resultado calculado com sucesso, usado pelo botão "Copiar"
let lastResult = null;

// id do orçamento aberto/salvo em "Meus orçamentos" (null = orçamento novo,
// ainda não salvo). Enquanto houver um, recálculos atualizam o salvo.
let currentBudgetId = null;

// true assim que validateAll() passar sem nenhum campo inválido pela
// primeira vez (clique no botão ou checagem silenciosa automática — ver
// attemptAutoCalculate). Volta pra false se algum campo obrigatório for
// esvaziado ou ficar inválido de novo.
let formularioValidado = false;

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

  el("modeSwitch").dataset.active = mode;
  el("modeDesc").textContent = mode === "profissional"
    ? "Tudo do Básico + desgaste, mão de obra, embalagem, taxas de marketplace e impostos."
    : "Material, energia e lucro — o essencial pra precificar.";

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

    // Aviso fixo (ex.: ressalva da Taxa Mercado Livre) e seletor de tipo de
    // anúncio (Clássico/Premium) — ambos opcionais, só entram nos itens que
    // tiverem essas flags (hoje, só "meli").
    const warningHtml = cost.warningText ? `<p class="hint pro-item-warning">${cost.warningText}</p>` : "";
    const adTypeSelectHtml = cost.adTypeSelect ? `
        <select id="${fieldId}AdType" aria-label="Tipo de anúncio">
          <option value="classico">Clássico</option>
          <option value="premium" selected>Premium</option>
        </select>` : "";

    // "Taxa Shopee" e "Taxa Mercado Livre" fogem do padrão genérico de campo
    // em R$: em vez de um valor pra digitar, mostram opções de faixa (estilo
    // cartão/rádio) e, se "Personalizado" for escolhido, dois campinhos
    // manuais — ver renderShopeeTierOptions/renderMeliTierOptions e
    // computeAutoShopeeValue/computeAutoMeliValue. O campo em R$ de sempre
    // continua existindo por baixo (escondido): é ele que guarda o valor
    // calculado e mantém funcionando, sem mudança, toda a lógica que já lê
    // esse campo (cálculo, validação, WhatsApp, PDF).
    const customFieldsHtml = (customPctPlaceholder) => `
            <div class="field-grid two-cols" style="margin-top: 10px;">
              <div class="field">
                <label for="${fieldId}CustomPct">Comissão (%)</label>
                <input type="number" id="${fieldId}CustomPct" min="0" max="99" step="1" placeholder="${customPctPlaceholder}">
              </div>
              <div class="field">
                <label for="${fieldId}CustomFixed">Valor fixo (R$)</label>
                <input type="number" id="${fieldId}CustomFixed" min="0" step="0.01" placeholder="Ex: 4,00">
              </div>
            </div>
    `;

    const bodyContentHtml = cost.id === "shopee" ? `
            <div class="tier-options" id="proShopeeTierOptions"></div>
            <div class="reveal" id="proShopeeCustomFields" hidden>
              <div class="reveal-inner">
                ${customFieldsHtml("Ex: 20")}
              </div>
            </div>
            <input type="number" id="${fieldId}" hidden aria-hidden="true" tabindex="-1">
            <p class="field-error-text" id="${fieldId}Error" hidden>${errorText}</p>
            <p class="hint" id="${fieldId}Hint">${cost.hint}</p>
    ` : cost.id === "meli" ? `
            ${warningHtml}
            ${adTypeSelectHtml}
            <div class="tier-options" id="proMeliTierOptions"></div>
            <div class="reveal" id="proMeliCustomFields" hidden>
              <div class="reveal-inner">
                ${customFieldsHtml("Ex: 17")}
              </div>
            </div>
            <input type="number" id="${fieldId}" hidden aria-hidden="true" tabindex="-1">
            <p class="field-error-text" id="${fieldId}Error" hidden>${errorText}</p>
            <p class="hint" id="${fieldId}Hint">${cost.hint}</p>
    ` : `
            ${warningHtml}
            ${cost.fieldLabel ? `<label for="${fieldId}">${cost.fieldLabel}</label>` : ""}
            <div class="input-wrap">
              ${unitSuffix === "R$" ? `<span class="input-affix">R$</span>` : ""}
              <input type="number" id="${fieldId}" min="0" step="${step}" inputmode="decimal" placeholder="${cost.placeholder.replace(/^Ex:\s*/, "")}" aria-label="${unitLabel}">
              ${unitSuffix !== "R$" ? `<span class="input-affix">${unitSuffix}</span>` : ""}
            </div>
            ${adTypeSelectHtml}
            ${shortcutsHtml}
            ${shortcutsHintHtml}
            <p class="field-error-text" id="${fieldId}Error" hidden>${errorText}</p>
            <p class="hint" id="${fieldId}Hint">${cost.hint}</p>
    `;

    const item = document.createElement("div");
    item.className = "pro-item";
    item.id = `${fieldId}Item`;
    item.innerHTML = `
      <div class="pro-item-head">
        <span class="pro-item-label">${cost.label}</span>
        <label class="switch">
          <input type="checkbox" class="pro-toggle" id="${fieldId}Toggle">
          <span class="switch-track"><span class="switch-thumb"></span></span>
        </label>
      </div>
      <div class="reveal" id="${fieldId}Body" hidden>
        <div class="reveal-inner">
          <div class="field" style="margin-top: 10px;">
            ${bodyContentHtml}
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
      // Mudar qualquer outro custo profissional afeta a "Base" usada pela
      // Taxa Shopee e pela Taxa Mercado Livre (ver computeAutoShopeeValue /
      // computeAutoMeliValue) — recalcula as duas também. Shopee e Mercado
      // Livre não recalculam uma à outra (a Base de cada uma sempre exclui a
      // outra) e, além disso, são mutuamente exclusivas — ligar uma desliga a
      // outra automaticamente (ver bindAutoShopeeRecalc / bindAutoMeliRecalc).
      if (cost.id !== "shopee" && cost.id !== "meli") recalcAutoShopee();
      if (cost.id !== "meli" && cost.id !== "shopee") recalcAutoMeli();
    });

    input.addEventListener("input", () => {
      clearFieldError(input);
      syncShortcutActiveState(cost, input);
      if (cost.id !== "shopee" && cost.id !== "meli") recalcAutoShopee();
      if (cost.id !== "meli" && cost.id !== "shopee") recalcAutoMeli();
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
    hourlyRate: "", defaultPrinter: "",
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

  // Impressora padrão: só se aplica na carga da página e em "Limpar tudo"
  // (onlyIfEmpty=false) — nunca troca a impressora de um orçamento em
  // andamento quando as Configurações da loja são salvas no meio dele.
  if (!onlyIfEmpty && settings.defaultPrinter && PRINTERS.some((p) => p.id === settings.defaultPrinter)) {
    printerSelect.value = settings.defaultPrinter;
    printerSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

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
  el("settingsHourlyRate").value = settings.hourlyRate;
  el("settingsDefaultPrinter").value = settings.defaultPrinter;
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
    hourlyRate: el("settingsHourlyRate").value.trim(),
    defaultPrinter: el("settingsDefaultPrinter").value.trim(),
    storeName: el("settingsStoreName").value.trim(),
    city: el("settingsCity").value.trim(),
    whatsapp: el("settingsWhatsapp").value.trim(),
    instagram: el("settingsInstagram").value.trim(),
    roundDefault: el("settingsRoundToggle").checked,
  };

  localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(settings));
  applyStoreSettingsToCalculator(settings, { onlyIfEmpty: true });
  applyStoreBranding(settings);
  updateLaborHint();
  recalcAutoShopee();
  recalcAutoMeli();
  closeSettingsModal();
}

function restoreStoreSettingsDefaults() {
  localStorage.removeItem(STORE_SETTINGS_KEY);

  [el("settingsKwh"), el("settingsMarginPct"), el("settingsFailurePct"),
   el("settingsHourlyRate"), el("settingsDefaultPrinter"),
   el("settingsStoreName"), el("settingsCity"), el("settingsWhatsapp"), el("settingsInstagram")]
    .forEach((input) => { input.value = ""; });
  el("settingsRoundToggle").checked = true;
  updateSettingsRoundText();

  applyStoreBranding(defaultStoreSettings());
  updateLaborHint();
  recalcAutoShopee();
  recalcAutoMeli();
  closeSettingsModal();
}

function initSettingsModal() {
  el("settingsBtn").addEventListener("click", openSettingsModal);
  el("settingsSaveBtn").addEventListener("click", saveStoreSettings);
  el("settingsResetBtn").addEventListener("click", restoreStoreSettingsDefaults);
  el("settingsRoundToggle").addEventListener("change", updateSettingsRoundText);
  el("closeSettingsBtn").addEventListener("click", closeSettingsModal);

  // Esc também fecha (sem salvar), como o "x" e o clique fora
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("settingsModalOverlay").hidden) closeSettingsModal();
  });

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
// O valor vem embutido no catálogo PRINTERS (avgPurchasePrice /
// avgLifespanHours de cada impressora, preço médio de mercado) — não
// depende de nada configurado pela pessoa. O campo "Desgaste da
// máquina (R$)" é preenchido sozinho com (preço médio ÷ vida útil em
// horas) × tempo total dessa impressão, usando a impressora selecionada.
// O campo continua editável: como o recálculo só roda quando a
// impressora ou o tempo de impressão mudam, um valor digitado à mão
// fica intocado até uma dessas duas coisas mudar de novo.
// ---------------------------------------------------------
function computeAutoWearValue() {
  const printer = getSelectedPrinter();
  if (!printer || !(printer.avgPurchasePrice > 0)) return null;

  const hours = parseInt(printHoursInput.value, 10) || 0;
  const minutes = parseInt(printMinutesInput.value, 10) || 0;
  const totalHours = hours + minutes / 60;
  if (totalHours <= 0) return null;

  const value = (printer.avgPurchasePrice / printer.avgLifespanHours) * totalHours;
  return { printer, hours, minutes, value };
}

/** Monta o texto do hint do "Desgaste da máquina" com a conta de verdade
 *  (ou o texto genérico, quando ainda não há tempo de impressão preenchido). */
function updateWearHint(details) {
  const hintEl = el("proWearHint");
  if (!hintEl) return;

  if (!details) {
    hintEl.textContent = printerSelect.value === CUSTOM_PRINTER_ID && !(parseFloat(customPrinterPriceInput.value) > 0)
      ? "Pra calcular sozinho, informe quanto a impressora custou (em “Outra impressora”, lá em cima) — ou digite o valor do desgaste acima."
      : "Calculado automaticamente a partir do preço médio de mercado e da vida útil estimada da impressora selecionada. Edite o valor acima se quiser usar outra conta.";
    return;
  }

  const { printer, hours, minutes, value } = details;
  const timeLabel = `${hours}h${String(minutes).padStart(2, "0")}`;
  const priceLabel = printer.avgPurchasePrice.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const lifespanLabel = printer.avgLifespanHours.toLocaleString("pt-BR");

  hintEl.textContent = `Estimativa: R$ ${priceLabel} (preço médio da impressora) ÷ ${lifespanLabel}h (vida útil estimada) × ${timeLabel} (tempo dessa impressão) = ${brl(value)}. Edite o valor acima se quiser usar outra conta.`;
}

// Último valor preenchido sozinho no "Desgaste" — se o campo ainda tiver
// esse valor quando a conta deixar de ser possível (ex.: "Outra impressora"
// sem preço informado), ele é limpo; um valor digitado à mão é mantido.
let lastAutoWearValue = null;

function recalcAutoWear() {
  const details = computeAutoWearValue();
  updateWearHint(details);
  const input = el("proWear");

  if (!details) {
    if (lastAutoWearValue !== null && input.value === lastAutoWearValue) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    lastAutoWearValue = null;
    return;
  }

  input.value = details.value.toFixed(2);
  lastAutoWearValue = input.value;
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

  recalcAutoWear();
}

// ---------------------------------------------------------
// "MÃO DE OBRA" — VALOR-HORA EFETIVO E TEXTO DINÂMICO DO HINT
// Usa o valor-hora real configurado nas Configurações da loja quando
// existe; senão usa DEFAULT_HOURLY_RATE — o cálculo (rodado na hora de
// "Calcular preço", (valor-hora ÷ 60) × minutos) nunca fica sem rodar.
// ---------------------------------------------------------
function getEffectiveHourlyRate() {
  const configured = parseFloat(loadStoreSettings().hourlyRate) || 0;
  return configured > 0
    ? { rate: configured, isDefault: false }
    : { rate: DEFAULT_HOURLY_RATE, isDefault: true };
}

function updateLaborHint() {
  const hintEl = el("proLaborHint");
  if (!hintEl) return;

  const { rate, isDefault } = getEffectiveHourlyRate();
  const minutes = parseFloat(el("proLabor").value) || 0;
  const value = (rate / 60) * minutes;

  hintEl.textContent = isDefault
    ? `Pra calcular sua mão de obra direito, você precisa informar quanto vale a sua hora de trabalho. Como você ainda não fez isso, estamos usando um valor padrão de ${brl(rate)} por hora: ${minutes}min × ${brl(rate)} ÷ 60 = ${brl(value)}. Esse valor pode estar bem diferente da sua realidade — vale a pena configurar o seu valor-hora de verdade em Configurações da loja (ícone de engrenagem, no canto superior direito da página), pra cobrar um preço justo pelo seu trabalho.`
    : `Baseado no seu valor-hora de ${brl(rate)} (configurado nas Configurações da loja): ${minutes}min × ${brl(rate)} ÷ 60 = ${brl(value)} de mão de obra.`;
}

function bindLaborHintRecalc() {
  el("proLabor").addEventListener("input", updateLaborHint);
  updateLaborHint();
}

// ---------------------------------------------------------
// "TAXA SHOPEE" — CÁLCULO REVERSO AUTOMÁTICO
// Diferente dos outros custos em %, a comissão da Shopee incide sobre o
// PREÇO FINAL de venda, não sobre o custo — então o preço final e a taxa
// dependem um do outro. Resolvemos isso com uma fórmula reversa: dada a
// "Base" (tudo que não é a taxa Shopee — filamento + energia + demais
// custos profissionais ativos + lucro desejado), testamos as 3 faixas de
// comissão em ordem crescente e usamos a primeira cujo preço candidato
// ((Base + taxa fixa da faixa) ÷ (1 − comissão da faixa)) cair dentro do
// próprio intervalo de preço daquela faixa. A Taxa Shopee exibida é a
// diferença entre esse preço final e a Base.
// Os limites das faixas (R$8 e R$80) são fixos; comissão e taxa fixa de
// cada faixa são editáveis nas Configurações da loja (em branco = padrão).
// ---------------------------------------------------------
const SHOPEE_TIER_RANGES = [
  { min: 0,  max: 8,        label: "abaixo de R$ 8,00" },
  { min: 8,  max: 80,       label: "de R$ 8,00 a R$ 79,99" },
  { min: 80, max: Infinity, label: "a partir de R$ 80,00" },
];

// Rótulos das 3 faixas na opção de seleção (capitalizados, sem o "de"/"a"
// em minúsculo que fica bem no meio de uma frase mas não como título).
const SHOPEE_TIER_OPTION_LABELS = ["Abaixo de R$ 8,00", "De R$ 8,00 a R$ 79,99", "A partir de R$ 80,00"];

// Faixa de comissão da Taxa Shopee escolhida pela pessoa: 0, 1 ou 2 (índice
// em SHOPEE_TIER_RANGES) ou "custom"; null enquanto nenhuma foi escolhida
// ainda (nesse caso, a faixa correspondente ao preço atual é sugerida
// automaticamente — ver computeAutoShopeeValue). Uma vez escolhida, a
// pessoa manda: nunca trocamos essa escolha sozinhos.
let shopeeSelectedTier = null;

const SHOPEE_DEFAULT_TIERS = [
  { commissionPct: 50, fixedFee: 0 },
  { commissionPct: 20, fixedFee: 4 },
  { commissionPct: 14, fixedFee: 20 },
];

/** As 3 faixas da Shopee — sempre os valores padrão fixos (a Taxa Shopee só
 *  se ajusta manualmente pela opção "Personalizado" no próprio campo). */
function getEffectiveShopeeTiers() {
  return SHOPEE_DEFAULT_TIERS.map((def) => ({ ...def }));
}

/** Preço candidato de uma faixa: (Base + taxa fixa) ÷ (1 − comissão). Devolve
 *  null se a comissão configurada tornar a conta inválida (ex.: ≥ 100%). */
function computeShopeeCandidate(base, tier) {
  const commission = Math.min(Math.max(tier.commissionPct, 0), 99.999);
  const denominator = 1 - commission / 100;
  if (denominator <= 0) return null;
  return (base + Math.max(tier.fixedFee, 0)) / denominator;
}

/** Testa as 3 faixas em ordem crescente e devolve a primeira cujo preço
 *  candidato cai dentro do próprio intervalo — essa é a faixa correta. */
function pickShopeeTier(base) {
  const tiers = getEffectiveShopeeTiers();

  for (let i = 0; i < tiers.length; i++) {
    const candidate = computeShopeeCandidate(base, tiers[i]);
    if (candidate === null) continue;
    if (candidate >= SHOPEE_TIER_RANGES[i].min && candidate < SHOPEE_TIER_RANGES[i].max) {
      return { tierIndex: i, tier: tiers[i], finalPrice: candidate };
    }
  }

  // Nenhuma faixa "bateu" (configuração atípica) — usa a última faixa como
  // respaldo, pra nunca deixar a Taxa Shopee sem um cálculo.
  const lastIndex = tiers.length - 1;
  const fallbackCandidate = computeShopeeCandidate(base, tiers[lastIndex]);
  return { tierIndex: lastIndex, tier: tiers[lastIndex], finalPrice: fallbackCandidate ?? base };
}

/** Comissão + taxa fixa da faixa atualmente escolhida (preset ou "Personalizado"). */
function getSelectedShopeeRate() {
  if (shopeeSelectedTier === "custom") {
    return {
      commissionPct: parseFloat(el("proShopeeCustomPct").value) || 0,
      fixedFee: parseFloat(el("proShopeeCustomFixed").value) || 0,
    };
  }
  const tiers = getEffectiveShopeeTiers();
  const idx = typeof shopeeSelectedTier === "number" ? shopeeSelectedTier : 0;
  return tiers[idx];
}

/** Texto de uma opção de faixa preset — omite o "+ fixo" quando a faixa não tem taxa fixa configurada. */
function shopeeTierOptionText(rangeLabel, tier) {
  return tier.fixedFee > 0
    ? `${rangeLabel} — ${tier.commissionPct}% + ${brl(tier.fixedFee)} fixo`
    : `${rangeLabel} — ${tier.commissionPct}% de comissão`;
}

/** Reconstrói as 4 opções de faixa da Taxa Shopee (3 presets + Personalizado),
 *  refletindo os valores configurados nas Configurações da loja e destacando
 *  a que estiver selecionada no momento. */
function renderShopeeTierOptions() {
  const wrap = el("proShopeeTierOptions");
  if (!wrap) return;

  const tiers = getEffectiveShopeeTiers();
  const presetsHtml = tiers.map((tier, i) => `
    <button type="button" class="tier-option${shopeeSelectedTier === i ? " active" : ""}" data-tier="${i}">
      ${shopeeTierOptionText(SHOPEE_TIER_OPTION_LABELS[i], tier)}
    </button>
  `).join("");
  const customHtml = `
    <button type="button" class="tier-option${shopeeSelectedTier === "custom" ? " active" : ""}" data-tier="custom">
      Personalizado
    </button>
  `;

  wrap.innerHTML = presetsHtml + customHtml;
  wrap.querySelectorAll(".tier-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.tier === "custom" ? "custom" : Number(btn.dataset.tier);
      selectShopeeTier(value);
    });
  });
}

/** Aplica a escolha de faixa da pessoa (clique num card): passa a mandar
 *  nessa faixa, mostra/esconde os campos de "Personalizado" e recalcula. */
function selectShopeeTier(value) {
  shopeeSelectedTier = value;
  setExpanded(el("proShopeeCustomFields"), value === "custom");
  recalcAutoShopee();
}

/**
 * Calcula a "Base" comum às fórmulas reversas de Taxa Shopee e Taxa Mercado
 * Livre: custo material + custos profissionais do GRUPO 1 + lucro (incidindo
 * só sobre esses) + custos do GRUPO 2 que não são taxa de marketplace (frete
 * e impostos). Nunca inclui a própria Taxa Shopee nem a Taxa Mercado Livre —
 * cada uma é calculada em cima dessa mesma Base, sem depender da outra.
 * Sempre calcula algo (mesmo que a Base ainda seja 0) — nunca fica esperando
 * configuração.
 */
function computeMarketplaceFeeBase() {
  const printer = getSelectedPrinter();
  if (!printer) return null;

  const hours = parseInt(printHoursInput.value, 10) || 0;
  const minutes = parseInt(printMinutesInput.value, 10) || 0;
  const totalHours = hours + minutes / 60;
  const grams = parseFloat(printGramsInput.value) || 0;
  const pricePerKg = parseFloat(pricePerKgInput.value) || 0;
  const kwhPrice = parseFloat(kwhPriceInput.value) || 0;

  const filamentCost = (grams / 1000) * pricePerKg;
  const energyCost = ((printer.power / 1000) * totalHours) * kwhPrice;
  const baseCost = filamentCost + energyCost;

  const hourlyRate = getEffectiveHourlyRate().rate;
  let group1Total = 0;
  let group2NonFeeTotal = 0; // frete + impostos (nunca shopee/meli)

  if (isProMode()) {
    PRO_COSTS.forEach((cost) => {
      if (cost.id === "shopee" || cost.id === "meli") return;
      const fieldId = proFieldId(cost);
      const toggleEl = el(`${fieldId}Toggle`);
      if (!toggleEl || !toggleEl.checked) return;
      const rawValue = parseFloat(el(fieldId).value) || 0;
      const value = cost.unit === "percent" ? baseCost * (rawValue / 100)
        : cost.unit === "laborMinutes" ? (hourlyRate / 60) * rawValue
        : rawValue;
      if (GROUP1_PRO_COST_IDS.includes(cost.id)) group1Total += value;
      else group2NonFeeTotal += value;
    });
  }

  const marginBase = baseCost + group1Total;
  const usingFixedMargin = marginFixedInput.value.trim() !== "";
  const profit = usingFixedMargin
    ? parseFloat(marginFixedInput.value) || 0
    : marginBase * ((parseFloat(marginPctInput.value) || 0) / 100);

  return { base: marginBase + profit + group2NonFeeTotal };
}

/**
 * Calcula a Taxa Shopee com a faixa ATUALMENTE escolhida (preset ou
 * "Personalizado") — aplica a fórmula reversa direto com a comissão e taxa
 * fixa dessa faixa, sem testar se o preço resultante cai dentro do
 * intervalo (a pessoa já escolheu explicitamente, não precisa validar isso).
 * Se ainda não houver faixa escolhida (primeira vez que o switch liga),
 * sugere automaticamente a que bate com o preço atual — só essa vez.
 */
/** Confere se já dá pra calcular um preço final de verdade (impressora, tempo
 *  de impressão, peso, preço do filamento e kWh preenchidos) — usado só pra
 *  decidir a pré-seleção inicial da faixa da Taxa Shopee. */
function hasCalculablePrintJob() {
  const printer = getSelectedPrinter();
  if (!printer) return false;
  if (!printHoursTest(printHoursInput.value) || !printMinutesTest(printMinutesInput.value)) return false;
  if (Number(printHoursInput.value) === 0 && Number(printMinutesInput.value) === 0) return false;
  if (!(parseFloat(printGramsInput.value) > 0)) return false;
  if (!(parseFloat(pricePerKgInput.value) > 0)) return false;
  if (!(parseFloat(kwhPriceInput.value) > 0)) return false;
  return true;
}

function computeAutoShopeeValue() {
  const baseDetails = computeMarketplaceFeeBase();
  if (!baseDetails) return null;

  const { base } = baseDetails;

  // Ainda não escolheu nenhuma faixa: se já der pra calcular um preço final
  // de verdade, sugere a faixa correspondente; senão, pré-seleciona a
  // primeira faixa como padrão. Só decide isso de vez quando o switch da
  // Taxa Shopee já está ligado (senão um recálculo de fundo — ex.: ao
  // carregar a página, ainda com os campos vazios — travaria a faixa 0 pra
  // sempre antes da pessoa sequer ativar o custo). Depois de decidido, a
  // escolha da pessoa manda.
  if (shopeeSelectedTier === null && el("proShopeeToggle").checked) {
    shopeeSelectedTier = hasCalculablePrintJob() ? pickShopeeTier(base).tierIndex : 0;
  }

  const rate = getSelectedShopeeRate();
  const finalPrice = computeShopeeCandidate(base, rate) ?? base;
  const feeValue = finalPrice - base;

  return { base, feeValue, tier: rate, finalPrice };
}

/** Mostra o texto fixo e instrutivo do hint da "Taxa Shopee". */
function updateShopeeHint() {
  const hintEl = el("proShopeeHint");
  if (!hintEl) return;

  // Texto fixo e instrutivo — não muda com a faixa selecionada nem com a
  // conta calculada (o valor da taxa em R$ já aparece na própria opção
  // selecionada e no resumo/breakdown).
  hintEl.textContent = "Selecione a faixa de preço em que o valor final do seu produto se encaixa, para calcularmos a taxa da Shopee automaticamente.";
}

function recalcAutoShopee() {
  const details = computeAutoShopeeValue();
  renderShopeeTierOptions();
  updateShopeeHint();
  if (!details) return;

  const input = el("proShopee");
  input.value = details.feeValue.toFixed(2);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function bindAutoShopeeRecalc() {
  printerSelect.addEventListener("change", recalcAutoShopee);
  [printHoursInput, printMinutesInput, printGramsInput, pricePerKgInput, kwhPriceInput, marginPctInput, marginFixedInput]
    .forEach((input) => input.addEventListener("input", recalcAutoShopee));

  // A "Base" (ver computeMarketplaceFeeBase) também depende de todos os
  // demais custos profissionais — precisa recalcular sempre que o campo ou o
  // switch de qualquer um deles mudar. Não escuta "shopee" (é o próprio
  // campo) nem "meli" (a Base nunca inclui a taxa de marketplace da outra).
  PRO_COSTS.forEach((cost) => {
    if (cost.id === "shopee" || cost.id === "meli") return;
    const fieldId = proFieldId(cost);
    el(fieldId).addEventListener("input", recalcAutoShopee);
    el(`${fieldId}Toggle`).addEventListener("change", recalcAutoShopee);
  });

  // Mutuamente exclusiva com "Taxa Mercado Livre" — é a mesma venda em um
  // único canal, então ligar uma desliga a outra automaticamente (mesmo
  // padrão da margem de lucro em % x valor fixo).
  el("proShopeeToggle").addEventListener("change", () => {
    if (!el("proShopeeToggle").checked) return;

    const meliToggle = el("proMeliToggle");
    if (meliToggle.checked) {
      meliToggle.checked = false;
      meliToggle.dispatchEvent(new Event("change", { bubbles: true }));
      showQuickToast('Taxa Mercado Livre desativada — você só pode usar uma taxa de marketplace por vez.');
    }
    recalcAutoShopee();
  });

  // Campos de "Personalizado" — recalcula na hora ao editar.
  [el("proShopeeCustomPct"), el("proShopeeCustomFixed")].forEach((input) => {
    input.addEventListener("input", recalcAutoShopee);
  });

  recalcAutoShopee();
}

// ---------------------------------------------------------
// "TAXA MERCADO LIVRE" — CÁLCULO REVERSO AUTOMÁTICO
// Mesma ideia da Taxa Shopee (a comissão incide sobre o preço final, não
// sobre o custo), mas com só 2 faixas de preço (limite fixo: R$79) e uma
// única comissão por vez — a do tipo de anúncio selecionado (Clássico ou
// Premium, ao lado do campo). Abaixo de R$79 tem custo fixo somado; a
// partir de R$79 não tem custo fixo. A Taxa Mercado Livre exibida é a
// diferença entre o preço final encontrado e a Base.
// Comissões e custo fixo são editáveis nas Configurações da loja.
// ---------------------------------------------------------
const MELI_PRICE_THRESHOLD = 79;

const MELI_DEFAULT_SETTINGS = {
  commissionClassico: 12,
  commissionPremium: 17,
  fixedFee: 6,
};

/** Comissões/custo fixo do Mercado Livre — sempre os valores padrão fixos (a
 *  Taxa Mercado Livre só se ajusta manualmente pela opção "Personalizado"). */
function getEffectiveMeliSettings() {
  return { ...MELI_DEFAULT_SETTINGS };
}

/** Preço candidato: (Base + custo fixo) ÷ (1 − comissão). Devolve null se a
 *  comissão configurada tornar a conta inválida (ex.: ≥ 100%). */
function computeMeliCandidate(base, commissionPct, fixedFee) {
  const commission = Math.min(Math.max(commissionPct, 0), 99.999);
  const denominator = 1 - commission / 100;
  if (denominator <= 0) return null;
  return (base + Math.max(fixedFee, 0)) / denominator;
}

/** Testa a faixa "abaixo de R$79" (com custo fixo) e depois "a partir de
 *  R$79" (sem custo fixo), usando a primeira cujo candidato cai no próprio intervalo. */
function pickMeliTier(base, commissionPct, fixedFee) {
  const belowCandidate = computeMeliCandidate(base, commissionPct, fixedFee);
  if (belowCandidate !== null && belowCandidate >= 0 && belowCandidate < MELI_PRICE_THRESHOLD) {
    return { tier: "below", finalPrice: belowCandidate, fixedFeeUsed: fixedFee };
  }

  const fromCandidate = computeMeliCandidate(base, commissionPct, 0);
  if (fromCandidate !== null && fromCandidate >= MELI_PRICE_THRESHOLD) {
    return { tier: "from", finalPrice: fromCandidate, fixedFeeUsed: 0 };
  }

  // Nenhuma faixa "bateu" (configuração atípica) — usa a faixa "a partir de
  // R$79" como respaldo, pra nunca deixar a Taxa Mercado Livre sem cálculo.
  return { tier: "from", finalPrice: fromCandidate ?? base, fixedFeeUsed: 0 };
}

// Faixa da Taxa Mercado Livre escolhida pela pessoa: "below", "from" ou
// "custom"; null enquanto nenhuma foi escolhida ainda (mesmo padrão da
// Taxa Shopee — ver shopeeSelectedTier).
let meliSelectedTier = null;

/** Tipo de anúncio selecionado + comissão/custo fixo efetivos pra ele
 *  (configurados nas Configurações da loja, ou o padrão do Mercado Livre). */
function getMeliAdTypeRate() {
  const adTypeEl = el("proMeliAdType");
  const adType = adTypeEl && adTypeEl.value === "classico" ? "classico" : "premium";
  const meliSettings = getEffectiveMeliSettings();
  const commissionPct = adType === "classico" ? meliSettings.commissionClassico : meliSettings.commissionPremium;
  return { adType, commissionPct, fixedFee: meliSettings.fixedFee };
}

/** Comissão + taxa fixa da faixa atualmente escolhida (preset ou "Personalizado"). */
function getSelectedMeliRate() {
  if (meliSelectedTier === "custom") {
    return {
      commissionPct: parseFloat(el("proMeliCustomPct").value) || 0,
      fixedFee: parseFloat(el("proMeliCustomFixed").value) || 0,
    };
  }
  const { commissionPct, fixedFee } = getMeliAdTypeRate();
  return { commissionPct, fixedFee: meliSelectedTier === "below" ? fixedFee : 0 };
}

/** Texto de uma opção de faixa preset da Taxa Mercado Livre. */
function meliTierOptionText(tier, commissionPct, fixedFee) {
  return tier === "below"
    ? `Abaixo de R$ 79,00 — ${commissionPct}% + ${brl(fixedFee)} fixo`
    : `A partir de R$ 79,00 — ${commissionPct}% (sem custo fixo)`;
}

/** Reconstrói as 3 opções de faixa da Taxa Mercado Livre (2 presets +
 *  Personalizado), refletindo o tipo de anúncio e os valores configurados
 *  nas Configurações da loja, e destacando a que estiver selecionada. */
function renderMeliTierOptions() {
  const wrap = el("proMeliTierOptions");
  if (!wrap) return;

  const { commissionPct, fixedFee } = getMeliAdTypeRate();
  const presetsHtml = ["below", "from"].map((tier) => `
    <button type="button" class="tier-option${meliSelectedTier === tier ? " active" : ""}" data-tier="${tier}">
      ${meliTierOptionText(tier, commissionPct, fixedFee)}
    </button>
  `).join("");
  const customHtml = `
    <button type="button" class="tier-option${meliSelectedTier === "custom" ? " active" : ""}" data-tier="custom">
      Personalizado
    </button>
  `;

  wrap.innerHTML = presetsHtml + customHtml;
  wrap.querySelectorAll(".tier-option").forEach((btn) => {
    btn.addEventListener("click", () => selectMeliTier(btn.dataset.tier));
  });
}

/** Aplica a escolha de faixa da pessoa (clique num card): passa a mandar
 *  nessa faixa, mostra/esconde os campos de "Personalizado" e recalcula. */
function selectMeliTier(value) {
  meliSelectedTier = value;
  setExpanded(el("proMeliCustomFields"), value === "custom");
  recalcAutoMeli();
}

/**
 * Calcula a Taxa Mercado Livre com a faixa ATUALMENTE escolhida (preset ou
 * "Personalizado") — aplica a fórmula reversa direto com a comissão e taxa
 * fixa dessa faixa, sem testar se o preço resultante cai dentro do
 * intervalo. Se ainda não houver faixa escolhida (primeira vez que o switch
 * liga), sugere automaticamente a que bate com o preço atual — só essa vez.
 */
function computeAutoMeliValue() {
  const baseDetails = computeMarketplaceFeeBase();
  if (!baseDetails) return null;

  const { base } = baseDetails;

  if (meliSelectedTier === null && el("proMeliToggle").checked) {
    if (hasCalculablePrintJob()) {
      const { commissionPct, fixedFee } = getMeliAdTypeRate();
      meliSelectedTier = pickMeliTier(base, commissionPct, fixedFee).tier;
    } else {
      meliSelectedTier = "below";
    }
  }

  const rate = getSelectedMeliRate();
  const finalPrice = computeMeliCandidate(base, rate.commissionPct, rate.fixedFee) ?? base;
  const feeValue = finalPrice - base;

  return { base, feeValue, tier: rate, finalPrice };
}

/** Mostra o texto fixo e instrutivo do hint da "Taxa Mercado Livre". */
function updateMeliHint() {
  const hintEl = el("proMeliHint");
  if (!hintEl) return;

  hintEl.textContent = "Selecione a faixa de preço em que o valor final do seu produto se encaixa, para calcularmos a taxa do Mercado Livre automaticamente.";
}

function recalcAutoMeli() {
  const details = computeAutoMeliValue();
  renderMeliTierOptions();
  updateMeliHint();
  if (!details) return;

  const input = el("proMeli");
  input.value = details.feeValue.toFixed(2);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function bindAutoMeliRecalc() {
  printerSelect.addEventListener("change", recalcAutoMeli);
  [printHoursInput, printMinutesInput, printGramsInput, pricePerKgInput, kwhPriceInput, marginPctInput, marginFixedInput]
    .forEach((input) => input.addEventListener("input", recalcAutoMeli));

  // A "Base" (ver computeMarketplaceFeeBase) também depende de todos os
  // demais custos profissionais — precisa recalcular sempre que o campo ou o
  // switch de qualquer um deles mudar. Não escuta "meli" (é o próprio campo)
  // nem "shopee" (a Base nunca inclui a taxa de marketplace da outra).
  PRO_COSTS.forEach((cost) => {
    if (cost.id === "meli" || cost.id === "shopee") return;
    const fieldId = proFieldId(cost);
    el(fieldId).addEventListener("input", recalcAutoMeli);
    el(`${fieldId}Toggle`).addEventListener("change", recalcAutoMeli);
  });

  // Trocar o tipo de anúncio (Clássico/Premium) atualiza a comissão usada
  // pelas faixas preset, mas mantém a faixa (não o tipo de anúncio) que a
  // pessoa já tinha escolhido.
  el("proMeliAdType").addEventListener("change", recalcAutoMeli);

  // Campos de "Personalizado" — recalcula na hora ao editar.
  [el("proMeliCustomPct"), el("proMeliCustomFixed")].forEach((input) => {
    input.addEventListener("input", recalcAutoMeli);
  });

  // Mutuamente exclusiva com "Taxa Shopee" — é a mesma venda em um único
  // canal, então ligar uma desliga a outra automaticamente (mesmo padrão da
  // margem de lucro em % x valor fixo).
  el("proMeliToggle").addEventListener("change", () => {
    if (!el("proMeliToggle").checked) return;

    const shopeeToggle = el("proShopeeToggle");
    if (shopeeToggle.checked) {
      shopeeToggle.checked = false;
      shopeeToggle.dispatchEvent(new Event("change", { bubbles: true }));
      showQuickToast('Taxa Shopee desativada — você só pode usar uma taxa de marketplace por vez.');
    }
    recalcAutoMeli();
  });

  recalcAutoMeli();
}

// ---------------------------------------------------------
// TOAST RÁPIDO — feedback temporário e discreto (ex.: aviso de que uma taxa
// de marketplace foi desativada automaticamente). Some sozinho, sem exigir
// clique nem travar a tela.
// ---------------------------------------------------------
let quickToastTimer = null;

function showQuickToast(message) {
  const toastEl = el("quickToast");
  if (!toastEl) return;

  el("quickToastText").textContent = message;
  toastEl.hidden = false;
  void toastEl.offsetWidth; // força reflow pra reiniciar a animação de entrada
  toastEl.style.animation = "none";
  void toastEl.offsetWidth;
  toastEl.style.animation = "";

  clearTimeout(quickToastTimer);
  quickToastTimer = setTimeout(() => { toastEl.hidden = true; }, 3500);
}

/**
 * Preenche os <select> de impressora e material a partir dos
 * arrays PRINTERS / MATERIALS acima.
 */
function populateSelects() {
  const settingsDefaultPrinterSelect = el("settingsDefaultPrinter");

  // Agrupa as impressoras por marca (<optgroup>), na ordem em que aparecem.
  const brands = [...new Set(PRINTERS.map((p) => p.brand))];
  brands.forEach((brand) => {
    const group = document.createElement("optgroup");
    group.label = brand;
    const settingsGroup = document.createElement("optgroup");
    settingsGroup.label = brand;

    PRINTERS.filter((p) => p.brand === brand).forEach((p) => {
      group.appendChild(new Option(p.name, p.id));
      settingsGroup.appendChild(new Option(p.name, p.id));
    });

    printerSelect.appendChild(group);
    settingsDefaultPrinterSelect.appendChild(settingsGroup);
  });

  const otherGroup = document.createElement("optgroup");
  otherGroup.label = "Outra";
  otherGroup.appendChild(new Option("Outra impressora (informar potência)", CUSTOM_PRINTER_ID));
  printerSelect.appendChild(otherGroup);

  const materialGroups = [...new Set(MATERIALS.map((m) => m.group))];
  materialGroups.forEach((groupName) => {
    const group = document.createElement("optgroup");
    group.label = groupName;
    MATERIALS.filter((m) => m.group === groupName).forEach((m) => {
      group.appendChild(new Option(m.name, m.id));
    });
    materialSelect.appendChild(group);
  });

  // "Outra impressora": relembra a potência/preço usados da última vez
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_PRINTER_STORAGE_KEY)) || {};
    if (saved.power) customPrinterPowerInput.value = saved.power;
    if (saved.price) customPrinterPriceInput.value = saved.price;
  } catch (err) { /* sem problema */ }

  updatePrinterHint();
  syncMaterialUI(false); // na inicialização, só ajusta textos/visibilidade — não preenche o preço/kg
}

/** Atualiza a descrição (potência) exibida abaixo do select de impressora. */
function updatePrinterHint() {
  const isCustom = printerSelect.value === CUSTOM_PRINTER_ID;
  setExpanded(el("customPrinterWrap"), isCustom);

  if (isCustom) {
    printerHint.textContent = "Informe a potência logo abaixo.";
    return;
  }
  const printer = getSelectedPrinter();
  printerHint.textContent = printer ? printer.desc : "—";
}

function saveCustomPrinter() {
  try {
    localStorage.setItem(CUSTOM_PRINTER_STORAGE_KEY, JSON.stringify({
      power: customPrinterPowerInput.value.trim(),
      price: customPrinterPriceInput.value.trim(),
    }));
  } catch (err) { /* sem problema */ }
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

  // Nenhum material selecionado ainda (placeholder) — hint em branco, sem
  // mexer no campo "Preço do filamento".
  if (!material) {
    customWrap.hidden = true;
    materialHint.textContent = "";
    return;
  }

  const isCustom = material.id === "outro";

  customWrap.hidden = !isCustom;
  materialHint.textContent = "";

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

function showPrintTimeError() {
  printHoursInput.classList.add("invalid");
  printMinutesInput.classList.add("invalid");
  el("printTimeError").hidden = false;
}

function clearPrintTimeError() {
  printHoursInput.classList.remove("invalid");
  printMinutesInput.classList.remove("invalid");
  el("printTimeError").hidden = true;
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
// Horas pode ser 0 e minutos pode ser 0, cada um individualmente — a
// validação de que os dois juntos não podem ser 0 ao mesmo tempo é feita
// à parte, em validateAll (ver printTimeIsZero).
const printHoursTest = (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;
const printMinutesTest = (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 59;

/**
 * Passe { silent: true } pra checar a validade sem nenhum efeito visual
 * (sem destacar campos em vermelho, sem mostrar mensagem de erro) — usado
 * pela checagem automática de recálculo ao vivo (ver attemptAutoCalculate).
 * Em ambos os modos, atualiza formularioValidado com o resultado.
 */
function validateAll({ silent = false } = {}) {
  const isCustomMaterial = materialSelect.value === "outro";

  const rules = [
    { input: materialSelect, test: (v) => v !== "" },
    { input: printHoursInput, test: printHoursTest },
    { input: printMinutesInput, test: printMinutesTest },
    { input: printGramsInput, test: (v) => v !== "" && Number(v) > 0 },
    { input: pricePerKgInput, test: (v) => v !== "" && Number(v) > 0 },
    { input: kwhPriceInput, test: (v) => v !== "" && Number(v) > 0 },
  ];

  if (isCustomMaterial) {
    rules.push({ input: customNameInput, test: (v) => v.trim().length > 0 });
  }

  if (printerSelect.value === CUSTOM_PRINTER_ID) {
    rules.unshift({ input: customPrinterPowerInput, test: (v) => v !== "" && Number(v) > 0 });
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
      if (!silent) clearFieldError(input);
    } else {
      if (!silent) showFieldError(input);
      if (!firstInvalid) firstInvalid = input;
    }
  });

  // Tempo de impressão total: horas e minutos podem ser 0 cada um
  // individualmente, mas nunca os dois ao mesmo tempo. Só verifica isso
  // quando os dois campos já são individualmente válidos (senão "" viraria
  // 0 na comparação e disparar essa mensagem por engano).
  const printTimeIsZero = printHoursTest(printHoursInput.value) && printMinutesTest(printMinutesInput.value)
    && Number(printHoursInput.value) === 0 && Number(printMinutesInput.value) === 0;

  if (printTimeIsZero) {
    if (!silent) showPrintTimeError();
    if (!firstInvalid) firstInvalid = printHoursInput;
  } else {
    if (!silent) clearPrintTimeError();
  }

  // Margem de lucro: exatamente um dos dois campos (% ou valor fixo) precisa estar preenchido
  const pctVal = marginPctInput.value.trim();
  const fixedVal = marginFixedInput.value.trim();
  const marginValid = (pctVal !== "" && Number(pctVal) >= 0) || (fixedVal !== "" && Number(fixedVal) >= 0);

  if (marginValid) {
    if (!silent) clearMarginError();
  } else {
    if (!silent) showMarginError();
    if (!firstInvalid) firstInvalid = marginPctInput;
  }

  formularioValidado = !firstInvalid;
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
  const printer     = getSelectedPrinter();
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

  // 4) Custo material = filamento + energia.
  const baseCost = filamentCost + energyCost;

  // 5) Custos profissionais (só no modo Profissional): cada item com o switch
  //    ligado entra na soma — os informados em R$ somam direto, os informados
  //    em % incidem sobre o custo material (filamento + energia), cada um com
  //    sua própria lógica interna, inalterada. Separamos o total do GRUPO 1
  //    (desgaste, mão de obra, margem de falha, embalagem, materiais e
  //    insumos) porque só ele entra na base da margem de lucro — o GRUPO 2
  //    (taxa Shopee, taxa Mercado Livre, frete, impostos) é só repassado ao
  //    preço final, sem gerar lucro proporcional.
  const proCosts = [];
  let proCostsTotal = 0;
  let group1ProCostsTotal = 0;
  const hourlyRate = getEffectiveHourlyRate().rate;

  if (proMode) {
    PRO_COSTS.forEach((cost) => {
      const fieldId = proFieldId(cost);
      if (!el(`${fieldId}Toggle`).checked) return;
      const rawValue = parseFloat(el(fieldId).value) || 0;
      const value = cost.unit === "percent" ? baseCost * (rawValue / 100)
        : cost.unit === "laborMinutes" ? (hourlyRate / 60) * rawValue
        : rawValue;
      proCostsTotal += value;
      if (GROUP1_PRO_COST_IDS.includes(cost.id)) group1ProCostsTotal += value;
      // "Taxa Mercado Livre" também guarda o tipo de anúncio usado, pra
      // aparecer no texto do WhatsApp e no PDF (ver buildWhatsAppText /
      // buildAndSavePdf).
      const extra = cost.id === "meli" ? { adType: el("proMeliAdType").value } : {};
      proCosts.push({ ...cost, rawValue, value, hourlyRate, ...extra });
    });
  }

  // 6) Base da margem = custo material + custos profissionais do GRUPO 1.
  const marginBase = baseCost + group1ProCostsTotal;

  // 7) Custo total da peça = custo material + custos profissionais ativos
  //    (no modo Básico, proCostsTotal é sempre 0 — custo total = custo base,
  //    exatamente como antes desta versão)
  const totalCost = baseCost + proCostsTotal;

  // 8) Lucro: se o usuário informou um valor fixo, o lucro é esse valor direto.
  //    Caso contrário, o lucro é a porcentagem informada sobre a base da
  //    margem (custo material + GRUPO 1) — o GRUPO 2 nunca gera lucro.
  const usingFixedMargin = marginFixedInput.value.trim() !== "";
  const profit = usingFixedMargin
    ? parseFloat(marginFixedInput.value) || 0
    : marginBase * ((parseFloat(marginPctInput.value) || 0) / 100);

  // 9) Preço calculado (sem arredondar) = custo total (com profissionais) + lucro
  const calculatedPrice = totalCost + profit;

  // 10) Preço final = aplica arredondamento inteligente, se ativado
  const finalPrice = shouldRound ? smartRoundUp(calculatedPrice) : calculatedPrice;

  // 11) Diferença adicionada pelo arredondamento
  const roundingDiff = finalPrice - calculatedPrice;

  const selectedMaterial = MATERIALS.find((m) => m.id === materialSelect.value);
  const materialName = selectedMaterial.id === "outro"
    ? (customNameInput.value.trim() || "Outro (personalizado)")
    : selectedMaterial.name;

  const result = {
    jobName: jobNameInput.value.trim() || DEFAULT_JOB_NAME,
    hasCustomName: jobNameInput.value.trim() !== "",
    totalHours,
    printerName: printer.name,
    materialName,
    hours, minutes, grams,
    filamentCost, energyCost, energyKwh, baseCost, proCosts, proCostsTotal, totalCost,
    profit, calculatedPrice, finalPrice, roundingDiff,
    shouldRound, proMode,
    calculatedAt: new Date(),
  };

  lastResult = result;
  renderResult(result);

  // orçamento já salvo em "Meus orçamentos": mantém o salvo atualizado
  if (currentBudgetId && !restoringState) saveCurrentBudget({ silent: true });
}

// ---------------------------------------------------------
// RECÁLCULO AO VIVO — depois que o formulário estiver todo válido pela
// primeira vez (clique em "Calcular preço" ou aqui, silenciosamente), o
// resultado passa a se atualizar sozinho sempre que um campo relevante
// mudar, sem precisar clicar no botão de novo.
// ---------------------------------------------------------
let autoCalculateTimer = null;

/** Checa a validade em modo silencioso (sem destacar nada) e, se estiver
 *  tudo certo, chama calculate() de verdade — mesmo cálculo e mesma
 *  animação de sempre. Se não estiver tudo certo, não faz nada visível. */
function attemptAutoCalculate() {
  const firstInvalid = validateAll({ silent: true });
  if (!firstInvalid) {
    calculate();
  } else if (lastResult) {
    // um dado obrigatório ficou faltando/errado: tira o preço antigo da
    // tela em vez de mostrar um valor que não vale mais
    resetReadout();
    updateStickyBar();
  }
}

function scheduleAutoCalculate() {
  clearTimeout(autoCalculateTimer);
  autoCalculateTimer = setTimeout(attemptAutoCalculate, 400);
}

/** Liga o recálculo automático (debounced) aos mesmos campos que já
 *  alimentam o cálculo final: impressora, material, tempo, peso, preço do
 *  filamento, kWh, arredondamento, margem de lucro, e todos os campos e
 *  switches de custos profissionais (incluindo o campo escondido da Taxa
 *  Shopee/Mercado Livre, que já recebe um "input" sempre que a faixa
 *  escolhida, o tipo de anúncio ou os campos de "Personalizado" mudam). */
function bindAutoCalculate() {
  printerSelect.addEventListener("change", scheduleAutoCalculate);
  materialSelect.addEventListener("change", scheduleAutoCalculate);
  roundToggle.addEventListener("change", scheduleAutoCalculate);

  [printHoursInput, printMinutesInput, printGramsInput, pricePerKgInput, kwhPriceInput, marginPctInput, marginFixedInput]
    .forEach((input) => input.addEventListener("input", scheduleAutoCalculate));

  PRO_COSTS.forEach((cost) => {
    const fieldId = proFieldId(cost);
    el(fieldId).addEventListener("input", scheduleAutoCalculate);
    el(`${fieldId}Toggle`).addEventListener("change", scheduleAutoCalculate);
  });
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

  // Lucro por hora de impressora: quanto cada hora de máquina rende
  el("profitPerHour").textContent = r.totalHours > 0 ? brl(r.profit / r.totalHours) : "—";
  el("marginOnPrice").textContent = r.finalPrice > 0
    ? `lucro = ${Math.round((r.profit / r.finalPrice) * 100)}% do preço`
    : "";

  el("filamentGramsSub").textContent = `${r.grams.toLocaleString("pt-BR")} g`;
  el("energyKwhSub").textContent     = `${r.energyKwh.toFixed(2).replace(".", ",")} kWh`;
  el("printTimeSub").textContent     = formatPrintTime(r.hours, r.minutes);
  el("readoutJobName").textContent   = r.hasCustomName ? r.jobName : "Preço sugerido";

  el("roundingNote").textContent = r.shouldRound && r.roundingDiff > 0.001
    ? `Calculado: ${brl(r.calculatedPrice)} · arredondado (+${brl(r.roundingDiff)})`
    : "";

  renderPieChart(r);
  setReadoutLive(true);

  // pequena animação de destaque ao recalcular (elemento de assinatura)
  const valueEl = el("finalPrice");
  valueEl.classList.remove("pulse");
  void valueEl.offsetWidth; // força reflow para reiniciar a animação
  valueEl.classList.add("pulse");

  // habilita as ações assim que existir um resultado válido
  copyBtn.disabled = false;
  copyBtn.classList.remove("copied");
  copyBtnLabel.textContent = "Copiar";
  exportPdfBtn.disabled = false;
  el("saveBtn").disabled = false;
  el("saveBtnLabel").textContent = currentBudgetId ? "Salvo" : "Salvar";
  hidePdfExportError();

  const whatsappBtn = el("whatsappBtn");
  whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(r))}`;
  whatsappBtn.classList.remove("is-disabled");
  whatsappBtn.removeAttribute("aria-disabled");

  updateStickyBar();
}

/** "2h30", "0h45" — formato curto do tempo de impressão. */
function formatPrintTime(hours, minutes) {
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Liga/desliga o estado "ao vivo" do painel (preço calculado x aguardando dados). */
function setReadoutLive(live) {
  el("readoutPanel").classList.toggle("is-live", live);
  el("readoutStatus").textContent = live ? "Orçamento pronto" : "Aguardando dados";
  el("readoutEmpty").hidden = live;
  el("readoutBody").hidden = !live;
}

// ---------------------------------------------------------
// GRÁFICO DE PIZZA — breakdown visual dos custos (SVG puro, sem lib)
// Fatias: Filamento, Energia, cada custo profissional ativo individualmente
// (uma fatia por item, com nome e valor próprios) e Lucro.
// ---------------------------------------------------------
function buildPieSlices(r) {
  const slices = [
    { label: "Filamento", value: r.filamentCost, color: "var(--pie-filament)" },
    { label: "Energia", value: r.energyCost, color: "var(--pie-energy)" },
  ];

  if (r.proMode) {
    r.proCosts.forEach((cost) => {
      slices.push({ label: cost.label, value: cost.value, color: PRO_COST_PIE_COLORS[cost.id] });
    });
  }

  slices.push({ label: "Lucro", value: r.profit, color: "var(--pie-profit)" });

  return slices.filter((s) => s.value > 0);
}

/** Composição do preço: barra empilhada (proporcional) + lista com valor e %
 *  de cada parte — mais fácil de ler no celular que uma pizza pequena. */
function renderPieChart(r) {
  const slices = buildPieSlices(r);
  const wrap = el("readoutPie");
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (!slices.length || total <= 0) {
    wrap.hidden = true;
    return;
  }

  el("pieChart").innerHTML = slices.map((s) =>
    `<span class="breakdown-seg" style="flex-grow:${s.value};background:${s.color}" title="${s.label}"></span>`
  ).join("");

  el("pieLegend").innerHTML = slices.map((s) => `
    <div class="breakdown-row">
      <span class="breakdown-dot" style="background:${s.color}"></span>
      <span class="breakdown-label">${s.label}</span>
      <span class="breakdown-pct">${Math.round((s.value / total) * 100)}%</span>
      <span class="breakdown-value">${brl(s.value)}</span>
    </div>
  `).join("");

  wrap.hidden = false;
}

// ---------------------------------------------------------
// EXPORTAÇÃO — NOME DE ARQUIVO
// ---------------------------------------------------------

/** Normaliza um texto pra usar num nome de arquivo (sem acento, espaço vira hífen). */
function slugify(text) {
  const slug = (text || "")
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "orcamento";
}

function exportFileBaseName(r) {
  const dateSlug = r.calculatedAt.toISOString().slice(0, 10); // AAAA-MM-DD
  return `orcamento-${slugify(r.jobName)}-${dateSlug}`;
}

// ---------------------------------------------------------
// EXPORTAR PDF ESTILIZADO
// Carrega o jsPDF via CDN só na hora do primeiro clique (lazy), pra não
// pesar o carregamento inicial nem depender de internet pro app funcionar
// offline — a exportação em PDF é a única parte que precisa de conexão.
// ---------------------------------------------------------
const JSPDF_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js";
let jsPDFLoadPromise = null;

function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPDFLoadPromise) return jsPDFLoadPromise;

  jsPDFLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSPDF_CDN_URL;
    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
      else reject(new Error("jsPDF carregado, mas indisponível."));
    };
    script.onerror = () => reject(new Error("Falha ao carregar jsPDF."));
    document.head.appendChild(script);
  }).catch((err) => {
    jsPDFLoadPromise = null; // permite tentar de novo (ex.: internet voltou)
    throw err;
  });

  return jsPDFLoadPromise;
}

/** Carrega uma imagem local (ex.: logo) e devolve como dataURL, pro jsPDF poder desenhá-la. */
function loadImageAsDataURL(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem."));
    img.src = src;
  });
}

function showPdfExportError() {
  el("pdfExportError").hidden = false;
}

function hidePdfExportError() {
  el("pdfExportError").hidden = true;
}

/** Monta o PDF estilizado com a identidade visual do projeto e dispara o download. */
async function buildAndSavePdf(JsPDF, r) {
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  let y;

  // Faixa escura no topo com o logo, nas cores da marca (dourado sobre preto)
  doc.setFillColor(14, 11, 7);
  doc.rect(0, 0, pageWidth, 30, "F");

  try {
    const logoDataUrl = await loadImageAsDataURL("assets/logo.png");
    doc.addImage(logoDataUrl, "PNG", marginX, 7, 16, 16);
  } catch (err) {
    // Sem problema seguir sem o logo — não impede a geração do PDF
  }

  doc.setTextColor(232, 200, 115);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Nosso Projeto 3D", marginX + 20, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Orçamento de impressão 3D", marginX + 20, 21);

  y = 42;
  doc.setTextColor(20, 20, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(r.jobName, marginX, y, { maxWidth: pageWidth - marginX * 2 });

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 122);
  const dateLabel = r.calculatedAt.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  doc.text(`Gerado em ${dateLabel}`, marginX, y);

  y += 10;

  const drawSectionTitle = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(138, 106, 18);
    doc.text(title.toUpperCase(), marginX, y);
    y += 1.5;
    doc.setDrawColor(230, 220, 200);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
  };

  const drawRow = (label, value) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(80, 80, 92);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 27);
    doc.text(String(value), pageWidth - marginX, y, { align: "right" });
    y += 6.5;
  };

  drawSectionTitle("Impressora e material");
  drawRow("Impressora", r.printerName);
  drawRow("Material", r.materialName);
  y += 4;

  drawSectionTitle("Tempo e peso");
  drawRow("Tempo de impressão", `${r.hours}h ${String(r.minutes).padStart(2, "0")}min`);
  drawRow("Peso do filamento", `${r.grams} g`);
  y += 4;

  drawSectionTitle("Breakdown de custos");
  drawRow("Filamento", brl(r.filamentCost));
  drawRow("Energia", brl(r.energyCost));
  if (r.proMode) {
    r.proCosts.forEach((c) => {
      const label = c.id === "meli" ? `${c.label} (${c.adType === "classico" ? "Clássico" : "Premium"})` : c.label;
      drawRow(label, brl(c.value));
    });
  }
  drawRow("Custo total", brl(r.totalCost));
  drawRow("Lucro", brl(r.profit));
  y += 4;

  // Preço final em destaque, num cartão colorido
  doc.setFillColor(248, 240, 220);
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 20, 3, 3, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(110, 110, 122);
  doc.text("Preço final sugerido", marginX + 6, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(138, 106, 18);
  doc.text(brl(r.finalPrice), marginX + 6, y + 16);

  y += 30;

  // Assinatura da loja (nome/cidade/WhatsApp/Instagram) — só entra o que
  // estiver configurado nas Configurações da loja, igual no WhatsApp.
  const signature = buildStoreSignatureLine(loadStoreSettings()).replace(/^🏪\s*/, "");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(140, 140, 150);
  if (signature) {
    doc.text(signature, marginX, y);
    y += 6;
  }
  doc.text("Orçamento gerado com a calculadora Nosso Projeto 3D — gratuita, feita para a comunidade 3D.", marginX, y, { maxWidth: pageWidth - marginX * 2 });

  doc.save(`${exportFileBaseName(r)}.pdf`);
}

async function exportPdf() {
  if (!lastResult) return;

  hidePdfExportError();
  exportPdfBtn.disabled = true;
  exportPdfBtnLabel.textContent = "Gerando...";

  try {
    const JsPDF = await loadJsPDF();
    await buildAndSavePdf(JsPDF, lastResult);
    saveCurrentBudget({ silent: true });
  } catch (err) {
    showPdfExportError();
  } finally {
    exportPdfBtnLabel.textContent = "PDF";
    exportPdfBtn.disabled = false;
  }
}

// ---------------------------------------------------------
// LIMPAR TUDO — volta a página ao estado inicial, 100% vazio
// ---------------------------------------------------------
function clearAll() {
  jobNameInput.value = "";
  printerSelect.selectedIndex = 0;
  currentBudgetId = null;
  materialSelect.value = "";
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
  // Volta o tipo de anúncio da Taxa Mercado Livre pro padrão (Premium).
  el("proMeliAdType").value = "premium";

  // Taxa Shopee e Taxa Mercado Livre: esquecem a faixa escolhida (a próxima
  // vez que o switch for ligado volta a sugerir automaticamente) e limpam os
  // campos de "Personalizado".
  shopeeSelectedTier = null;
  el("proShopeeCustomPct").value = "";
  el("proShopeeCustomFixed").value = "";
  setExpanded(el("proShopeeCustomFields"), false);
  renderShopeeTierOptions();

  meliSelectedTier = null;
  el("proMeliCustomPct").value = "";
  el("proMeliCustomFixed").value = "";
  setExpanded(el("proMeliCustomFields"), false);
  renderMeliTierOptions();

  [jobNameInput, printHoursInput, printMinutesInput, printGramsInput,
   pricePerKgInput, customNameInput, kwhPriceInput]
    .forEach(clearFieldError);

  // Reaplica as preferências da loja (kWh, margem, margem de falha,
  // desgaste/hora e arredondamento) sobre os campos agora vazios —
  // "Limpar tudo" começa um orçamento novo, não desliga os padrões salvos.
  applyStoreSettingsToCalculator(loadStoreSettings());

  resetReadout();

  // Formulário volta a ficar incompleto — o recálculo automático ao vivo só
  // liga de novo depois de validar tudo uma próxima vez.
  clearTimeout(autoCalculateTimer);
  formularioValidado = false;

  clearDraft();
  updateStickyBar();
  el("calcForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Volta o painel de resultado ao estado inicial ("aguardando dados"). */
function resetReadout() {
  el("finalPrice").textContent   = "R$ 0,00";
  el("totalCost").textContent    = "R$ 0,00";
  el("profitValue").textContent  = "R$ 0,00";
  el("profitPerHour").textContent = "R$ 0,00";
  el("filamentCost").textContent = "R$ 0,00";
  el("energyCost").textContent   = "R$ 0,00";
  el("readoutJobName").textContent = "Preço sugerido";
  el("roundingNote").textContent = "";

  el("readoutPie").hidden = true;
  el("pieChart").innerHTML = "";
  el("pieLegend").innerHTML = "";
  setReadoutLive(false);

  lastResult = null;
  copyBtn.disabled = true;
  copyBtn.classList.remove("copied");
  copyBtnLabel.textContent = "Copiar";
  exportPdfBtn.disabled = true;
  el("saveBtn").disabled = true;
  el("saveBtnLabel").textContent = "Salvar";
  hidePdfExportError();

  const whatsappBtn = el("whatsappBtn");
  whatsappBtn.href = "#";
  whatsappBtn.classList.add("is-disabled");
  whatsappBtn.setAttribute("aria-disabled", "true");
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
  copyBtnLabel.textContent = "Copiado!";
  saveCurrentBudget({ silent: true });
  setTimeout(() => {
    copyBtn.classList.remove("copied");
    copyBtnLabel.textContent = "Copiar";
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

  // barra do navegador/sistema acompanha o fundo do tema
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute("content", theme === "light" ? "#F6F1E7" : "#0E0B07");
}

// ---------------------------------------------------------
// EVENTOS
// ---------------------------------------------------------
function bindEvents() {
  printerSelect.addEventListener("change", updatePrinterHint);

  materialSelect.addEventListener("change", () => syncMaterialUI(true));
  materialSelect.addEventListener("change", () => clearFieldError(materialSelect));

  customNameInput.addEventListener("input", () => clearFieldError(customNameInput));

  roundToggle.addEventListener("change", () => {
    el("roundToggleText").textContent = roundToggle.checked
      ? "Arredondar para .99 acima"
      : "Sem arredondamento";
  });

  el("calcBtn").addEventListener("click", () => {
    calculate();
    if (!lastResult || !formularioValidado) return;

    revealReadout();
    // popup de apoio só no clique explícito (nunca no recálculo ao vivo,
    // pra não interromper quem está digitando) e só se deu um preço
    showFreeBanner();
  });
  el("exampleBtn").addEventListener("click", fillExample);
  el("clearBtn").addEventListener("click", clearAll);
  copyBtn.addEventListener("click", copyBudget);
  exportPdfBtn.addEventListener("click", exportPdf);

  // Limpa o erro do campo assim que o usuário começar a corrigi-lo
  [jobNameInput, printHoursInput, printMinutesInput, printGramsInput,
   pricePerKgInput, kwhPriceInput].forEach((input) => {
    input.addEventListener("input", () => clearFieldError(input));
  });

  [printHoursInput, printMinutesInput].forEach((input) => {
    input.addEventListener("input", clearPrintTimeError);
  });

  enforceIntegerInput(printHoursInput);
  enforceIntegerInput(printMinutesInput, 59);

  bindMarginExclusivity();
  bindMarginChips();
  bindCustomPrinter();
  bindProCostEvents();
  bindAutoWearRecalc();
  bindLaborHintRecalc();
  bindAutoShopeeRecalc();
  bindAutoMeliRecalc();
  bindAutoCalculate();
}


// ---------------------------------------------------------
// MARGEM DE LUCRO — ATALHOS (30% / 50% / 100% / 150% / 200%)
// ---------------------------------------------------------
function syncMarginChips() {
  const pct = marginPctInput.value.trim();
  el("marginChips").querySelectorAll(".chip-btn").forEach((btn) => {
    btn.classList.toggle("active", pct !== "" && btn.dataset.value === pct);
  });
}

function bindMarginChips() {
  el("marginChips").querySelectorAll(".chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // escolher um atalho troca o "valor fixo" pela margem em %
      if (marginFixedInput.value.trim() !== "") {
        marginFixedInput.value = "";
        marginFixedInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      marginPctInput.value = btn.dataset.value;
      marginPctInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  [marginPctInput, marginFixedInput].forEach((input) => input.addEventListener("input", syncMarginChips));
  syncMarginChips();
}

// ---------------------------------------------------------
// "OUTRA IMPRESSORA" — potência/preço digitados alimentam as mesmas contas
// ---------------------------------------------------------
function bindCustomPrinter() {
  [customPrinterPowerInput, customPrinterPriceInput].forEach((input) => {
    input.addEventListener("input", () => {
      clearFieldError(customPrinterPowerInput);
      saveCustomPrinter();
      recalcAutoWear();
      recalcAutoShopee();
      recalcAutoMeli();
      scheduleAutoCalculate();
    });
  });
}

// ---------------------------------------------------------
// ESTADO DO FORMULÁRIO — captura/restaura tudo o que foi preenchido.
// Base de "Meus orçamentos" (reabrir um orçamento salvo) e do rascunho
// automático (nada se perde ao fechar/recarregar a página).
// ---------------------------------------------------------
function captureFormState() {
  const values = {};
  el("calcForm").querySelectorAll("input[id], select[id]").forEach((input) => {
    // Taxa Shopee/Mercado Livre são sempre recalculadas a partir da faixa
    if (input.id === "proShopee" || input.id === "proMeli") return;
    values[input.id] = input.type === "checkbox" ? input.checked : input.value;
  });
  return { mode: currentMode, values, shopeeTier: shopeeSelectedTier, meliTier: meliSelectedTier };
}

let restoringState = false;

function restoreFormState(state) {
  if (!state || !state.values) return;
  restoringState = true;

  const v = state.values;
  const has = (id) => Object.prototype.hasOwnProperty.call(v, id);
  const fire = (input) => input.dispatchEvent(new Event(
    input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  const apply = (id) => {
    const input = el(id);
    if (!input || !has(id)) return;
    if (input.type === "checkbox") input.checked = !!v[id];
    else input.value = v[id];
    fire(input);
  };

  if (state.mode) setMode(state.mode);

  // 1) impressora (e potência da "Outra") e material — disparam os
  //    preenchimentos automáticos, que os valores salvos sobrescrevem depois
  apply("customPrinterPower");
  apply("customPrinterPrice");
  apply("printerSelect");
  apply("materialSelect");

  // 2) switches dos custos profissionais (abrem/fecham cada campo)
  const proToggleIds = PRO_COSTS.map((cost) => `${proFieldId(cost)}Toggle`);
  proToggleIds.forEach((id) => {
    if (has(id) && el(id).checked !== !!v[id]) apply(id);
  });

  // 3) todos os outros campos, na ordem do formulário
  const handled = new Set(["customPrinterPower", "customPrinterPrice", "printerSelect", "materialSelect", ...proToggleIds]);
  Object.keys(v).forEach((id) => { if (!handled.has(id)) apply(id); });

  // 4) valores dos custos profissionais de novo — o recálculo automático de
  //    "Desgaste" (ao mudar impressora/tempo) pode ter sobrescrito o salvo
  PRO_COSTS.forEach((cost) => {
    if (cost.id === "shopee" || cost.id === "meli") return;
    apply(proFieldId(cost));
  });

  // 5) faixas escolhidas da Taxa Shopee / Mercado Livre
  shopeeSelectedTier = state.shopeeTier ?? null;
  meliSelectedTier = state.meliTier ?? null;
  setExpanded(el("proShopeeCustomFields"), shopeeSelectedTier === "custom");
  setExpanded(el("proMeliCustomFields"), meliSelectedTier === "custom");
  recalcAutoShopee();
  recalcAutoMeli();

  syncMarginChips();

  // recalcula ainda com restoringState=true: assim o orçamento que estava
  // aberto antes não é sobrescrito pelo estado recém-restaurado
  clearTimeout(autoCalculateTimer);
  if (!validateAll({ silent: true })) calculate();
  else { resetReadout(); updateStickyBar(); }
  clearTimeout(autoCalculateTimer);
  restoringState = false;
}

// ---------------------------------------------------------
// RASCUNHO AUTOMÁTICO — o formulário sobrevive a fechar/recarregar a página
// ---------------------------------------------------------
const DRAFT_KEY = "np3d_draft";
let draftTimer = null;

function saveDraft() {
  if (restoringState) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ state: captureFormState(), budgetId: currentBudgetId }));
    } catch (err) { /* sem problema */ }
  }, 500);
}

function clearDraft() {
  clearTimeout(draftTimer);
  try { localStorage.removeItem(DRAFT_KEY); } catch (err) { /* sem problema */ }
}

function restoreDraft() {
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (err) { draft = null; }
  if (!draft || !draft.state) return;

  restoreFormState(draft.state);
  if (draft.budgetId && loadHistory().some((b) => b.id === draft.budgetId)) {
    currentBudgetId = draft.budgetId;
    if (lastResult) el("saveBtnLabel").textContent = "Salvo";
  }
}

function bindDraftAutosave() {
  const form = el("calcForm");
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);
  // chips e faixas de marketplace são botões — também contam como edição
  form.addEventListener("click", (event) => {
    if (event.target.closest(".chip-btn, .tier-option, .mode-switch-btn")) saveDraft();
  });
}

// ---------------------------------------------------------
// MEUS ORÇAMENTOS — histórico salvo no aparelho (localStorage)
// ---------------------------------------------------------
const HISTORY_KEY = "np3d_history";
const HISTORY_LIMIT = 60;

function loadHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

function storeHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
  } catch (err) { /* armazenamento cheio/bloqueado — segue sem histórico */ }
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const count = loadHistory().length;
  const badge = el("historyCount");
  badge.textContent = count > 99 ? "99+" : String(count);
  badge.hidden = count === 0;
}

/** Salva (ou atualiza, se já salvo) o orçamento atual em "Meus orçamentos". */
function saveCurrentBudget({ silent = false } = {}) {
  if (!lastResult) return;
  const r = lastResult;
  const isNew = !currentBudgetId;
  const entry = {
    id: currentBudgetId || `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    savedAt: Date.now(),
    name: r.jobName,
    price: r.finalPrice,
    printerName: r.printerName,
    materialName: r.materialName,
    time: formatPrintTime(r.hours, r.minutes),
    grams: r.grams,
    proMode: r.proMode,
    state: captureFormState(),
  };

  const list = loadHistory();
  const index = list.findIndex((b) => b.id === entry.id);
  if (index >= 0) list[index] = entry;
  else list.unshift(entry);
  storeHistory(list);

  currentBudgetId = entry.id;
  el("saveBtnLabel").textContent = "Salvo";
  saveDraft();
  if (!silent) showQuickToast(isNew ? "Salvo em Meus orçamentos." : "Orçamento atualizado.");
}

function formatSavedDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? `hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (ch) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function renderHistory() {
  const list = loadHistory();
  const query = el("historySearch").value.trim().toLowerCase();
  el("historySearchWrap").hidden = list.length < 5;

  const items = query
    ? list.filter((b) => [b.name, b.materialName, b.printerName].join(" ").toLowerCase().includes(query))
    : list;

  const listEl = el("historyList");
  if (!list.length) {
    listEl.innerHTML = `
      <div class="history-empty">
        <strong>Nenhum orçamento salvo ainda</strong>
        Depois de calcular, toque em <em>Salvar</em> — ou envie pelo WhatsApp,
        copie ou gere o PDF, que ele é salvo sozinho aqui.
      </div>`;
    return;
  }
  if (!items.length) {
    listEl.innerHTML = `<div class="history-empty">Nada encontrado pra “${escapeHtml(query)}”.</div>`;
    return;
  }

  listEl.innerHTML = items.map((b) => `
    <div class="history-item${b.id === currentBudgetId ? " is-current" : ""}">
      <button type="button" class="history-open" data-id="${b.id}">
        <span class="history-text">
          <span class="history-name">${escapeHtml(b.name)}</span>
          <span class="history-meta">${escapeHtml(b.materialName)} · ${escapeHtml(b.time)} · ${Number(b.grams).toLocaleString("pt-BR")} g · ${formatSavedDate(b.savedAt)}</span>
        </span>
        <span class="history-price">${brl(Number(b.price) || 0)}</span>
      </button>
      <button type="button" class="history-delete" data-id="${b.id}" aria-label="Excluir ${escapeHtml(b.name)}">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `).join("");
}

function openHistory() {
  el("historySearch").value = "";
  renderHistory();
  el("historyModalOverlay").hidden = false;
}

function closeHistory() {
  el("historyModalOverlay").hidden = true;
}

function openSavedBudget(id) {
  const entry = loadHistory().find((b) => b.id === id);
  if (!entry) return;
  restoreFormState(entry.state);
  currentBudgetId = entry.id;
  if (lastResult) el("saveBtnLabel").textContent = "Salvo";
  saveDraft();
  closeHistory();
  showQuickToast(`“${entry.name}” aberto — edite à vontade.`);
  el("calcForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteSavedBudget(id) {
  const list = loadHistory();
  const entry = list.find((b) => b.id === id);
  if (!entry) return;
  if (!window.confirm(`Excluir “${entry.name}” dos seus orçamentos?`)) return;

  storeHistory(list.filter((b) => b.id !== id));
  if (currentBudgetId === id) {
    currentBudgetId = null;
    if (lastResult) el("saveBtnLabel").textContent = "Salvar";
    saveDraft();
  }
  renderHistory();
}

function initHistory() {
  el("historyBtn").addEventListener("click", openHistory);
  el("closeHistoryBtn").addEventListener("click", closeHistory);
  el("historySearch").addEventListener("input", renderHistory);

  el("historyList").addEventListener("click", (event) => {
    const openBtn = event.target.closest(".history-open");
    const deleteBtn = event.target.closest(".history-delete");
    if (openBtn) openSavedBudget(openBtn.dataset.id);
    else if (deleteBtn) deleteSavedBudget(deleteBtn.dataset.id);
  });

  const overlay = el("historyModalOverlay");
  overlay.addEventListener("click", (event) => { if (event.target === overlay) closeHistory(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeHistory();
  });

  el("saveBtn").addEventListener("click", () => saveCurrentBudget());
  el("whatsappBtn").addEventListener("click", () => saveCurrentBudget({ silent: true }));

  updateHistoryBadge();
}

// ---------------------------------------------------------
// EXEMPLO PREENCHIDO — mostra a calculadora funcionando em 1 toque
// ---------------------------------------------------------
function fillExample() {
  const keepPrinter = printerSelect.value && (printerSelect.value !== CUSTOM_PRINTER_ID || getSelectedPrinter());
  currentBudgetId = null;
  restoreFormState({
    mode: currentMode,
    values: {
      printerSelect: keepPrinter ? printerSelect.value : "a1-combo",
      materialSelect: "pla-basic",
      pricePerKg: "109.90",
      kwhPrice: kwhPriceInput.value.trim() || "0.85",
      jobName: "Suporte de celular",
      printHours: "2",
      printMinutes: "30",
      printGrams: "45",
      marginPct: marginPctInput.value.trim() || (marginFixedInput.value.trim() ? "" : "100"),
      roundToggle: roundToggle.checked,
    },
    shopeeTier: shopeeSelectedTier,
    meliTier: meliSelectedTier,
  });
  saveDraft();
  showQuickToast("Exemplo preenchido — troque pelos dados da sua peça.");
  if (lastResult) revealReadout();
}

/** No celular o resultado fica abaixo do formulário — leva a pessoa até ele.
 *  No computador ele já está fixo ao lado, então não rola nada. */
function revealReadout() {
  const rect = el("readoutPanel").getBoundingClientRect();
  if (rect.top > window.innerHeight * 0.6 || rect.bottom < 0) {
    el("readoutPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ---------------------------------------------------------
// PROGRESSO + BARRA FIXA DO CELULAR
// Mostra o que falta preencher e, quando há resultado, o preço ao vivo.
// ---------------------------------------------------------
function getProgressItems() {
  const pctVal = marginPctInput.value.trim();
  const fixedVal = marginFixedInput.value.trim();
  const timeOk = printHoursTest(printHoursInput.value) && printMinutesTest(printMinutesInput.value)
    && !(Number(printHoursInput.value) === 0 && Number(printMinutesInput.value) === 0);
  const materialOk = materialSelect.value !== ""
    && (materialSelect.value !== "outro" || customNameInput.value.trim() !== "");

  return [
    { label: "Impressora", done: !!getSelectedPrinter() },
    { label: "Energia", done: Number(kwhPriceInput.value) > 0 },
    { label: "Material", done: materialOk },
    { label: "Preço do filamento", done: Number(pricePerKgInput.value) > 0 },
    { label: "Tempo", done: timeOk },
    { label: "Peso", done: Number(printGramsInput.value) > 0 },
    { label: "Margem", done: (pctVal !== "" && Number(pctVal) >= 0) || (fixedVal !== "" && Number(fixedVal) >= 0) },
    // custos profissionais ligados também precisam de valor
    ...(isProMode() ? PRO_COSTS.filter((cost) => el(`${proFieldId(cost)}Toggle`).checked).map((cost) => ({
      label: cost.label,
      done: Number(el(proFieldId(cost)).value) > 0,
    })) : []),
  ];
}

function updateStickyBar() {
  const items = getProgressItems();
  const missing = items.filter((item) => !item.done);

  el("missingList").innerHTML = items.map((item) =>
    `<li class="${item.done ? "done" : ""}">${item.label}</li>`).join("");

  const bar = el("stickyBar");
  const live = !!lastResult;
  bar.classList.toggle("is-live", live);

  if (live) {
    el("stickyLabel").textContent = lastResult.hasCustomName ? lastResult.jobName : "Preço sugerido";
    el("stickyValue").textContent = brl(lastResult.finalPrice);
    el("stickyBtn").textContent = "Ver orçamento";
  } else {
    el("stickyLabel").textContent = missing.length ? `Faltam ${missing.length} de ${items.length}` : "Tudo preenchido";
    el("stickyValue").textContent = missing.length
      ? `${missing.slice(0, 2).map((i) => i.label).join(", ")}${missing.length > 2 ? "…" : ""}`
      : "Pronto pra calcular";
    el("stickyBtn").textContent = "Calcular";
  }
}

function syncStickyHeight() {
  const bar = el("stickyBar");
  const visible = getComputedStyle(bar).display !== "none";
  document.documentElement.style.setProperty("--sticky-h", visible ? `${bar.offsetHeight}px` : "0px");
}

function initStickyBar() {
  const bar = el("stickyBar");
  let readoutVisible = false;
  let typing = false;
  const refresh = () => bar.classList.toggle("is-hidden", readoutVisible || typing);

  el("stickyBtn").addEventListener("click", () => {
    if (lastResult) el("readoutPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    else el("calcBtn").click();
  });

  // some quando o painel de resultado já está na tela
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      readoutVisible = entries[0].isIntersecting;
      refresh();
    }, { threshold: 0.25 }).observe(el("readoutPanel"));
  }

  // no celular, some enquanto o teclado está aberto (campo focado)
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const form = el("calcForm");
  form.addEventListener("focusin", (event) => {
    if (coarse && event.target.matches("input:not([type=checkbox]), select")) { typing = true; refresh(); }
  });
  form.addEventListener("focusout", () => {
    setTimeout(() => {
      typing = coarse && document.activeElement && form.contains(document.activeElement)
        && document.activeElement.matches("input:not([type=checkbox]), select");
      refresh();
    }, 60);
  });

  form.addEventListener("input", updateStickyBar);
  form.addEventListener("change", updateStickyBar);

  syncStickyHeight();
  window.addEventListener("resize", syncStickyHeight);
  updateStickyBar();
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
// POPUP "PROJETO GRATUITO" — aparece logo depois do primeiro
// "Calcular preço" (e não ao abrir a página, pra primeira tela ficar
// limpa), no máximo 1x por semana: a data em que foi mostrado fica no
// localStorage e ele só volta depois de FREE_POPUP_INTERVAL_MS.
// ---------------------------------------------------------
const FREE_POPUP_KEY = "np3d_free_popup_last_shown";
const FREE_POPUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
let freeBannerScheduled = false;

function closeFreeBanner() {
  el("freeBanner").hidden = true;
}

function initFreeBanner() {
  const overlay = el("freeBanner");
  el("closeFreeBanner").addEventListener("click", closeFreeBanner);
  el("freePopupLater").addEventListener("click", closeFreeBanner);
  // o link abre o Instagram em outra aba; aqui só tira o popup do caminho
  el("freePopupFollow").addEventListener("click", closeFreeBanner);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeFreeBanner();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeFreeBanner();
  });
}

function showFreeBanner() {
  if (freeBannerScheduled) return;
  freeBannerScheduled = true;

  const lastShown = Number(localStorage.getItem(FREE_POPUP_KEY)) || 0;
  if (Date.now() - lastShown < FREE_POPUP_INTERVAL_MS) return;

  // pequeno atraso pra pessoa ver o preço antes do aviso surgir
  setTimeout(() => {
    el("freeBanner").hidden = false;
    // conta a partir de quando apareceu — mesmo sem fechar (ex.: recarregou
    // a página), só volta daqui a uma semana
    localStorage.setItem(FREE_POPUP_KEY, String(Date.now()));
  }, 1500);
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
  initHistory();
  restoreDraft();
  bindDraftAutosave();
  initStickyBar();
  if (!lastResult) setReadoutLive(false);
});
