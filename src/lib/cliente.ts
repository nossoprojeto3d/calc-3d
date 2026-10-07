/* =========================================================
   ORÇAMENTO PARA O CLIENTE
   Versão que a pessoa manda direto pro cliente: só o preço final e o que
   interessa pra quem compra (peça, material, prazo, validade, observações),
   com a assinatura da loja. Nunca mostra custos, lucro, taxas ou valor-hora.
   A versão completa (calc.ts → buildWhatsAppText) continua igual à V3.
   ========================================================= */

import { brl, buildStoreSignatureLine, type CalcResult, type FormValues, type StoreSettings } from "./calc";

export interface ClientDetails {
  clientName: string;
  deliveryTime: string;
  /** data até quando o orçamento vale (null = sem validade) */
  validUntil: Date | null;
  notes: string;
}

export function getClientDetails(v: FormValues, calculatedAt: Date): ClientDetails {
  const days = parseInt(String(v.validityDays ?? ""), 10);
  const validUntil = days > 0 ? new Date(calculatedAt.getTime() + days * 86400000) : null;
  return {
    clientName: String(v.clientName ?? "").trim(),
    deliveryTime: String(v.deliveryTime ?? "").trim(),
    validUntil,
    notes: String(v.notes ?? "").trim(),
  };
}

export const formatDate = (d: Date) => d.toLocaleDateString("pt-BR");

/** A loja já tem nome ou logo pra assinar o orçamento? */
export const hasStoreBranding = (s: StoreSettings, logo: string | null) => !!(s.storeName.trim() || logo);

export function buildClientWhatsAppText(r: CalcResult, d: ClientDetails, settings: StoreSettings) {
  const lines = [
    d.clientName ? `Olá, ${d.clientName}! Segue o orçamento 😊` : `Olá! Segue o orçamento 😊`,
    ``,
    `🧾 *${r.jobName}*`,
    `🧵 Material: ${r.materialName}`,
  ];
  if (d.deliveryTime) lines.push(`📅 Prazo: ${d.deliveryTime}`);
  lines.push(``, `💰 *Valor: ${brl(r.finalPrice)}*`);
  if (d.validUntil) lines.push(`⏳ Válido até ${formatDate(d.validUntil)}`);
  if (d.notes) lines.push(``, `📝 ${d.notes}`);

  const signature = buildStoreSignatureLine(settings);
  if (signature) lines.push(``, signature);
  return lines.join("\n");
}

/** api.whatsapp.com direto (não wa.me): o redirecionamento do wa.me troca os emojis por "�". */
export const clientWhatsAppHref = (r: CalcResult, d: ClientDetails, settings: StoreSettings) =>
  `https://api.whatsapp.com/send?text=${encodeURIComponent(buildClientWhatsAppText(r, d, settings))}`;
