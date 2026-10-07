/* =========================================================
   CALCULADORA 3D — V4
   Celular primeiro: formulário em seções, preço ao vivo numa barra fixa
   embaixo e o orçamento completo logo depois do formulário. No computador,
   duas colunas com o orçamento fixo ao lado.
   ========================================================= */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import {
  ArrowRight, ArrowUpRight, Briefcase, ClockCounterClockwise, Cylinder, DownloadSimple, GearSix, InstagramLogo,
  CaretDown, Play, Printer, Timer, TrendUp, UserCircle, X,
} from "@phosphor-icons/react";
import { CUSTOM_PRINTER_ID } from "./lib/data";
import { brl } from "./lib/calc";
import { KEYS, read, track, write } from "./lib/storage";
import { useCalculator } from "./lib/useCalculator";
import { InputField, Section, Switch, useIsDesktop } from "./components/ui";
import { MaterialPicker, PrinterPicker } from "./components/Pickers";
import { ProCosts } from "./components/ProCosts";
import { ResultPanel } from "./components/ResultPanel";
import { HistorySheet } from "./components/HistorySheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { IosInstallDialog, QuickToast, SupportDialog } from "./components/Overlays";

export type Theme = "system" | "light" | "dark";

const ERRORS: Record<string, string> = {
  customPrinterPower: "Informe a potência da impressora, em watts.",
  kwhPrice: "Informe o valor do kWh da sua energia.",
  materialSelect: "Selecione um material.",
  pricePerKg: "Informe o preço do filamento por kg.",
  customMaterialName: "Informe o nome do material.",
  printHours: "Informe as horas (pode ser 0).",
  printMinutes: "Minutos entre 0 e 59.",
  printTime: "O tempo não pode ser zero. Preencha horas, minutos ou os dois.",
  printGrams: "Informe o peso do filamento usado.",
  margin: "Escolha uma margem de lucro, em % ou valor fixo.",
};

