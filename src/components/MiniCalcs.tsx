/* Calculadoras de apoio (só no computador): botões no cabeçalho e cartões flutuantes.
   Começam desligadas; cada botão liga a sua. Não bloqueiam a página: dá pra seguir
   preenchendo o formulário com elas abertas, e o teclado só vai pra elas quando o foco está nelas. */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Backspace, Calculator, Clock, Copy, DotsSixVertical, Trash, X } from "@phosphor-icons/react";
import {
  estadoInicial, formatarDuracao, formatarHorasDecimais, formatarNumero, lerDuracao, teclar, type EstadoCalc,
} from "../lib/miniCalc";

export type QualCalc = "simples" | "horas";

export function BotoesMiniCalc({ abertas, alternar }: { abertas: Record<QualCalc, boolean>; alternar: (q: QualCalc) => void }) {
  const botao = (q: QualCalc, nome: string, Icone: typeof Calculator) => (
    <button type="button" className="icon-btn mini-calc-botao" aria-pressed={abertas[q]} aria-label={nome} title={nome} onClick={() => alternar(q)}>
      <Icone size={21} weight={abertas[q] ? "fill" : "regular"} />
    </button>
  );
  return (
    <>
      {botao("simples", "Calculadora", Calculator)}
      {botao("horas", "Calculadora de horas", Clock)}
    </>
  );
}

// enquanto o aviso de cookies está na tela, as calculadoras ficam acima dele (mesma medida da barra do celular)
function useAlturaCookies() {
  const [altura, setAltura] = useState(0);
  useEffect(() => {
    const medir = () => {
      const box = document.getElementById("np3d-cookies");
      setAltura(box ? window.innerHeight - box.getBoundingClientRect().top : 0);
    };
    medir();
    const mo = new MutationObserver(medir);
    mo.observe(document.body, { childList: true });
    window.addEventListener("resize", medir);
    return () => { mo.disconnect(); window.removeEventListener("resize", medir); };
  }, []);
  return altura;
}

export function MiniCalcs({ abertas, fechar }: { abertas: Record<QualCalc, boolean>; fechar: (q: QualCalc) => void }) {
  // as duas ficam lado a lado no canto de baixo à esquerda; cada uma pode ser arrastada pelo título
  const baixo = 24 + useAlturaCookies();
  return (
    <AnimatePresence>
      {abertas.simples && (
        <Cartao key="simples" titulo="Calculadora" Icone={Calculator} esquerda={24} baixo={baixo} aoFechar={() => fechar("simples")}>
          <CalcSimples />
        </Cartao>
      )}
      {abertas.horas && (
        <Cartao key="horas" titulo="Calculadora de horas" Icone={Clock} esquerda={abertas.simples ? 24 + 272 + 12 : 24} baixo={baixo} aoFechar={() => fechar("horas")}>
          <CalcHoras />
        </Cartao>
      )}
    </AnimatePresence>
  );
}

