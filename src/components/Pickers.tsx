/* Seletores de impressora (gaveta com busca, agrupada por marca) e de filamento (chips). */
import { useMemo, useState } from "react";
import { CaretDown, Check, MagnifyingGlass } from "@phosphor-icons/react";
import { CUSTOM_PRINTER_ID, MATERIALS, PRINTERS } from "../lib/data";
import { brl } from "../lib/calc";
import { Sheet } from "./ui";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function PrinterPicker({ value, customPower, onChange }: {
  value: string; customPower: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = PRINTERS.find((p) => p.id === value);

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const list = q ? PRINTERS.filter((p) => normalize(`${p.name} ${p.desc}`).includes(q)) : PRINTERS;
    const brands = [...new Set(list.map((p) => p.brand))];
    return brands.map((brand) => ({ brand, items: list.filter((p) => p.brand === brand) }));
  }, [query]);

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="label" id="printerSelect-label">Impressora</span>
      <button
        id="printerSelect"
        type="button"
        className="field-box w-full text-left"
        aria-haspopup="dialog"
        aria-labelledby="printerSelect-label printerSelect"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 flex-1 flex-col py-2">
          <span className="truncate text-[16px] font-medium">
            {value === CUSTOM_PRINTER_ID ? "Outra impressora" : selected?.name}
          </span>
          <span className="truncate text-[13px] text-ink-3">
            {value === CUSTOM_PRINTER_ID
              ? (Number(customPower) > 0 ? `${customPower}W · informada por você` : "Informe a potência abaixo")
              : selected?.desc}
          </span>
        </span>
        <CaretDown size={18} className="shrink-0 text-ink-3" aria-hidden="true" />
      </button>

      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }} title="Escolha a impressora"
        description="A potência entra no cálculo da energia.">
        <div className="sticky top-0 z-10 -mx-1 bg-surface px-1 pb-3">
          <label className="field-box">
            <MagnifyingGlass size={18} className="text-ink-3" aria-hidden="true" />
            <input
              className="text"
              type="search"
              inputMode="search"
              placeholder="Buscar modelo ou marca"
              aria-label="Buscar impressora"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.brand}>
              <p className="mb-1.5 px-1 text-[13px] font-medium text-ink-3">{g.brand}</p>
              <ul className="overflow-hidden rounded-2xl bg-surface-2" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
                {g.items.map((p, i) => (
                  <li key={p.id} className={i ? "border-t border-line" : undefined}>
                    <button type="button" onClick={() => choose(p.id)} aria-pressed={p.id === value}
                      className="flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15.5px] font-medium">{p.name.replace(`${p.brand} `, "")}</span>
                        <span className="block truncate text-[13px] text-ink-3">{p.desc.replace(/^\d+W · /, "")}</span>
                      </span>
                      <span className="num shrink-0 text-[13px] text-ink-2">{p.power}W</span>
                      <span className="flex size-5 shrink-0 items-center justify-center text-accent-text" aria-hidden="true">
                        {p.id === value && <Check size={18} weight="bold" />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!groups.length && <p className="hint px-1">Nenhuma impressora com “{query}”. Use “Outra impressora” abaixo.</p>}
          <button type="button" onClick={() => choose(CUSTOM_PRINTER_ID)} aria-pressed={value === CUSTOM_PRINTER_ID}
            className="flex min-h-[56px] items-center gap-3 rounded-2xl px-4 text-left transition-colors hover:bg-surface-3"
            style={{ boxShadow: "inset 0 0 0 1px var(--line-strong)" }}>
            <span className="flex-1">
              <span className="block text-[15.5px] font-medium">Outra impressora</span>
              <span className="block text-[13px] text-ink-3">Você informa a potência em watts</span>
            </span>
            {value === CUSTOM_PRINTER_ID && <Check size={18} weight="bold" className="text-accent-text" />}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

export function MaterialPicker({ value, onChange, error }: { value: string; onChange: (id: string) => void; error?: string | null }) {
  const groups = [...new Set(MATERIALS.map((m) => m.group))];
  return (
    <fieldset className="flex flex-col gap-2" id="materialSelect" tabIndex={-1} aria-describedby={error ? "materialSelect-error" : undefined}>
      <legend className="label mb-2">Tipo</legend>
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group} className="flex flex-wrap gap-2" role="group" aria-label={group}>
            {MATERIALS.filter((m) => m.group === group).map((m) => (
              <button key={m.id} type="button" className="chip" aria-pressed={m.id === value} onClick={() => onChange(m.id)}>
                <span>{m.id === "outro" ? "Outro" : m.name.replace(" (fibra de carbono)", "").replace(" (policarbonato)", "")}</span>
                {m.pricePerKg !== null && (
                  <span className="num text-[12px] text-ink-3" aria-label={`${brl(m.pricePerKg)} o kg`}>{m.pricePerKg.toFixed(2).replace(".", ",")}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
      {error && <p id="materialSelect-error" className="error-text" role="alert">{error}</p>}
    </fieldset>
  );
}
