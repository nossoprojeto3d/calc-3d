/* Configurações da loja (padrões da calculadora e assinatura do orçamento) + tema e instalação. */
import { useEffect, useState } from "react";
import { DownloadSimple, Monitor, Moon, Sun } from "@phosphor-icons/react";
import { PRINTERS } from "../lib/data";
import { defaultStoreSettings, sanitizeDecimal, type StoreSettings } from "../lib/calc";
import type { Calculator } from "../lib/useCalculator";
import { InputField, Sheet, Switch } from "./ui";
import type { Theme } from "../App";

export function SettingsSheet({ calc, open, onOpenChange, theme, onTheme, canInstall, onInstall }: {
  calc: Calculator; open: boolean; onOpenChange: (o: boolean) => void;
  theme: Theme; onTheme: (t: Theme) => void; canInstall: boolean; onInstall: () => void;
}) {
  const [draft, setDraft] = useState<StoreSettings>(calc.settings);
  useEffect(() => { if (open) setDraft(calc.settings); }, [open, calc.settings]);

  const set = (key: keyof StoreSettings, value: string | boolean) => setDraft((d) => ({ ...d, [key]: value }));
  const dec = (key: keyof StoreSettings) => (v: string) => set(key, sanitizeDecimal(v));

  const save = () => {
    const trimmed = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) as unknown as StoreSettings;
    calc.updateSettings(trimmed);
    onOpenChange(false);
    calc.showToast("Configurações salvas.");
  };
  const reset = () => {
    calc.updateSettings(null);
    setDraft(defaultStoreSettings());
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Configurações"
      description="Preencha uma vez e a calculadora já abre com seus padrões."
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary min-h-[48px]" onClick={reset}>Restaurar padrão</button>
          <button type="button" className="btn btn-primary min-h-[48px]" onClick={save}>Salvar</button>
        </div>
      }>
      <div className="flex flex-col gap-7">
        <section className="flex flex-col gap-3">
          <h3 className="text-[15px] font-semibold">Aparência</h3>
          <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}
            role="radiogroup" aria-label="Tema">
            {([["system", "Sistema", Monitor], ["light", "Claro", Sun], ["dark", "Escuro", Moon]] as const).map(([t, label, Icon]) => (
              <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => onTheme(t)}
                className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full text-[14px] font-medium transition-colors ${theme === t ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}>
                <Icon size={16} aria-hidden="true" />{label}
              </button>
            ))}
          </div>
          {canInstall && (
            <button type="button" onClick={onInstall}
              className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-surface-2 px-4 text-left hover:bg-surface-3"
              style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
              <DownloadSimple size={20} className="text-accent-text" aria-hidden="true" />
              <span className="flex-1 text-[15px] font-medium">Instalar como app</span>
            </button>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[15px] font-semibold">Padrões da calculadora</h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="settingsDefaultPrinter" className="label">Impressora padrão</label>
            <div className="field-box">
              <select id="settingsDefaultPrinter" value={draft.defaultPrinter} onChange={(e) => set("defaultPrinter", e.target.value)}
                className="h-[50px] w-full flex-1 appearance-none bg-transparent text-ink outline-none">
                <option value="">Nenhuma preferência</option>
                {[...new Set(PRINTERS.map((p) => p.brand))].map((brand) => (
                  <optgroup key={brand} label={brand}>
                    {PRINTERS.filter((p) => p.brand === brand).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField id="settingsKwh" label="Valor do kWh" prefix="R$" placeholder="0,85" value={draft.kwhPrice} onChange={dec("kwhPrice")} />
            <InputField id="settingsMarginPct" label="Margem de lucro" suffix="%" placeholder="100" value={draft.marginPct} onChange={dec("marginPct")} />
            <InputField id="settingsHourlyRate" label="Seu valor-hora" prefix="R$" placeholder="25,00" value={draft.hourlyRate} onChange={dec("hourlyRate")}
              hint="Calcula a mão de obra." />
            <InputField id="settingsFailurePct" label="Margem de falha" suffix="%" placeholder="10" value={draft.failurePct} onChange={dec("failurePct")}
              hint="Quando ligada no Profissional." />
          </div>
          <label className="flex min-h-[52px] cursor-pointer items-center gap-3">
            <span className="flex-1 text-[15px]">{draft.roundDefault ? "Arredondar para ,99 acima" : "Sem arredondamento"}</span>
            <Switch checked={draft.roundDefault !== false} onChange={(v) => set("roundDefault", v)} label="Arredondar para ,99" />
          </label>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-[15px] font-semibold">Sua loja no orçamento</h3>
            <p className="hint mt-1">Aparece no fim do orçamento do WhatsApp e do PDF.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputField id="settingsStoreName" kind="text" label="Nome da loja" placeholder="Ex: Ateliê Camadas" value={draft.storeName} onChange={(v) => set("storeName", v)} />
            <InputField id="settingsCity" kind="text" label="Cidade" placeholder="Ex: Goiânia/GO" value={draft.city} onChange={(v) => set("city", v)} />
            <InputField id="settingsWhatsapp" kind="tel" label="WhatsApp" placeholder="(62) 99999-0000" value={draft.whatsapp} onChange={(v) => set("whatsapp", v)} />
            <InputField id="settingsInstagram" kind="text" label="Instagram" placeholder="@sualoja3d" value={draft.instagram} onChange={(v) => set("instagram", v)} />
          </div>
        </section>
      </div>
    </Sheet>
  );
}