function Cartao({ titulo, Icone, esquerda, baixo, aoFechar, children }: {
  titulo: string; Icone: typeof Calculator; esquerda: number; baixo: number; aoFechar: () => void; children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [desloc, setDesloc] = useState({ x: 0, y: 0 });
  const arraste = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);

  // abre já pronta pra digitar (se o conteúdo já pôs o foco num campo, deixa lá)
  useEffect(() => { if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true }); }, []);

  function iniciar(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    arraste.current = { x: e.clientX, y: e.clientY, dx: desloc.x, dy: desloc.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function mover(e: React.PointerEvent) {
    const a = arraste.current, el = ref.current;
    if (!a || !el) return;
    // não deixa o cartão sair da tela nem passar por baixo do cabeçalho
    const r = el.getBoundingClientRect();
    const base = { x: r.left - desloc.x, y: r.top - desloc.y };
    const x = Math.min(Math.max(a.dx + e.clientX - a.x, 8 - base.x), innerWidth - 8 - r.width - base.x);
    const y = Math.min(Math.max(a.dy + e.clientY - a.y, 72 - base.y), innerHeight - 8 - r.height - base.y);
    setDesloc({ x, y });
  }

  return (
    // fora: posição (arrastar); dentro: animação de abrir e fechar
    <div ref={ref} role="dialog" aria-label={titulo} tabIndex={-1}
      className="mini-calc fixed w-[272px] outline-none"
      style={{ left: esquerda, bottom: baixo, zIndex: "var(--z-mini-calc)", transform: `translate(${desloc.x}px, ${desloc.y}px)` }}
      onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); aoFechar(); } }}>
    <m.div className="bezel"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}>
      <div className="bezel-core overflow-hidden">
        <div className="flex cursor-grab items-center gap-2 py-1.5 pl-3 pr-1.5 active:cursor-grabbing select-none"
          onPointerDown={iniciar} onPointerMove={mover} onPointerUp={() => (arraste.current = null)} onPointerCancel={() => (arraste.current = null)}>
          <Icone size={16} className="text-accent-text" aria-hidden="true" />
          <span className="flex-1 text-[13px] font-semibold text-ink-2">{titulo}</span>
          <DotsSixVertical size={16} className="text-ink-3" aria-hidden="true" />
          <button type="button" className="icon-btn size-9" aria-label={`Fechar ${titulo.toLowerCase()}`} title="Fechar (Esc)" onClick={aoFechar}>
            <X size={15} />
          </button>
        </div>
        <div className="px-3 pb-3">{children}</div>
      </div>
    </m.div>
    </div>
  );
}

function useCopiar() {
  const [copiado, setCopiado] = useState(false);
  const copiar = async (texto: string) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1400); } catch { /* sem permissão: ignora */ }
  };
  return { copiado, copiar };
}

const TECLAS = ["C", "⌫", "÷", "×", "7", "8", "9", "−", "4", "5", "6", "+", "1", "2", "3", "=", "0", ","] as const;
const DO_TECLADO: Record<string, string> = { "+": "+", "-": "−", "*": "×", x: "×", "/": "÷", ",": ",", ".": ",", Enter: "=", "=": "=", Backspace: "⌫", Delete: "C" };

function CalcSimples() {
  const [s, setS] = useState<EstadoCalc>(estadoInicial);
  const { copiado, copiar } = useCopiar();
  const aperta = (t: string) => setS(atual => teclar(atual, t));
  const valor = s.feito && s.resultado !== null ? formatarNumero(s.resultado) : null;

  useEffect(() => {
    // teclado físico só quando o foco está dentro desta calculadora
    const el = document.querySelector<HTMLElement>('[role=dialog][aria-label="Calculadora"]');
    if (!el) return;
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = /^\d$/.test(e.key) ? e.key : DO_TECLADO[e.key];
      if (!t) return;
      e.preventDefault();
      aperta(t);
    };
    el.addEventListener("keydown", on);
    return () => el.removeEventListener("keydown", on);
  }, []);

  return (
    <div>
      <button type="button" className="mini-calc-visor" title={valor ? "Copiar o resultado" : undefined}
        onClick={() => valor && copiar(valor.replace(/\./g, ""))} aria-live="polite">
        <span className="mono block min-h-[18px] truncate text-right text-[12.5px] text-ink-3">{s.feito ? `${s.expressao} =` : " "}</span>
        <span className="num block truncate text-right text-[28px] font-semibold leading-tight tracking-[-0.02em]">
          {valor ?? (s.expressao || "0")}
        </span>
        <span className="block h-4 text-right text-[11.5px] text-accent-text">{copiado ? "Copiado" : valor ? <><Copy size={11} className="inline" /> clique pra copiar</> : ""}</span>
      </button>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {TECLAS.map(t => (
          <button key={t} type="button" onClick={() => aperta(t)} aria-label={t === "⌫" ? "Apagar" : t === "C" ? "Limpar" : t}
            className={`mini-calc-tecla ${t === "=" ? "row-span-2 mini-calc-igual" : ""} ${t === "0" ? "col-span-2" : ""} ${["÷", "×", "−", "+"].includes(t) ? "text-accent-text" : ""} ${["C", "⌫"].includes(t) ? "text-ink-2" : ""}`}>
            {t === "⌫" ? <Backspace size={17} /> : t}
          </button>
        ))}
      </div>
    </div>
  );
}

