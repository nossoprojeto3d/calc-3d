/* Configurações da loja (padrões da calculadora e assinatura do orçamento) + tema e instalação. */
import { useEffect, useRef, useState } from "react";
import { DownloadSimple, ImageSquare, Monitor, Moon, Sun, Trash } from "@phosphor-icons/react";
import { readLogoFile } from "../lib/storage";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // o logo é salvo na hora (não espera o "Salvar"), como uma foto de perfil
  const onLogo = async (file: File | undefined) => {
    setLogoError(null);
    if (!file) return;
    try {
      const dataUrl = await readLogoFile(file);
      if (!calc.updateStoreLogo(dataUrl)) setLogoError("Não coube no armazenamento do aparelho. Tente uma imagem menor.");
    } catch {
      setLogoError("Não foi possível ler essa imagem. Use PNG ou JPG.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

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
            <InputField id="settingsValidityDays" kind="numeric" label="Validade do orçamento" suffix="dias" placeholder="7"
              value={draft.validityDays} onChange={(x) => set("validityDays", x.replace(/[^\d]/g, "").slice(0, 3))}
              hint="Vai no orçamento do cliente. Vazio = sem validade." />
          </div>
          <label className="flex min-h-[52px] cursor-pointer items-center gap-3">
            <span className="flex-1 text-[15px]">{draft.roundDefault ? "Arredondar para ,99 acima" : "Sem arredondamento"}</span>
            <Switch checked={draft.roundDefault !== false} onChange={(v) => set("roundDefault", v)} label="Arredondar para ,99" />
          </label>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-[15px] font-semibold">Sua loja no orçamento</h3>
            <p className="hint mt-1">Aparece no orçamento do WhatsApp e do PDF. O logo vai no PDF do cliente.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
              {calc.storeLogo
                ? <img src={calc.storeLogo} alt="Logo da sua loja" className="max-h-full max-w-full object-contain p-1.5" />
                : <ImageSquare size={24} className="text-ink-3" aria-hidden="true" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span className="text-[15px] font-medium">Logo da loja</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary min-h-[40px] px-4 text-[14px]" onClick={() => fileRef.current?.click()}>
                  {calc.storeLogo ? "Trocar" : "Enviar imagem"}
                </button>
                {calc.storeLogo && (
                  <button type="button" className="icon-btn hover:text-danger" aria-label="Remover logo" onClick={() => calc.updateStoreLogo(null)}>
                    <Trash size={18} />
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Escolher logo da loja"
                onChange={(e) => onLogo(e.target.files?.[0])} />
            </div>
          </div>
          {logoError && <p className="error-text" role="alert">{logoError}</p>}
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
