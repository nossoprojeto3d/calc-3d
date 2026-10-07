/* =========================================================
   ARMAZENAMENTO NO APARELHO (localStorage)
   Mesmas chaves da V3: quem já usa mantém orçamentos, configurações,
   tema e modo. Nada vai para servidor.
   ========================================================= */

import { defaultStoreSettings, formatPrintTime, type CalcResult, type Mode, type StoreSettings } from "./calc";
import type { SavedFormState } from "./form";

export const KEYS = {
  settings: "np3d_store_settings",
  mode: "np3d_mode",
  theme: "np3d_theme",
  customPrinter: "np3d_custom_printer",
  history: "np3d_history",
  installDismissed: "np3d_install_banner_dismissed",
  freePopup: "np3d_free_popup_last_shown",
  legacyDraft: "np3d_draft",
  storeLogo: "np3d_store_logo",
  exportMode: "np3d_export_mode",
} as const;

export function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* armazenamento cheio ou bloqueado */ }
}
export function remove(key: string) {
  try { localStorage.removeItem(key); } catch { /* sem problema */ }
}
function readJson<T>(key: string): T | null {
  try { return JSON.parse(read(key) || "null"); } catch { return null; }
}

export function loadStoreSettings(): StoreSettings {
  return { ...defaultStoreSettings(), ...(readJson<Partial<StoreSettings>>(KEYS.settings) || {}) };
}
export function saveStoreSettings(s: StoreSettings) { write(KEYS.settings, JSON.stringify(s)); }

export function loadMode(): Mode { return read(KEYS.mode) === "profissional" ? "profissional" : "basico"; }

export function loadCustomPrinter(): { power?: string; price?: string } {
  return readJson(KEYS.customPrinter) || {};
}
export function saveCustomPrinter(power: string, price: string) {
  write(KEYS.customPrinter, JSON.stringify({ power: power.trim(), price: price.trim() }));
}

// ---------------------------------------------------------
// LOGO DA LOJA (vai no PDF do cliente). Fica só no aparelho, como imagem
// reduzida (no máximo 480px) pra não pesar no armazenamento.
// ---------------------------------------------------------
export const loadStoreLogo = () => read(KEYS.storeLogo);
export function saveStoreLogo(dataUrl: string | null) {
  if (dataUrl) write(KEYS.storeLogo, dataUrl); else remove(KEYS.storeLogo);
}

export function readLogoFile(file: File, maxSide = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) { reject(new Error("Não é uma imagem.")); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler a imagem.")); };
    img.src = url;
  });
}

// ---------------------------------------------------------
// MEUS ORÇAMENTOS (até 60, mais recente primeiro)
// ---------------------------------------------------------
export const HISTORY_LIMIT = 60;

export interface SavedBudget {
  id: string;
  savedAt: number;
  name: string;
  price: number;
  printerName: string;
  materialName: string;
  time: string;
  grams: number;
  proMode: boolean;
  /** nome do cliente, se informado */
  client?: string;
  state: SavedFormState;
}

export function loadHistory(): SavedBudget[] {
  const list = readJson<SavedBudget[]>(KEYS.history);
  return Array.isArray(list) ? list : [];
}
export function storeHistory(list: SavedBudget[]) {
  write(KEYS.history, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
}

export const newBudgetId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function budgetEntry(id: string, r: CalcResult, state: SavedFormState): SavedBudget {
  return {
    id,
    savedAt: Date.now(),
    name: r.jobName,
    price: r.finalPrice,
    printerName: r.printerName,
    materialName: r.materialName,
    time: formatPrintTime(r.hours, r.minutes),
    grams: r.grams,
    proMode: r.proMode,
    client: String(state.values.clientName ?? "").trim() || undefined,
    state,
  };
}

/** "hoje, 14:32" ou "03 out" */
export function formatSavedDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? `hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

/** Evento de uso (medicao.js). Nunca envia preços nem textos digitados. */
export function track(event: string, params?: Record<string, string | number | boolean>) {
  const w = window as unknown as { np3dTrack?: (e: string, p?: object) => void };
  if (w.np3dTrack) w.np3dTrack(event, params);
}
