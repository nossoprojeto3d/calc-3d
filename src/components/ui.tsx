/* Componentes base da interface: campo, interruptor, seção, gaveta e preço animado. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Drawer } from "vaul";
import { X } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { brl } from "../lib/calc";

/** true em telas de computador (layout em duas colunas). */
export function useIsDesktop() {
  const query = "(min-width: 1024px)";
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return match;
}

// ---------------------------------------------------------
// CAMPO NUMÉRICO / TEXTO
// ---------------------------------------------------------
interface InputFieldProps {
  id: string;
  label?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  /** "decimal" (vírgula), "numeric" (inteiro) ou texto livre */
  kind?: "decimal" | "numeric" | "text" | "tel";
  hint?: ReactNode;
  error?: string | null;
  disabled?: boolean;
  ariaLabel?: string;
  autoComplete?: string;
}

export function InputField({
  id, label, value, onChange, prefix, suffix, placeholder, kind = "decimal", hint, error, disabled, ariaLabel, autoComplete = "off",
}: InputFieldProps) {
  // erro só com espaço = campo em vermelho, sem texto (a mensagem fica embaixo do par de campos)
  const errorText = error && error.trim() ? error : null;
  const describedBy = [hint ? `${id}-hint` : "", errorText ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex min-w-0 flex-col gap-2" data-field={id}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <div className="field-box" data-invalid={!!error} data-disabled={!!disabled}>
        {prefix && <span className="affix">{prefix}</span>}
        <input
          id={id}
          className={kind === "text" || kind === "tel" ? "text" : undefined}
          type="text"
          inputMode={kind === "decimal" ? "decimal" : kind === "numeric" ? "numeric" : kind === "tel" ? "tel" : "text"}
          autoComplete={autoComplete}
          enterKeyHint="next"
          value={kind === "decimal" ? value.replace(".", ",") : value}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
      {errorText && <p id={`${id}-error`} className="error-text" role="alert">{errorText}</p>}
      {hint && !error && <p id={`${id}-hint`} className="hint">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------
// INTERRUPTOR
// ---------------------------------------------------------
export function Switch({ id, checked, onChange, label }: { id?: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <SwitchPrimitive.Root id={id} className="switch-root" checked={checked} onCheckedChange={onChange} aria-label={label}>
      <SwitchPrimitive.Thumb className="switch-thumb" />
    </SwitchPrimitive.Root>
  );
}

// ---------------------------------------------------------
// SEÇÃO DO FORMULÁRIO (cartão com moldura dupla)
// ---------------------------------------------------------
export function Section({ id, icon, title, aside, children, tone }: {
  id?: string; icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode; tone?: "pro";
}) {
  return (
    <section id={id} className="bezel" aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="bezel-core px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <header className="mb-4 flex items-center gap-3">
          <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${tone === "pro" ? "bg-accent-soft text-accent-text" : "bg-surface-2 text-ink-2"}`}
            style={{ boxShadow: "inset 0 0 0 1px var(--line)" }} aria-hidden="true">
            {icon}
          </span>
          <h2 id={id ? `${id}-title` : undefined} className="flex-1 text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
          {aside}
        </header>
        <div className="flex flex-col gap-5">{children}</div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------
// GAVETA: de baixo no celular, da direita no computador
// ---------------------------------------------------------
export function Sheet({ open, onOpenChange, title, description, children, footer }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  const desktop = useIsDesktop();
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={desktop ? "right" : "bottom"} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-overlay" />
        <Drawer.Content className={`sheet-content ${desktop ? "sheet-right" : "sheet-bottom"}`} aria-describedby={undefined}>
          {!desktop && <div className="sheet-handle" aria-hidden="true" />}
          <div className="flex items-start gap-3 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
            <div className="min-w-0 flex-1">
              <Drawer.Title className="text-[19px] font-semibold tracking-[-0.015em]">{title}</Drawer.Title>
              {description && <Drawer.Description className="hint mt-1">{description}</Drawer.Description>}
            </div>
            <Drawer.Close className="icon-btn -mr-2 -mt-1" aria-label="Fechar">
              <X size={20} />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6" data-vaul-no-drag={desktop || undefined}>
            {children}
          </div>
          {footer && (
            <div className="border-t border-line px-5 py-3 sm:px-6" style={{ paddingBottom: "max(12px, var(--safe-b))" }}>
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ---------------------------------------------------------
// PREÇO ANIMADO (conta até o valor novo)
// ---------------------------------------------------------
export function AnimatedPrice({ value, className, id }: { value: number; className?: string; id?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = prev.current;
    prev.current = value;
    if (reduce || from === value) { node.textContent = brl(value); return; }
    // conta até o valor novo (curva que desacelera no fim); só mexe no texto
    const start = performance.now();
    const duration = 550;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      node.textContent = brl(t < 1 ? from + (value - from) * eased : value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); node.textContent = brl(value); };
  }, [value, reduce]);

  return <span ref={ref} id={id} className={className} data-value={value}>{brl(value)}</span>;
}
