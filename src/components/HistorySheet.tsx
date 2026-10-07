/* "Meus orçamentos": lista salva no aparelho, com busca, lixinho e "Limpar tudo" (com desfazer). */
import { useState } from "react";
import { BookmarkSimple, MagnifyingGlass, Trash } from "@phosphor-icons/react";
import { brl } from "../lib/calc";
import { formatSavedDate } from "../lib/storage";
import type { Calculator } from "../lib/useCalculator";
import { Sheet } from "./ui";

export function HistorySheet({ calc, open, onOpenChange, onOpened }: {
  calc: Calculator; open: boolean; onOpenChange: (o: boolean) => void; onOpened: () => void;
}) {
  const { history, budgetId, clearedBackup } = calc;
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const items = q
    ? history.filter((b) => [b.name, b.materialName, b.printerName].join(" ").toLowerCase().includes(q))
    : history;

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) { setQuery(""); calc.forgetClearedBackup(); }
  };

  return (
    <Sheet open={open} onOpenChange={close} title="Meus orçamentos" description="Salvos só neste aparelho."
      footer={history.length ? (
        <button type="button" onClick={calc.clearHistory}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 text-[14.5px] font-medium text-danger hover:bg-danger-soft">
          <Trash size={17} aria-hidden="true" />Limpar tudo
        </button>
      ) : undefined}>
      {history.length >= 5 && (
        <label className="field-box mb-4">
          <MagnifyingGlass size={18} className="text-ink-3" aria-hidden="true" />
          <input className="text" type="search" placeholder="Buscar orçamento" aria-label="Buscar orçamento"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      )}

      {!history.length && clearedBackup ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <p className="font-medium">Tudo apagado</p>
          <p className="hint">{clearedBackup.list.length} orçamento{clearedBackup.list.length > 1 ? "s" : ""} removido{clearedBackup.list.length > 1 ? "s" : ""}.</p>
          <button type="button" className="btn btn-secondary min-h-[44px]" onClick={calc.undoClearHistory}>Desfazer</button>
        </div>
      ) : !history.length ? (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
            <BookmarkSimple size={22} aria-hidden="true" />
          </span>
          <p className="font-medium">Nenhum orçamento salvo ainda</p>
          <p className="hint max-w-[34ch]">Depois de calcular, toque em Salvar. Ao enviar pelo WhatsApp, copiar ou gerar o PDF, ele também é salvo aqui.</p>
        </div>
      ) : !items.length ? (
        <p className="hint px-1 py-6">Nada encontrado pra “{query}”.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((b) => (
            <li key={b.id} className="flex items-stretch gap-1 rounded-2xl bg-surface-2"
              style={{ boxShadow: b.id === budgetId ? "inset 0 0 0 1.5px var(--accent)" : "inset 0 0 0 1px var(--line)" }}>
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pl-4 pr-2 text-left hover:bg-surface-3"
                onClick={() => { calc.openBudget(b.id); close(false); onOpened(); }}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15.5px] font-medium">{b.name}</span>
                  <span className="block truncate text-[13px] text-ink-3">
                    {b.materialName} · {b.time} · {Number(b.grams).toLocaleString("pt-BR")} g · {formatSavedDate(b.savedAt)}
                  </span>
                </span>
                <span className="num shrink-0 text-[15px] font-medium">{brl(Number(b.price) || 0)}</span>
              </button>
              <button type="button" className="icon-btn my-auto mr-1 shrink-0 hover:text-danger" aria-label={`Excluir ${b.name}`}
                onClick={() => calc.deleteBudget(b.id)}>
                <Trash size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
