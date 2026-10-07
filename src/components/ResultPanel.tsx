/* Painel do orçamento: preço ao vivo, composição, ações (WhatsApp, copiar, PDF, salvar). */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { BookmarkSimple, Check, CheckCircle, Copy, FilePdf, Storefront, WhatsappLogo } from "@phosphor-icons/react";
import { brl, buildWhatsAppText, formatPrintTime, whatsAppHref, type CalcResult } from "../lib/calc";
import { buildClientWhatsAppText, clientWhatsAppHref, getClientDetails, hasStoreBranding } from "../lib/cliente";
import { exportClientPdf, exportPdf } from "../lib/pdf";
import { KEYS, read, track, write } from "../lib/storage";
import type { Calculator } from "../lib/useCalculator";
import { AnimatedPrice } from "./ui";

const SLICE_COLORS: Record<string, string> = {
  wear: "var(--c-wear)", labor: "var(--c-labor)", failure: "var(--c-failure)", packaging: "var(--c-packaging)",
  materials: "var(--c-materials)", shopee: "var(--c-shopee)", meli: "var(--c-meli)", shipping: "var(--c-shipping)",
  taxes: "var(--c-taxes)",
};

/** Partes do preço: filamento, energia, cada custo profissional e lucro (só as maiores que zero). */
function buildSlices(r: CalcResult) {
  const slices = [
    { label: "Filamento", value: r.filamentCost, color: "var(--c-filament)" },
    { label: "Energia", value: r.energyCost, color: "var(--c-energy)" },
  ];
  if (r.proMode) r.proCosts.forEach((c) => slices.push({ label: c.label, value: c.value, color: SLICE_COLORS[c.id] }));
  slices.push({ label: "Lucro", value: r.profit, color: "var(--c-profit)" });
  return slices.filter((s) => s.value > 0);
}

type ExportVersion = "cliente" | "completo";