type Linha = { id: number; minutos: number; texto: string };

function CalcHoras() {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState(false);
  const { copiado, copiar } = useCopiar();
  const campo = useRef<HTMLInputElement>(null);
  const total = linhas.reduce((t, l) => t + l.minutos, 0);

  function lancar(sinal: 1 | -1) {
    const min = lerDuracao(texto);
    if (min === null || min === 0) { setErro(true); campo.current?.focus(); return; }
    setLinhas(ls => [...ls, { id: Date.now(), minutos: sinal * min, texto: formatarDuracao(sinal * min) }]);
    setTexto(""); setErro(false); campo.current?.focus();
  }

  useEffect(() => { campo.current?.focus({ preventScroll: true }); }, []);

  return (
    <div>
      <div className="field-box !min-h-[44px] !px-3" data-invalid={erro || undefined}>
        <input ref={campo} value={texto} placeholder="2:30, 2h30, 45m ou 1,5" aria-label="Duração" inputMode="text"
          className="!h-[42px] text-[16px]" autoComplete="off" spellCheck={false}
          onChange={e => { setTexto(e.target.value); setErro(false); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); lancar(e.shiftKey ? -1 : 1); } }} />
      </div>
      <p className={`mt-1 min-h-[16px] text-[11.5px] ${erro ? "text-danger" : "text-ink-3"}`}>
        {erro ? "Não entendi. Use 2:30, 2h30, 45m ou 1,5." : "Enter soma · Shift+Enter tira"}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        <button type="button" className="mini-calc-tecla text-[14px]" onClick={() => lancar(1)}>+ Somar</button>
        <button type="button" className="mini-calc-tecla text-[14px]" onClick={() => lancar(-1)}>− Tirar</button>
      </div>

      {linhas.length > 0 && (
        <ul className="mini-calc-lista mt-2 max-h-[132px] overflow-y-auto">
          {linhas.map(l => (
            <li key={l.id} className="flex items-center gap-2 py-0.5 pl-2 text-[13.5px]">
              <span className={`num flex-1 ${l.minutos < 0 ? "text-danger" : "text-ink-2"}`}>{l.minutos < 0 ? l.texto : `+${l.texto}`}</span>
              <button type="button" className="icon-btn size-8" aria-label={`Tirar ${l.texto} da conta`} onClick={() => setLinhas(ls => ls.filter(x => x.id !== l.id))}>
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="mini-calc-visor mt-2" title={linhas.length ? "Copiar o total" : undefined}
        onClick={() => linhas.length && copiar(formatarDuracao(total))} aria-live="polite">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[12.5px] text-ink-3">Total</span>
          <span className="num text-[26px] font-semibold leading-tight tracking-[-0.02em]">{formatarDuracao(total)}</span>
        </span>
        <span className="flex justify-between text-[11.5px]">
          <span className="text-accent-text">{copiado ? "Copiado" : linhas.length ? "clique pra copiar" : ""}</span>
          <span className="num text-ink-3">{formatarHorasDecimais(total)}</span>
        </span>
      </button>
      {linhas.length > 0 && (
        <button type="button" className="mt-1.5 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-full text-[13px] text-ink-3 hover:text-ink"
          onClick={() => { setLinhas([]); campo.current?.focus(); }}>
          <Trash size={14} /> Limpar
        </button>
      )}
    </div>
  );
}