const MARGIN_SHORTCUTS = [0, 50, 100, 150, 200];
const FREE_POPUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------
// TEMA (Sistema / Claro / Escuro)
// ---------------------------------------------------------
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = read(KEYS.theme);
    return saved === "light" || saved === "dark" ? saved : "system";
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const resolved = theme === "system" ? (mq.matches ? "light" : "dark") : theme;
      document.documentElement.setAttribute("data-theme", resolved);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "light" ? "#F3F4F6" : "#0C0E11");
    };
    apply();
    if (theme === "system") {
      try { localStorage.removeItem(KEYS.theme); } catch { /* sem problema */ }
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    write(KEYS.theme, theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

// ---------------------------------------------------------
// INSTALAR COMO APP (Chrome/Android pelo prompt; iPhone com instruções)
// ---------------------------------------------------------
interface BeforeInstallPromptEvent extends Event { prompt: () => void; userChoice: Promise<unknown> }

function useInstall() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosOpen, setIosOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = !standalone && !installed && (isIOS || !!prompt);
  const install = async () => {
    if (isIOS) { setIosOpen(true); return; }
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };
  return { canInstall, install, iosOpen, setIosOpen };
}

export default function App() {
  const calc = useCalculator();
  const { state, result, settings, set } = calc;
  const v = state.values;
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const [theme, setTheme] = useTheme();
  const install = useInstall();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => read(KEYS.installDismissed) === "1");
  const supportScheduled = useRef(false);

  const err = (id: string) => (state.errors.includes(id) ? ERRORS[id] ?? null : null);
  const str = (id: string) => String(v[id] ?? "");

  /** Leva até um campo (com foco), descontando o cabeçalho fixo. */
  const jumpTo = useCallback((id: string) => {
    const target = document.getElementById(id === "printTime" ? "printHours" : id === "margin" ? "marginPct" : id);
    if (!target) return;
    const block = target.closest("[data-field]") || target;
    // foco antes da rolagem: no Safari, focar depois cancela a rolagem suave
    if (!(target instanceof HTMLInputElement && target.disabled)) (target as HTMLElement).focus?.({ preventScroll: true });
    requestAnimationFrame(() => block.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }));
    // garantia: o Safari às vezes descarta a rolagem suave quando a tela muda de
    // tamanho logo em seguida (as mensagens de erro aparecem nessa hora)
    setTimeout(() => {
      const r = block.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) block.scrollIntoView({ behavior: "auto", block: "center" });
    }, 600);
  }, [reduce]);

  const revealResult = useCallback(() => {
    const panel = document.getElementById("orcamento");
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.6 || rect.bottom < 0) {
      panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }, [reduce]);

  const onCalculate = () => {
    const first = calc.submit();
    if (first) { jumpTo(first); return; }
    revealResult();
    // popup de apoio: só no clique explícito, no máximo 1x por semana
    if (supportScheduled.current) return;
    supportScheduled.current = true;
    const last = Number(read(KEYS.freePopup)) || 0;
    if (Date.now() - last < FREE_POPUP_INTERVAL_MS) return;
    setTimeout(() => {
      setSupportOpen(true);
      write(KEYS.freePopup, String(Date.now()));
    }, 1500);
  };

  const onClear = () => {
    calc.clearAll();
    document.getElementById("calculadora")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const onExample = () => {
    calc.fillExample();
    setTimeout(revealResult, 60);
  };

  // Instagram do rodapé: o da loja configurada, ou o do projeto
  const instagramHandle = (settings.instagram || "").trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "") || "nossoprojeto3d";

  const pctFilled = str("marginPct").trim() !== "";
  const fixedFilled = str("marginFixed").trim() !== "";
  const isPro = state.mode === "profissional";

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="grain" aria-hidden="true" />

      {/* ===================== CABEÇALHO ===================== */}
      <header className="sticky top-0 border-b border-line/60"
        style={{
          zIndex: "var(--z-header)", background: "color-mix(in oklab, var(--bg) 97%, transparent)", paddingTop: "env(safe-area-inset-top)",
          backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)",
        }}>
        <div className="mx-auto flex h-[60px] max-w-[1180px] items-center gap-2 px-4 sm:px-6">
          <a href="./" className="flex min-w-0 flex-1 items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="" width={30} height={36} className="brand-logo h-9 w-auto" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">Nosso Projeto 3D</span>
              <span className="text-[12.5px] text-ink-3">Calculadora de impressão 3D</span>
            </span>
          </a>
          {install.canInstall && desktop && (
            <button type="button" className="btn btn-secondary min-h-[40px] gap-2 px-4 text-[14px]" onClick={install.install}>
              <DownloadSimple size={17} aria-hidden="true" />Instalar app
            </button>
          )}
          <button type="button" className="icon-btn" aria-label="Meus orçamentos" title="Meus orçamentos" onClick={() => setHistoryOpen(true)}>
            <ClockCounterClockwise size={21} />
            {calc.history.length > 0 && (
              <span className="num absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-ink">
                {calc.history.length > 99 ? "99+" : calc.history.length}
              </span>
            )}
          </button>
          <button type="button" className="icon-btn" aria-label="Configurações" title="Configurações" onClick={() => setSettingsOpen(true)}>
            <GearSix size={21} />
          </button>
        </div>
      </header>

      {/* banner discreto de instalar (celular) */}
      <AnimatePresence>
        {install.canInstall && !desktop && !bannerDismissed && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="mx-auto flex max-w-[1180px] items-center gap-2 px-4 pt-3">
              <div className="flex flex-1 items-center gap-2 rounded-full bg-surface-2 py-1 pl-4 pr-1 text-[14px]" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
                <span className="flex-1 text-ink-2">Tenha a calculadora como app</span>
                <button type="button" className="min-h-[36px] rounded-full px-3 font-semibold text-accent-text" onClick={install.install}>Instalar</button>
                <button type="button" className="icon-btn size-9" aria-label="Fechar aviso"
                  onClick={() => { setBannerDismissed(true); write(KEYS.installDismissed, "1"); }}>
                  <X size={15} />
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <main className="relative mx-auto max-w-[1180px] px-4 pb-10 sm:px-6" style={{ zIndex: 2 }}>
        {/* ===================== ABERTURA ===================== */}
        <div className="flex flex-col gap-5 pb-6 pt-7 sm:pt-10 lg:flex-row lg:items-end lg:justify-between lg:pb-8">
          <div className="max-w-[28ch]">
            <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[44px]">
              Quanto cobrar pela sua peça<span className="text-accent">?</span>
            </h1>
            <button type="button" onClick={onExample}
              className="group mt-3 inline-flex min-h-[40px] items-center gap-2 text-[15px] font-medium text-ink-2 hover:text-ink">
              <span className="flex size-7 items-center justify-center rounded-full bg-surface-2 transition-transform group-hover:scale-105" style={{ boxShadow: "inset 0 0 0 1px var(--line-strong)" }}>
                <Play size={12} weight="fill" className="text-accent-text" aria-hidden="true" />
              </span>
              Ver um exemplo preenchido
            </button>
          </div>

          {/* Básico / Profissional */}
          <div className="w-full lg:w-[420px]">
            <div className="relative grid grid-cols-2 rounded-full bg-surface-2 p-1" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}
              role="tablist" aria-label="Modo da calculadora">
              <span aria-hidden="true" className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-accent transition-transform duration-500 ease-[var(--ease-spring)]"
                style={{ transform: isPro ? "translateX(100%)" : "translateX(0)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.28)" }} />
              {(["basico", "profissional"] as const).map((mode) => (
                <button key={mode} type="button" role="tab" aria-selected={state.mode === mode} onClick={() => calc.setMode(mode)}
                  className={`relative min-h-[46px] rounded-full text-[15px] font-semibold transition-colors duration-300 ${state.mode === mode ? "text-accent-ink" : "text-ink-2 hover:text-ink"}`}>
                  {mode === "basico" ? "Básico" : "Profissional"}
                </button>
              ))}
            </div>
            <p className="hint mt-2 px-2">
              {isPro
                ? "Tudo do Básico + desgaste, mão de obra, embalagem, taxas de marketplace e impostos."
                : "Material, energia e lucro: o essencial pra precificar."}
            </p>
          </div>
        </div>

        <div id="calculadora" className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6">
          {/* ===================== FORMULÁRIO ===================== */}
          <div className="flex min-w-0 flex-col gap-4">
            <Section id="secao-impressora" icon={<Printer size={19} />} title="Impressora e energia">
              <PrinterPicker value={str("printerSelect")} customPower={str("customPrinterPower")} onChange={(id) => set("printerSelect", id)} />
              <AnimatePresence initial={false}>
                {str("printerSelect") === CUSTOM_PRINTER_ID && (
                  <m.div key="custom" initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }} className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-surface-2 p-3" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
                      <InputField id="customPrinterPower" label="Potência" suffix="W" kind="numeric" placeholder="350"
                        value={str("customPrinterPower")} onChange={(x) => set("customPrinterPower", x)} error={err("customPrinterPower")} />
                      <InputField id="customPrinterPrice" label={<>Quanto custou <span className="optional">opcional</span></>} prefix="R$" placeholder="3.000"
                        value={str("customPrinterPrice")} onChange={(x) => set("customPrinterPrice", x)} />
                      <p className="hint col-span-2">A potência está na etiqueta da fonte ou no site do fabricante. O preço serve pro desgaste, no Profissional.</p>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
              <InputField id="kwhPrice" label="Valor do kWh da sua energia" prefix="R$" suffix="/kWh" placeholder="0,85"
                value={str("kwhPrice")} onChange={(x) => set("kwhPrice", x)} error={err("kwhPrice")}
                hint="Está na sua conta de luz. Média no Brasil: R$ 0,85." />
            </Section>

            <Section id="secao-filamento" icon={<Cylinder size={19} />} title="Filamento">
              <MaterialPicker value={str("materialSelect")} onChange={(id) => set("materialSelect", id)} error={err("materialSelect")} />
              {str("materialSelect") === "outro" && (
                <InputField id="customMaterialName" kind="text" label="Nome do material" placeholder="Ex: PA-CF, PC Blend, PP"
                  value={str("customMaterialName")} onChange={(x) => set("customMaterialName", x)} error={err("customMaterialName")} />
              )}
              <InputField id="pricePerKg" label="Preço do filamento" prefix="R$" suffix="/kg" placeholder="109,90"
                value={str("pricePerKg")} onChange={(x) => set("pricePerKg", x)} error={err("pricePerKg")}
                hint="Vem com a média do mercado. Ajuste pro que você pagou." />
            </Section>

            <Section id="secao-peca" icon={<Timer size={19} />} title="A peça">
              <InputField id="jobName" kind="text" label={<>Nome da peça <span className="optional">opcional</span></>} placeholder="Ex: Suporte de celular"
                value={str("jobName")} onChange={(x) => set("jobName", x)} />
              <div className="flex flex-col gap-2" data-field="printHours">
                <span className="label">Tempo de impressão <span className="optional">está no fatiador</span></span>
                <div className="grid grid-cols-2 gap-3">
                  <InputField id="printHours" ariaLabel="Horas de impressão" kind="numeric" suffix="h" placeholder="2"
                    value={str("printHours")} onChange={(x) => set("printHours", x)} error={err("printHours") ?? (state.errors.includes("printTime") ? " " : null)} />
                  <InputField id="printMinutes" ariaLabel="Minutos de impressão" kind="numeric" suffix="min" placeholder="30"
                    value={str("printMinutes")} onChange={(x) => set("printMinutes", x)} error={err("printMinutes") ?? (state.errors.includes("printTime") ? " " : null)} />
                </div>
                {err("printTime") && <p className="error-text" role="alert">{err("printTime")}</p>}
              </div>
              <InputField id="printGrams" label="Peso do filamento usado" suffix="g" placeholder="45"
                value={str("printGrams")} onChange={(x) => set("printGrams", x)} error={err("printGrams")} hint="Também está no fatiador." />
            </Section>

            <AnimatePresence initial={false}>
              {isPro && (
                <m.div key="pro" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                  <Section id="secao-pro" icon={<Briefcase size={19} />} title="Custos do negócio" tone="pro">
                    <p className="hint -mt-2">Ligue só o que faz parte do seu custo. O que estiver desligado não entra na conta.</p>
                    <ProCosts calc={calc} onOpenSettings={() => setSettingsOpen(true)} />
                  </Section>
                </m.div>
              )}
            </AnimatePresence>

            <Section id="secao-lucro" icon={<TrendUp size={19} />} title="Seu lucro">
              <div className="flex flex-col gap-2" data-field="marginPct">
                <span className="label">Margem de lucro</span>
                <div className="flex flex-wrap gap-2">
                  {MARGIN_SHORTCUTS.map((m) => (
                    <button key={m} type="button" className="chip num min-w-[60px]" aria-pressed={pctFilled && str("marginPct") === String(m)}
                      onClick={() => set("marginPct", String(m))}>{m}%</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField id="marginPct" label="Margem em %" suffix="%" placeholder="100" disabled={fixedFilled}
                  value={str("marginPct")} onChange={(x) => set("marginPct", x)} error={state.errors.includes("margin") ? " " : null} />
                <InputField id="marginFixed" label="Ou valor fixo" prefix="R$" placeholder="15,00" disabled={pctFilled}
                  value={str("marginFixed")} onChange={(x) => set("marginFixed", x)} error={state.errors.includes("margin") ? " " : null} />
              </div>
              {err("margin")
                ? <p className="error-text -mt-2" role="alert">{err("margin")}</p>
                : <p className="hint -mt-2">Use a % ou o valor fixo. Ao preencher um, o outro fica bloqueado.</p>}

              <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 px-4" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium">{v.roundToggle ? "Arredondar para ,99 acima" : "Sem arredondamento"}</span>
                  <span className="block text-[13px] text-ink-3">Ex.: R$ 45,24 vira R$ 45,99</span>
                </span>
                <Switch id="roundToggle" checked={v.roundToggle === true} onChange={(x) => set("roundToggle", x)} label="Arredondar para ,99" />
              </label>

            </Section>

            <ClientSection calc={calc} />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <button id="calcBtn" type="button" className="btn btn-primary" onClick={onCalculate}>
                Calcular preço
                <span className="btn-icon-orb"><ArrowRight size={17} weight="bold" aria-hidden="true" /></span>
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClear}>Novo orçamento</button>
            </div>
          </div>

          {/* ===================== ORÇAMENTO ===================== */}
          <aside className="min-w-0 lg:sticky lg:top-[84px] lg:self-start">
            <ResultPanel calc={calc} onJumpTo={jumpTo} onOpenSettings={() => setSettingsOpen(true)} />
            <p className="hint mt-3 px-2 text-center">Tudo fica salvo só no seu aparelho. Nada é enviado pra lugar nenhum.</p>
          </aside>
        </div>

        {/* ===================== RODAPÉ ===================== */}
        <footer className="mt-16 flex flex-col items-center gap-5 border-t border-line pt-8 text-center">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14.5px] font-medium text-ink-2" aria-label="Outros projetos">
            <a className="inline-flex min-h-[40px] items-center gap-1 hover:text-ink" href="https://nossoprojeto3d.github.io/site/" target="_blank" rel="noopener noreferrer">
              Nosso site <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-[40px] items-center gap-1 hover:text-ink" href="https://nossoprojeto3d.github.io/catalogo/" target="_blank" rel="noopener noreferrer">
              Catálogo <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-[40px] items-center gap-1.5 hover:text-ink" href={`https://www.instagram.com/${instagramHandle}`} target="_blank" rel="noopener noreferrer">
              <InstagramLogo size={17} aria-hidden="true" />@{instagramHandle}
            </a>
          </nav>
          <p className="max-w-[46ch] text-[14.5px] italic leading-[1.55] text-ink-2">
            “Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.”
            <span className="mt-1 block not-italic text-[13px] text-ink-3">Provérbios 16:3</span>
          </p>
          <span className="text-[12.5px] text-ink-3">© 2026 Nosso Projeto 3D · Feita com amor pra quem vive de impressão 3D</span>
        </footer>
      </main>

      <PriceDock calc={calc} onCalculate={onCalculate} />

      <HistorySheet calc={calc} open={historyOpen} onOpenChange={setHistoryOpen}
        onOpened={() => document.getElementById("calculadora")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })} />
      <SettingsSheet calc={calc} open={settingsOpen} onOpenChange={setSettingsOpen} theme={theme} onTheme={setTheme}
        canInstall={install.canInstall} onInstall={install.install} />
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} instagram="https://www.instagram.com/nossoprojeto3d" />
      <IosInstallDialog open={install.iosOpen} onOpenChange={install.setIosOpen} />
      <QuickToast toast={calc.toast} />
    </LazyMotion>
  );
}