export function ResultPanel({ calc, onJumpTo, onOpenSettings }: { calc: Calculator; onJumpTo: (id: string) => void; onOpenSettings: () => void }) {
  const { result: r, progress, settings, state, budgetId, saveBudget, storeLogo } = calc;
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "busy" | "error">("idle");
  // versão do orçamento pra exportar: para o cliente (padrão) ou completa; lembra a última escolha
  const [version, setVersionState] = useState<ExportVersion>(() => (read(KEYS.exportMode) === "cliente" ? "cliente" : "completo"));
  const setVersion = (v: ExportVersion) => { setVersionState(v); write(KEYS.exportMode, v); };
  const forClient = version === "cliente";
  const details = r ? getClientDetails(state.values, r.calculatedAt) : null;

  useEffect(() => { setPdfState((s) => (s === "error" ? "idle" : s)); }, [r]);

  // No computador o painel fica numa coluna fixa com a altura da tela. Se o
  // conteúdo não couber, compacta em até 2 níveis (data-density, ver
  // styles.css); só depois disso a área do meio ganha rolagem própria.
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fit = () => {
    // o nível vai na coluna inteira (aside), pra compactar também o seletor de modo
    const el = sectionRef.current?.parentElement;
    const sc = scrollRef.current;
    if (!el || !sc) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) { el.removeAttribute("data-density"); return; }
    let d = 0;
    el.dataset.density = "0";
    while (sc.scrollHeight > sc.clientHeight + 1 && d < 3) el.dataset.density = String(++d);
  };
  // mede de novo quando as animações de troca terminam (no meio delas o
  // conteúdo fica maior por um instante e a medição exagerava a compactação)
  const refitTimer = useRef<number | undefined>(undefined);
  const scheduleRefit = () => {
    window.clearTimeout(refitTimer.current);
    refitTimer.current = window.setTimeout(fit, 600);
  };
  useLayoutEffect(() => { fit(); scheduleRefit(); });
  useEffect(() => {
    const ro = new ResizeObserver(() => { fit(); scheduleRefit(); });
    if (scrollRef.current?.firstElementChild) ro.observe(scrollRef.current.firstElementChild);
    if (sectionRef.current?.parentElement) ro.observe(sectionRef.current.parentElement);
    return () => { ro.disconnect(); window.clearTimeout(refitTimer.current); };
  }, []);

  const copy = async () => {
    if (!r) return;
    track("orcamento_copiado", { modo: state.mode, versao: version });
    const text = forClient ? buildClientWhatsAppText(r, details!, settings) : buildWhatsAppText(r, settings);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    saveBudget({ silent: true });
    setTimeout(() => setCopied(false), 2200);
  };

  const pdf = async () => {
    if (!r) return;
    setPdfState("busy");
    try {
      if (forClient) await exportClientPdf(r, details!, settings, storeLogo);
      else await exportPdf(r, settings);
      track("pdf_exportado", { modo: state.mode, versao: version });
      saveBudget({ silent: true });
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  };

  const done = progress.filter((p) => p.done).length;
  const slices = r ? buildSlices(r) : [];
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <section id="orcamento" ref={sectionRef} className="bezel lg:flex lg:min-h-0 lg:flex-[0_1_auto] lg:flex-col" aria-label="Orçamento" aria-live="polite">
      <div className="bezel-core relative overflow-hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        {/* brilho sutil quando o orçamento fica pronto */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 transition-opacity duration-700"
          style={{ opacity: r ? 1 : 0, background: "radial-gradient(420px 160px at 20% -40px, var(--accent-soft), transparent 70%)" }} />

        <div className="relative px-5 pb-5 pt-5 sm:px-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col rp-pad">
          <div ref={scrollRef} className="lg:-mx-1 lg:min-h-0 lg:flex-[0_1_auto] lg:overflow-y-auto lg:px-1">
          <div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-2">
              <span className={`size-2 rounded-full ${r ? "bg-ok" : "bg-line-strong"}`} aria-hidden="true" />
              {r ? "Orçamento pronto" : "Aguardando dados"}
            </span>
            {!r && <span className="num text-[13px] text-ink-3">{done}/{progress.length}</span>}
          </div>

          <p className="mt-4 truncate text-[14px] text-ink-2 rp-mt">{r?.hasCustomName ? r.jobName : "Preço sugerido"}</p>
          <AnimatedPrice value={r ? r.finalPrice : 0} id="precoFinal"
            className={`num rp-price mt-1 block text-[44px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[52px] ${r ? "text-ink" : "text-ink-3"}`} />
          {r && r.shouldRound && r.roundingDiff > 0.001 && (
            <p className="mt-1.5 text-[13px] text-ink-3">
              Calculado <span className="num">{brl(r.calculatedPrice)}</span>, arredondado <span className="num">+{brl(r.roundingDiff)}</span>
            </p>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {!r ? (
              <m.div key="empty" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <p className="mt-5 text-[14.5px] text-ink-2 rp-mt rp-hide2">Preencha os dados e o preço aparece aqui, ao vivo.</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                  <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / progress.length) * 100}%` }} />
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 rp-mt">
                  {progress.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => onJumpTo(p.id)} disabled={p.done}
                        className={`rp-check flex min-h-[36px] w-full items-center gap-2 rounded-lg text-left text-[14px] ${p.done ? "text-ink-3" : "text-ink hover:text-accent-text"}`}>
                        {p.done
                          ? <CheckCircle size={17} weight="fill" className="shrink-0 text-ok" aria-hidden="true" />
                          : <span className="size-[15px] shrink-0 rounded-full" style={{ boxShadow: "inset 0 0 0 1.5px var(--line-strong)" }} aria-hidden="true" />}
                        <span className={p.done ? "line-through decoration-ink-3/50" : undefined}>{p.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </m.div>
            ) : (
              <m.div key="body" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                <dl className="mt-5 grid grid-cols-3 gap-2 rp-mt">
                  {[
                    { k: "Custo", v: brl(r.totalCost) },
                    { k: "Lucro", v: brl(r.profit), accent: true },
                    { k: "Lucro/hora", v: r.totalHours > 0 ? brl(r.profit / r.totalHours) : "-" },
                  ].map((s) => (
                    <div key={s.k} className="rp-stat rounded-2xl bg-surface-2 px-3 py-3" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
                      <dt className="text-[12.5px] text-ink-3">{s.k}</dt>
                      <dd className={`num mt-1 truncate text-[15px] font-medium sm:text-[16px] ${s.accent ? "text-accent-text" : ""}`}>{s.v}</dd>
                    </div>
                  ))}
                </dl>

                {total > 0 && (
                  <div className="mt-5 rp-mt">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="font-medium text-ink-2">Composição do preço</span>
                      <span className="text-ink-3">lucro = {Math.round((r.profit / r.finalPrice) * 100)}% do preço</span>
                    </div>
                    <div className="mt-2.5 flex h-3 gap-[3px] overflow-hidden rounded-full" role="img" aria-label="Composição do preço">
                      {slices.map((s) => (
                        <span key={s.label} className="h-full rounded-[3px] transition-[flex-grow] duration-500 ease-[var(--ease-out-soft)] first:rounded-l-full last:rounded-r-full"
                          style={{ flexGrow: s.value, flexBasis: 0, background: s.color }} title={s.label} />
                      ))}
                    </div>
                    <ul className="mt-3 flex flex-col">
                      {slices.map((s) => (
                        <li key={s.label} className="rp-row flex min-h-[30px] items-center gap-2.5 text-[14px]">
                          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate text-ink-2">{s.label}</span>
                          <span className="num w-10 text-right text-[12.5px] text-ink-3">{Math.round((s.value / total) * 100)}%</span>
                          <span className="num w-[92px] text-right">{brl(s.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mono mt-4 text-[12px] text-ink-3 rp-mt rp-hide2">
                  {r.grams.toLocaleString("pt-BR")} g · {r.energyKwh.toFixed(2).replace(".", ",")} kWh · {formatPrintTime(r.hours, r.minutes)}
                </p>
              </m.div>
            )}
          </AnimatePresence>

          </div>
          </div>

          <div className="mt-5 flex flex-none flex-col gap-2.5 rp-mt rp-actions">
            <div className="rp-share flex flex-col gap-2">
              <span id="compartilhar-label" className="rp-sharelabel px-1 text-[14px] font-medium text-ink-2">Compartilhar <span className="rp-hide3">orçamento </span>{forClient ? "com:" : "para:"}</span>
              <div className="rp-sharetoggle grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}
                role="radiogroup" aria-labelledby="compartilhar-label">
                {(["completo", "cliente"] as const).map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={version === v} onClick={() => setVersion(v)}
                    className={`rp-sharebtn min-h-[40px] whitespace-nowrap rounded-full text-[14px] font-medium transition-colors ${version === v ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
                    style={version === v ? { boxShadow: "inset 0 0 0 1px var(--line-strong)" } : undefined}>
                    {v === "cliente" ? "Cliente" : "Mim (completo)"}
                  </button>
                ))}
              </div>
            </div>
            {forClient && !hasStoreBranding(settings, storeLogo) && (
              <button type="button" onClick={onOpenSettings}
                className="rp-reminder flex items-center gap-2.5 rounded-xl bg-accent-soft px-3 py-2.5 text-left text-[13.5px] text-ink-2 hover:text-ink">
                <Storefront size={18} className="shrink-0 text-accent-text" aria-hidden="true" />
                <span className="flex-1">Coloque o nome e o logo da sua loja no orçamento.</span>
                <span className="font-semibold text-accent-text">Configurar</span>
              </button>
            )}
            <div className="rp-sendrow flex flex-col gap-2.5">
            <a
              className="btn btn-primary rp-btn w-full"
              href={r ? (forClient ? clientWhatsAppHref(r, details!, settings) : whatsAppHref(r, settings)) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!r}
              onClick={() => saveBudget({ silent: true })}
            >
              <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
              {forClient ? "Enviar ao cliente" : "Enviar no WhatsApp"}
            </a>
            <div className="rp-btnrow grid grid-cols-3 gap-2">
              <button type="button" className="btn btn-secondary rp-btn min-h-[48px] gap-1.5 px-2 text-[14px]" disabled={!r} onClick={copy}
                aria-label={copied ? "Copiado" : "Copiar"} title={copied ? "Copiado" : "Copiar"}>
                {copied ? <Check size={17} weight="bold" className="text-ok" aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                <span className="rp-btnlabel">{copied ? "Copiado" : "Copiar"}</span>
              </button>
              <button type="button" className="btn btn-secondary rp-btn min-h-[48px] gap-1.5 px-2 text-[14px]" disabled={!r || pdfState === "busy"} onClick={pdf}
                aria-label={pdfState === "busy" ? "Gerando PDF" : "PDF"} title="PDF">
                <FilePdf size={17} aria-hidden="true" />
                <span className="rp-btnlabel">{pdfState === "busy" ? "Gerando" : "PDF"}</span>
              </button>
              <button type="button" className="btn btn-secondary rp-btn min-h-[48px] gap-1.5 px-2 text-[14px]" disabled={!r} onClick={() => saveBudget()}
                aria-label={budgetId ? "Salvo" : "Salvar"} title={budgetId ? "Salvo" : "Salvar"}>
                <BookmarkSimple size={17} weight={budgetId ? "fill" : "regular"} className={budgetId ? "text-accent-text" : undefined} aria-hidden="true" />
                <span className="rp-btnlabel">{budgetId ? "Salvo" : "Salvar"}</span>
              </button>
            </div>
            </div>
            {pdfState === "error" && (
              <p className="error-text" role="alert">Não foi possível gerar o PDF. Verifique sua internet e tente de novo.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
