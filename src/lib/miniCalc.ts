// Calculadoras de apoio do computador: uma simples (somar valores) e uma de horas.
// Sem tela aqui; os componentes ficam em src/components/MiniCalcs.tsx.
// Conta sem eval (a CSP não permite) e sem erro de centavo (arredonda a 10 casas).

export const OPERADORES = ["+", "−", "×", "÷"] as const;
type Operador = (typeof OPERADORES)[number];
const ehOperador = (c: string): c is Operador => (OPERADORES as readonly string[]).includes(c);

const arredondar = (n: number) => Math.round(n * 1e10) / 1e10;

// Avalia "2+3×4" (vírgula decimal, × e ÷ antes de + e −). Null se não der conta.
export function avaliar(expressao: string): number | null {
  let s = expressao.trim();
  while (s && ehOperador(s[s.length - 1])) s = s.slice(0, -1); // "5+" vale 5
  if (!s) return null;
  const partes: (number | Operador)[] = [];
  let num = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (ehOperador(c) && !(c === "−" && num === "" && (i === 0 || ehOperador(s[i - 1])))) {
      partes.push(Number(num.replace("−", "-").replace(",", ".")), c);
      num = "";
    } else num += c;
  }
  partes.push(Number(num.replace("−", "-").replace(",", ".")));
  if (partes.some(p => typeof p === "number" && !Number.isFinite(p))) return null;
  // primeiro × e ÷
  const soma: (number | Operador)[] = [partes[0]];
  for (let i = 1; i < partes.length; i += 2) {
    const op = partes[i] as Operador, b = partes[i + 1] as number;
    if (op === "×" || op === "÷") {
      const a = soma.pop() as number;
      if (op === "÷" && b === 0) return null;
      soma.push(op === "×" ? a * b : a / b);
    } else soma.push(op, b);
  }
  let total = soma[0] as number;
  for (let i = 1; i < soma.length; i += 2) total = soma[i] === "+" ? total + (soma[i + 1] as number) : total - (soma[i + 1] as number);
  return arredondar(total);
}

export function formatarNumero(n: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 }).format(n).replace("-", "−");
}

export type EstadoCalc = { expressao: string; resultado: number | null; feito: boolean };
export const estadoInicial = (): EstadoCalc => ({ expressao: "", resultado: null, feito: false });

// Uma tecla por vez: "0"–"9", ",", "+", "−", "×", "÷", "=", "⌫", "C"
export function teclar(s: EstadoCalc, tecla: string): EstadoCalc {
  if (tecla === "C") return estadoInicial();
  if (tecla === "=") {
    const r = avaliar(s.expressao);
    return r === null ? s : { expressao: s.expressao, resultado: r, feito: true };
  }
  if (tecla === "⌫") {
    if (s.feito) return { ...s, feito: false, resultado: null };
    return { ...s, expressao: s.expressao.slice(0, -1), resultado: null };
  }
  let e = s.expressao;
  // depois do "=": operador continua do resultado, número começa conta nova
  if (s.feito) e = ehOperador(tecla) && s.resultado !== null ? formatarNumero(s.resultado).replace(/\./g, "") : "";
  const ultimo = e[e.length - 1];
  if (ehOperador(tecla)) {
    if (!e) return tecla === "−" ? { expressao: "−", resultado: null, feito: false } : { ...s, feito: false, expressao: e };
    if (ehOperador(ultimo)) e = e.slice(0, -1);
    if (!e) return { expressao: "", resultado: null, feito: false };
    return { expressao: e + tecla, resultado: null, feito: false };
  }
  if (tecla === ",") {
    const numeroAtual = e.split(/[+−×÷]/).pop() || "";
    if (numeroAtual.includes(",")) return { ...s, expressao: e, feito: false };
    return { expressao: e + (numeroAtual === "" ? "0," : ","), resultado: null, feito: false };
  }
  if (/^\d$/.test(tecla)) {
    if (e.length >= 40) return s;
    return { expressao: e + tecla, resultado: null, feito: false };
  }
  return s;
}

/* ---------------- Horas ---------------- */

// Duração em minutos a partir de "2:30", "2h30", "2h", "45m", "1h 5min" ou "1,5" (horas decimais).
export function lerDuracao(texto: string): number | null {
  const t = texto.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  let m = t.match(/^(\d{1,4}):(\d{1,2})$/);
  if (m) return Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null;
  m = t.match(/^(?:(\d{1,4})h)?(?:(\d{1,4})(?:min|m)?)?$/);
  if (m && (m[1] !== undefined || /m(in)?$/.test(t)) && (m[1] !== undefined || m[2] !== undefined)) {
    const h = Number(m[1] || 0), min = Number(m[2] || 0);
    if (m[1] !== undefined && min >= 60) return null;
    return h * 60 + min;
  }
  m = t.match(/^(\d{1,4})(?:[,.](\d{1,2}))?$/); // número solto = horas ("1,5" = 1h30)
  if (m) return Math.round(Number(`${m[1]}.${m[2] || 0}`) * 60);
  return null;
}

export function formatarDuracao(minutos: number): string {
  const sinal = minutos < 0 ? "−" : "";
  const a = Math.abs(Math.round(minutos));
  return `${sinal}${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
}

export function formatarHorasDecimais(minutos: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(minutos / 60).replace("-", "−")} h`;
}
