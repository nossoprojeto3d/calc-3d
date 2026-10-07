/* Custos do modo Profissional: cada item liga/desliga e só entra na conta se ligado. */
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { GearSix, Warning } from "@phosphor-icons/react";
import { PRO_COSTS, SHOPEE_TIER_OPTION_LABELS, type ProCost } from "../lib/data";
import {
  brl, computeAutoWearValue, computeMeliFee, computeShopeeFee, getEffectiveHourlyRate, getEffectiveShopeeTiers,
  getMeliAdTypeRate, proFieldId, proToggleId,
} from "../lib/calc";
import type { Calculator } from "../lib/useCalculator";
import { InputField, Switch } from "./ui";

export function ProCosts({ calc, onOpenSettings }: { calc: Calculator; onOpenSettings: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      {PRO_COSTS.map((cost) => <ProCostRow key={cost.id} cost={cost} calc={calc} onOpenSettings={onOpenSettings} />)}
    </div>
  );
}

function ProCostRow({ cost, calc, onOpenSettings }: { cost: ProCost; calc: Calculator; onOpenSettings: () => void }) {
  const reduce = useReducedMotion();
  const { state, resolved, toggle } = calc;
  const on = state.values[proToggleId(cost.id)] === true;
  const fieldId = proFieldId(cost.id);
  const hasError = state.errors.includes(fieldId);
  const value = String(resolved[fieldId] ?? "");

  return (
    <div className="rounded-2xl bg-surface-2 transition-shadow"
      style={{ boxShadow: on ? "inset 0 0 0 1.5px var(--accent-line)" : "inset 0 0 0 1px var(--line)" }}
      data-field={fieldId}>
      <label className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4">
        <span className="flex-1 text-[15.5px] font-medium">{cost.label}</span>
        {on && Number(value) > 0 && cost.unit !== "percent" && cost.unit !== "laborMinutes" && (
          <span className="num text-[13px] text-ink-2">{brl(Number(value))}</span>
        )}
        <Switch id={`${fieldId}Toggle`} checked={on} onChange={(v) => toggle(cost.id, v)} label={cost.label} />
      </label>
      <AnimatePresence initial={false}>
        {on && (
          <m.div
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-4 pb-4">
              <CostBody cost={cost} calc={calc} hasError={hasError} onOpenSettings={onOpenSettings} />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CostBody({ cost, calc, hasError, onOpenSettings }: { cost: ProCost; calc: Calculator; hasError: boolean; onOpenSettings: () => void }) {
  const { state, settings, set } = calc;
  const v = state.values;
  const fieldId = proFieldId(cost.id);
  const errorText = hasError ? (cost.errorText || `Informe o valor de ${cost.label.toLowerCase()}.`) : null;

  if (cost.id === "shopee") return <ShopeeBody calc={calc} error={errorText} />;
  if (cost.id === "meli") return <MeliBody calc={calc} error={errorText} />;

  let hint: React.ReactNode = cost.hint;
  if (cost.id === "wear") {
    const d = computeAutoWearValue(v);
    if (d) {
      hint = `Estimativa: R$ ${d.printer.avgPurchasePrice.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} (preço médio) ÷ ${d.printer.avgLifespanHours.toLocaleString("pt-BR")}h (vida útil) × ${d.hours}h${String(d.minutes).padStart(2, "0")} = ${brl(d.value)}. Pode editar.`;
    } else if (v.printerSelect === "custom" && !(parseFloat(String(v.customPrinterPrice)) > 0)) {
      hint = "Pra calcular sozinho, informe quanto a impressora custou (em “Outra impressora”), ou digite o valor.";
    }
  }
  if (cost.id === "labor") {
    const { rate, isDefault } = getEffectiveHourlyRate(settings);
    const minutes = parseFloat(String(v[fieldId])) || 0;
    const total = brl((rate / 60) * minutes);
    hint = isDefault ? (
      <>
        {minutes}min × {brl(rate)}/h = <strong className="font-medium text-ink-2">{total}</strong>. Usando o valor-hora padrão de {brl(rate)}, que pode estar longe da sua realidade.{" "}
        <button type="button" onClick={onOpenSettings} className="inline-flex items-center gap-1 font-medium text-accent-text underline-offset-4 hover:underline">
          <GearSix size={14} aria-hidden="true" />Configurar meu valor-hora
        </button>
      </>
    ) : (
      <>{minutes}min × {brl(rate)}/h (seu valor-hora) = <strong className="font-medium text-ink-2">{total}</strong> de mão de obra.</>
    );
  }

  const prefix = cost.unit === "currency" ? "R$" : undefined;
  const suffix = cost.unit === "percent" ? "%" : cost.unit === "laborMinutes" ? "min" : undefined;

  return (
    <>
      <InputField
        id={fieldId}
        label={cost.fieldLabel}
        ariaLabel={cost.fieldLabel ? undefined : cost.label}
        value={String(v[fieldId] ?? "")}
        onChange={(x) => set(fieldId, x)}
        prefix={prefix}
        suffix={suffix}
        placeholder={cost.placeholder}
        kind={cost.unit === "laborMinutes" ? "decimal" : "decimal"}
        error={errorText}
        hint={cost.shortcuts ? undefined : hint}
      />
      {cost.shortcuts && (
        <>
          <div className="flex flex-wrap gap-2">
            {cost.shortcuts.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={String(v[fieldId]).trim() === String(s)}
                onClick={() => set(fieldId, String(s))}>{s}%</button>
            ))}
          </div>
          <p className="hint">{hint}</p>
        </>
      )}
    </>
  );
}

/** Cartão de faixa (Shopee / Mercado Livre). */
function TierOption({ active, onClick, title, detail }: { active: boolean; onClick: () => void; title: string; detail?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all active:scale-[0.99]"
      style={{
        background: active ? "var(--accent-soft)" : "var(--surface)",
        boxShadow: active ? "inset 0 0 0 1.5px var(--accent)" : "inset 0 0 0 1px var(--line)",
      }}>
      <span className="relative flex size-[18px] shrink-0 items-center justify-center rounded-full"
        style={{ boxShadow: `inset 0 0 0 ${active ? 5 : 1.5}px ${active ? "var(--accent)" : "var(--line-strong)"}` }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium">{title}</span>
        {detail && <span className="block text-[13px] text-ink-3">{detail}</span>}
      </span>
    </button>
  );
}

function FeeSummary({ fee }: { fee: { feeValue: number; finalPrice: number } | null }) {
  if (!fee || !(fee.feeValue > 0)) return null;
  return (
    <p className="hint">
      Taxa de <strong className="num font-medium text-ink">{brl(Number(fee.feeValue.toFixed(2)))}</strong>, já embutida no preço.
    </p>
  );
}

function CustomRate({ prefix, calc, pctPlaceholder }: { prefix: "proShopee" | "proMeli"; calc: Calculator; pctPlaceholder: string }) {
  const { state, set } = calc;
  return (
    <div className="grid grid-cols-2 gap-3">
      <InputField id={`${prefix}CustomPct`} label="Comissão" suffix="%" placeholder={pctPlaceholder}
        value={String(state.values[`${prefix}CustomPct`] ?? "")} onChange={(x) => set(`${prefix}CustomPct`, x)} />
      <InputField id={`${prefix}CustomFixed`} label="Valor fixo" prefix="R$" placeholder="4,00"
        value={String(state.values[`${prefix}CustomFixed`] ?? "")} onChange={(x) => set(`${prefix}CustomFixed`, x)} />
    </div>
  );
}

function ShopeeBody({ calc, error }: { calc: Calculator; error: string | null }) {
  const { state, settings, setShopeeTier } = calc;
  const tiers = getEffectiveShopeeTiers();
  const fee = computeShopeeFee(state.values, state.mode, settings, state.shopeeTier);
  return (
    <>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Faixa de preço da Shopee">
        {tiers.map((t, i) => (
          <TierOption key={i} active={state.shopeeTier === i} onClick={() => setShopeeTier(i as 0 | 1 | 2)}
            title={SHOPEE_TIER_OPTION_LABELS[i]}
            detail={t.fixedFee > 0 ? `${t.commissionPct}% + ${brl(t.fixedFee)} fixo` : `${t.commissionPct}% de comissão`} />
        ))}
        <TierOption active={state.shopeeTier === "custom"} onClick={() => setShopeeTier("custom")} title="Personalizado" />
      </div>
      {state.shopeeTier === "custom" && <CustomRate prefix="proShopee" calc={calc} pctPlaceholder="20" />}
      {error ? <p className="error-text" role="alert">{error}</p> : <FeeSummary fee={fee} />}
      <p className="hint">Escolha a faixa em que o preço final se encaixa.</p>
    </>
  );
}

function MeliBody({ calc, error }: { calc: Calculator; error: string | null }) {
  const { state, settings, set, setMeliTier } = calc;
  const { adType, commissionPct, fixedFee } = getMeliAdTypeRate(state.values);
  const fee = computeMeliFee(state.values, state.mode, settings, state.meliTier);
  return (
    <>
      <p className="flex gap-2 rounded-xl bg-surface px-3 py-2.5 text-[13px] leading-[1.45] text-ink-2"
        style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
        <Warning size={16} className="mt-px shrink-0 text-accent-text" aria-hidden="true" />
        <span>Aproximação: não considera a categoria do produto (a comissão real varia) nem o frete grátis subsidiado acima de R$ 79. Confira no Simulador de Custos do Mercado Livre.</span>
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}
        role="radiogroup" aria-label="Tipo de anúncio">
        {(["classico", "premium"] as const).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={adType === t} onClick={() => set("proMeliAdType", t)}
            className={`min-h-[40px] rounded-full text-[14px] font-medium transition-colors ${adType === t ? "bg-surface-3 text-ink" : "text-ink-3"}`}>
            {t === "classico" ? "Clássico" : "Premium"}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Faixa de preço do Mercado Livre">
        <TierOption active={state.meliTier === "below"} onClick={() => setMeliTier("below")}
          title="Abaixo de R$ 79,00" detail={`${commissionPct}% + ${brl(fixedFee)} fixo`} />
        <TierOption active={state.meliTier === "from"} onClick={() => setMeliTier("from")}
          title="A partir de R$ 79,00" detail={`${commissionPct}% (sem custo fixo)`} />
        <TierOption active={state.meliTier === "custom"} onClick={() => setMeliTier("custom")} title="Personalizado" />
      </div>
      {state.meliTier === "custom" && <CustomRate prefix="proMeli" calc={calc} pctPlaceholder="17" />}
      {error ? <p className="error-text" role="alert">{error}</p> : <FeeSummary fee={fee} />}
    </>
  );
}
