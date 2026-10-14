// Testes das calculadoras de apoio (só no computador): a simples e a de horas.
import { describe, expect, it } from "vitest";
import { avaliar, formatarNumero, teclar, estadoInicial, lerDuracao, formatarDuracao, formatarHorasDecimais } from "../../src/lib/miniCalc";

describe("calculadora simples: avaliar", () => {
  it("respeita a ordem das contas (× e ÷ antes de + e −)", () => {
    expect(avaliar("2+3×4")).toBe(14);
    expect(avaliar("10−4÷2")).toBe(8);
  });
  it("usa vírgula como decimal e não erra centavos", () => {
    expect(avaliar("0,1+0,2")).toBe(0.3);
    expect(avaliar("19,90×3")).toBe(59.7);
  });
  it("aceita número negativo no começo", () => {
    expect(avaliar("−5+2")).toBe(-3);
  });
  it("divisão por zero e expressão incompleta não quebram", () => {
    expect(avaliar("5÷0")).toBeNull();
    expect(avaliar("5+")).toBe(5);
    expect(avaliar("")).toBeNull();
  });
});

describe("calculadora simples: teclas", () => {
  const digitar = (teclas: string[]) => teclas.reduce(teclar, estadoInicial());
  it("monta a conta e mostra o resultado ao apertar =", () => {
    const s = digitar(["1", "2", "+", "3", "0", ",", "5", "="]);
    expect(s.resultado).toBe(42.5);
  });
  it("trocar de operador substitui o anterior", () => {
    expect(digitar(["8", "+", "×", "2"]).expressao).toBe("8×2");
  });
  it("não deixa duas vírgulas no mesmo número", () => {
    expect(digitar(["1", ",", "5", ","]).expressao).toBe("1,5");
  });
  it("depois do =, um número começa conta nova e um operador continua do resultado", () => {
    expect(digitar(["2", "+", "2", "=", "7"]).expressao).toBe("7");
    expect(digitar(["2", "+", "2", "=", "×", "3", "="]).resultado).toBe(12);
  });
  it("apagar tira o último caractere e C limpa tudo", () => {
    expect(digitar(["1", "2", "3", "⌫"]).expressao).toBe("12");
    expect(digitar(["1", "+", "2", "C"])).toEqual(estadoInicial());
  });
});

describe("formatarNumero", () => {
  it("formata no padrão brasileiro sem casas inúteis", () => {
    expect(formatarNumero(1234.5)).toBe("1.234,5");
    expect(formatarNumero(42)).toBe("42");
    expect(formatarNumero(-0.25)).toBe("−0,25");
  });
});

describe("calculadora de horas", () => {
  it("lê os jeitos comuns de escrever duração (em minutos)", () => {
    expect(lerDuracao("2:30")).toBe(150);
    expect(lerDuracao("2h30")).toBe(150);
    expect(lerDuracao("2h")).toBe(120);
    expect(lerDuracao("45m")).toBe(45);
    expect(lerDuracao("1h 5min")).toBe(65);
    expect(lerDuracao("1,5")).toBe(90);
    expect(lerDuracao("0:07")).toBe(7);
    expect(lerDuracao("100:00")).toBe(6000);
  });
  it("recusa o que não é duração", () => {
    expect(lerDuracao("")).toBeNull();
    expect(lerDuracao("abc")).toBeNull();
    expect(lerDuracao("2:75")).toBeNull();
  });
  it("mostra o total em horas e minutos, inclusive acima de 24h e negativo", () => {
    expect(formatarDuracao(150)).toBe("2:30");
    expect(formatarDuracao(6000)).toBe("100:00");
    expect(formatarDuracao(5)).toBe("0:05");
    expect(formatarDuracao(-90)).toBe("−1:30");
  });
  it("mostra o total em horas decimais", () => {
    expect(formatarHorasDecimais(150)).toBe("2,5 h");
    expect(formatarHorasDecimais(20)).toBe("0,33 h");
  });
});
