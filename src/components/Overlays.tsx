/* Avisos: toast rápido, popup de apoio (1x por semana), instruções de instalação no iPhone e banner de instalar. */
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { DeviceMobile, Export, Heart, InstagramLogo, X } from "@phosphor-icons/react";
import type { Toast } from "../lib/useCalculator";

export function QuickToast({ toast }: { toast: Toast }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState<Toast>(null);
  useEffect(() => {
    if (!toast) return;
    setVisible(toast);
    const t = setTimeout(() => setVisible(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="pointer-events-none fixed inset-x-0 flex justify-center px-4"
      style={{ bottom: "calc(var(--dock-h) + 16px + var(--safe-b))", zIndex: "var(--z-toast)" }} role="status" aria-live="polite">
      <AnimatePresence>
        {visible && (
          <m.div key={visible.at}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="max-w-[440px] rounded-2xl bg-ink px-4 py-3 text-[14px] font-medium text-bg shadow-xl">
            {visible.text}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CenterDialog({ open, onOpenChange, title, children, labelledIcon }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; labelledIcon?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay" />
        <Dialog.Content aria-describedby={undefined}
          className="bezel fixed left-1/2 top-1/2 z-[60] w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 outline-none">
          <div className="bezel-core relative px-6 pb-6 pt-7 text-center">
            <Dialog.Close className="icon-btn absolute right-2 top-2" aria-label="Fechar"><X size={18} /></Dialog.Close>
            {labelledIcon && (
              <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">{labelledIcon}</span>
            )}
            <Dialog.Title className="text-[19px] font-semibold tracking-[-0.015em]">{title}</Dialog.Title>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SupportDialog({ open, onOpenChange, instagram }: { open: boolean; onOpenChange: (o: boolean) => void; instagram: string }) {
  return (
    <CenterDialog open={open} onOpenChange={onOpenChange} title="Gostou da calculadora?" labelledIcon={<Heart size={22} weight="fill" />}>
      <p className="mx-auto mt-2 max-w-[32ch] text-[15px] leading-[1.5] text-ink-2">
        Ela é 100% gratuita, feita com carinho pra comunidade 3D. Se quiser apoiar, siga a gente no Instagram.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <a className="btn btn-primary" href={instagram} target="_blank" rel="noopener noreferrer" onClick={() => onOpenChange(false)}>
          <InstagramLogo size={19} weight="bold" aria-hidden="true" />Seguir @nossoprojeto3d
        </a>
        <button type="button" className="btn min-h-[44px] text-ink-3 hover:text-ink" onClick={() => onOpenChange(false)}>Agora não</button>
      </div>
    </CenterDialog>
  );
}

export function IosInstallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <CenterDialog open={open} onOpenChange={onOpenChange} title="Instalar na tela de início" labelledIcon={<DeviceMobile size={22} />}>
      <ol className="mt-4 flex flex-col gap-3 text-left text-[15px] text-ink-2">
        <li className="flex gap-3"><span className="num text-accent-text">1</span><span>Toque em <strong className="font-medium text-ink">compartilhar</strong> <Export size={15} className="inline align-[-2px]" aria-label="ícone de compartilhar" /> na barra do Safari.</span></li>
        <li className="flex gap-3"><span className="num text-accent-text">2</span><span>Escolha <strong className="font-medium text-ink">Adicionar à Tela de Início</strong>.</span></li>
        <li className="flex gap-3"><span className="num text-accent-text">3</span><span>Toque em <strong className="font-medium text-ink">Adicionar</strong>.</span></li>
      </ol>
      <button type="button" className="btn btn-secondary mt-6 w-full" onClick={() => onOpenChange(false)}>Entendi</button>
    </CenterDialog>
  );
}