// ---------------------------------------------------------
// DADOS PARA O CLIENTE (opcional, recolhido): vão só no orçamento do
// cliente, não entram na conta. Abre sozinho se já houver algo preenchido.
// ---------------------------------------------------------
function ClientSection({ calc }: { calc: ReturnType<typeof useCalculator> }) {
  const { state, set } = calc;
  const v = state.values;
  const reduce = useReducedMotion();
  const filled = ["clientName", "deliveryTime", "notes"].some((id) => String(v[id] ?? "").trim() !== "");
  const [open, setOpen] = useState(filled);
  useEffect(() => { if (filled) setOpen(true); }, [filled]);
  const str = (id: string) => String(v[id] ?? "");

  return (
    <section id="secao-cliente" className="bezel" aria-labelledby="secao-cliente-title">
      <div className="bezel-core">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="secao-cliente-campos"
          className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left sm:px-6">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-2"
            style={{ boxShadow: "inset 0 0 0 1px var(--line)" }} aria-hidden="true">
            <UserCircle size={19} />
          </span>
          <span className="flex-1">
            <span id="secao-cliente-title" className="block text-[17px] font-semibold tracking-[-0.01em]">Dados para o cliente</span>
            <span className="block text-[13px] text-ink-3">Opcional. Só no orçamento do cliente.</span>
          </span>
          <CaretDown size={18} className={`shrink-0 text-ink-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <m.div id="secao-cliente-campos" key="campos" initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }} className="overflow-hidden">
              <div className="flex flex-col gap-5 border-t border-line px-4 pb-5 pt-5 sm:px-6 sm:pb-6">
                <InputField id="clientName" kind="text" label="Para quem é" placeholder="Ex: Maria" autoComplete="off"
                  value={str("clientName")} onChange={(x) => set("clientName", x)} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InputField id="deliveryTime" kind="text" label="Prazo de entrega" placeholder="Ex: 5 dias úteis"
                    value={str("deliveryTime")} onChange={(x) => set("deliveryTime", x)} />
                  <InputField id="validityDays" kind="numeric" label="Validade do orçamento" suffix="dias" placeholder="7"
                    value={str("validityDays")} onChange={(x) => set("validityDays", x)} hint="Vazio = sem validade." />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="notes" className="label">Observações</label>
                  <textarea id="notes" rows={3} maxLength={500} placeholder="Ex: cor preta, acabamento lixado, pagamento no Pix."
                    value={str("notes")} onChange={(e) => set("notes", e.target.value)}
                    className="field-box min-h-[96px] resize-y py-3 text-[16px] leading-[1.45] text-ink outline-none" />
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ---------------------------------------------------------
// BARRA FIXA DO CELULAR: preço ao vivo ou o que falta
// Some quando o orçamento já está na tela ou quando o teclado está aberto.
// ---------------------------------------------------------
function PriceDock({ calc, onCalculate }: { calc: ReturnType<typeof useCalculator>; onCalculate: () => void }) {
  const { result, progress } = calc;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [typing, setTyping] = useState(false);
  const missing = progress.filter((p) => !p.done);
  const hidden = panelVisible || typing;

  useEffect(() => {
    const panel = document.getElementById("orcamento");
    if (!panel || !("IntersectionObserver" in window)) return;
    // o orçamento pode ser mais alto que a tela: conta como "na tela" quando ocupa 30% dela
    const io = new IntersectionObserver(([e]) => setPanelVisible(e.isIntersecting && e.intersectionRect.height > window.innerHeight * 0.3),
      { threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1] });
    io.observe(panel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const isField = (el: Element | null) => !!el && el.matches("input:not([type=checkbox]):not([type=search]), select, textarea") && !!el.closest("main");
    const onIn = (e: FocusEvent) => { if (isField(e.target as Element)) setTyping(true); };
    const onOut = () => setTimeout(() => setTyping(isField(document.activeElement)), 60);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => { document.removeEventListener("focusin", onIn); document.removeEventListener("focusout", onOut); };
  }, []);

  // o aviso de cookies (medicao.js, compartilhado entre os projetos) também
  // fica no rodapé da tela: enquanto ele estiver aberto, a barra sobe acima dele
  const [cookieOffset, setCookieOffset] = useState(0);
  useEffect(() => {
    const measure = () => {
      const box = document.getElementById("np3d-cookies");
      setCookieOffset(box ? window.innerHeight - box.getBoundingClientRect().top : 0);
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(document.body, { childList: true });
    window.addEventListener("resize", measure);
    return () => { mo.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // reserva o espaço da barra (o toast e o rodapé ficam acima dela)
  useEffect(() => {
    const el = ref.current;
    const sync = () => {
      const visible = el && getComputedStyle(el).display !== "none";
      document.documentElement.style.setProperty("--dock-h", visible && !hidden ? `${el!.offsetHeight}px` : "0px");
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [hidden]);

  return (
    <m.div ref={ref} data-dock className="fixed inset-x-0 bottom-0 lg:hidden"
      style={{ zIndex: "var(--z-dock)", paddingBottom: cookieOffset ? `${cookieOffset + 8}px` : "max(10px, var(--safe-b))" }}
      initial={false} animate={{ y: hidden ? "110%" : "0%" }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 36 }}
      aria-hidden={hidden || undefined}>
      <div className="mx-3 flex items-center gap-3 rounded-[22px] border border-line bg-surface/[0.97] py-2 pl-4 pr-2 shadow-[0_18px_40px_-16px_rgb(var(--shadow-tint)/0.7)] backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] text-ink-3">
            {result ? (result.hasCustomName ? result.jobName : "Preço sugerido") : missing.length ? `Faltam ${missing.length} de ${progress.length}` : "Tudo preenchido"}
          </p>
          <p className={`truncate ${result ? "num text-[21px] font-semibold tracking-[-0.03em]" : "text-[14.5px] font-medium"}`}>
            {result ? brl(result.finalPrice) : missing.length ? missing.slice(0, 2).map((m) => m.label).join(", ") + (missing.length > 2 ? "…" : "") : "Pronto pra calcular"}
          </p>
        </div>
        <button type="button" tabIndex={hidden ? -1 : 0} className="btn btn-primary min-h-[46px] px-5 text-[15px]"
          onClick={() => {
            if (result) document.getElementById("orcamento")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
            else onCalculate();
          }}>
          {result ? "Ver orçamento" : "Calcular"}
        </button>
      </div>
    </m.div>
  );
}
