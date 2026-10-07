/* =========================================================
   HOOK CENTRAL DA CALCULADORA
   Junta o estado do formulário (form.ts), as Configurações da loja, o
   resultado ao vivo (calc.ts) e "Meus orçamentos".
   ========================================================= */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ProCostId } from "./data";
import {
  calculate, getProgressItems, resolveDerived, validateAll, type Mode, type StoreSettings,
} from "./calc";
import { formReducer, initialFormState, type SavedFormState } from "./form";
import {
  KEYS, budgetEntry, loadCustomPrinter, loadHistory, loadMode, loadStoreSettings, newBudgetId, remove,
  saveCustomPrinter, saveStoreSettings, storeHistory, track, write, type SavedBudget,
} from "./storage";

export type Toast = { text: string; at: number } | null;

export function useCalculator() {
  const [settings, setSettings] = useState<StoreSettings>(() => loadStoreSettings());
  const [state, dispatch] = useReducer(formReducer, undefined, () =>
    initialFormState(loadStoreSettings(), loadMode(), loadCustomPrinter()));
  const [history, setHistory] = useState<SavedBudget[]>(() => loadHistory());
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const restoring = useRef(false);

  const showToast = useCallback((text: string) => setToast({ text, at: Date.now() }), []);

  // avisos vindos do reducer (ex.: taxa de marketplace desligada)
  useEffect(() => { if (state.notice) setToast(state.notice); }, [state.notice]);

  // cada abertura é um cálculo novo: limpa o rascunho das versões antigas
  useEffect(() => { remove(KEYS.legacyDraft); }, []);

  useEffect(() => { write(KEYS.mode, state.mode); }, [state.mode]);

  const { customPrinterPower, customPrinterPrice } = state.values;
  const firstPrinterSave = useRef(true);
  useEffect(() => {
    if (firstPrinterSave.current) { firstPrinterSave.current = false; return; }
    saveCustomPrinter(String(customPrinterPower ?? ""), String(customPrinterPrice ?? ""));
  }, [customPrinterPower, customPrinterPrice]);

  // valores com as taxas de marketplace resolvidas (o que a V3 mostrava nos campos)
  const resolved = useMemo(
    () => resolveDerived(state.values, state.mode, settings, state.shopeeTier, state.meliTier),
    [state.values, state.mode, settings, state.shopeeTier, state.meliTier],
  );
  const validation = useMemo(() => validateAll(resolved, state.mode), [resolved, state.mode]);
  const result = useMemo(
    () => calculate(state.values, state.mode, settings, state.shopeeTier, state.meliTier),
    [state.values, state.mode, settings, state.shopeeTier, state.meliTier],
  );
  const progress = useMemo(() => getProgressItems(resolved, state.mode), [resolved, state.mode]);

  const captureState = useCallback((): SavedFormState => {
    const values = { ...state.values };
    delete values.proShopee;
    delete values.proMeli;
    return { mode: state.mode, values, shopeeTier: state.shopeeTier, meliTier: state.meliTier };
  }, [state]);

  // ---------------------------------------------------------
  // MEUS ORÇAMENTOS
  // ---------------------------------------------------------
  const persistHistory = useCallback((list: SavedBudget[]) => {
    storeHistory(list);
    setHistory(loadHistory());
  }, []);

  const saveBudget = useCallback(({ silent = false } = {}) => {
    if (!result) return;
    const isNew = !budgetId;
    const id = budgetId || newBudgetId();
    const entry = budgetEntry(id, result, captureState());
    const list = loadHistory();
    const index = list.findIndex((b) => b.id === id);
    if (index >= 0) list[index] = entry; else list.unshift(entry);
    persistHistory(list);
    setBudgetId(id);
    if (!silent) showToast(isNew ? "Salvo em Meus orçamentos." : "Orçamento atualizado.");
  }, [result, budgetId, captureState, persistHistory, showToast]);

  // orçamento já salvo: cada recálculo mantém o salvo atualizado
  useEffect(() => {
    if (!budgetId || !result || restoring.current) return;
    const t = setTimeout(() => saveBudget({ silent: true }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const openBudget = useCallback((id: string) => {
    const entry = loadHistory().find((b) => b.id === id);
    if (!entry) return;
    restoring.current = true;
    dispatch({ type: "restore", snapshot: entry.state, settings });
    setBudgetId(entry.id);
    setTimeout(() => { restoring.current = false; }, 0);
    showToast(`“${entry.name}” aberto. Edite à vontade.`);
  }, [settings, showToast]);

  const deleteBudget = useCallback((id: string) => {
    persistHistory(loadHistory().filter((b) => b.id !== id));
    if (budgetId === id) setBudgetId(null);
  }, [budgetId, persistHistory]);

  // "Limpar tudo" apaga na hora, mas dá pra desfazer por alguns segundos
  const [clearedBackup, setClearedBackup] = useState<{ list: SavedBudget[]; budgetId: string | null } | null>(null);
  const clearTimer = useRef<number | undefined>(undefined);
  const clearHistory = useCallback(() => {
    const list = loadHistory();
    if (!list.length) return;
    setClearedBackup({ list, budgetId });
    persistHistory([]);
    setBudgetId(null);
    window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => setClearedBackup(null), 8000);
  }, [budgetId, persistHistory]);
  const undoClearHistory = useCallback(() => {
    if (!clearedBackup) return;
    persistHistory(clearedBackup.list);
    if (clearedBackup.budgetId) setBudgetId(clearedBackup.budgetId);
    setClearedBackup(null);
    window.clearTimeout(clearTimer.current);
  }, [clearedBackup, persistHistory]);
  const forgetClearedBackup = useCallback(() => {
    setClearedBackup(null);
    window.clearTimeout(clearTimer.current);
  }, []);

  // ---------------------------------------------------------
  // AÇÕES
  // ---------------------------------------------------------
  const set = useCallback((id: string, value: string | boolean) => dispatch({ type: "set", id, value }), []);
  const toggle = useCallback((cost: ProCostId, on: boolean) => dispatch({ type: "toggle", cost, on, settings }), [settings]);
  const setMode = useCallback((mode: Mode) => {
    dispatch({ type: "mode", mode });
    track("modo_alterado", { modo: mode });
  }, []);

  /** Clique em "Calcular": mostra os erros e devolve o primeiro campo com problema. */
  const submit = useCallback(() => {
    const ids = [...validation.invalid];
    if (validation.printTimeZero) ids.push("printTime");
    if (validation.marginInvalid) ids.push("margin");
    dispatch({ type: "showErrors", ids });
    if (!validation.first) track("calculo_feito", { modo: state.mode });
    return validation.first;
  }, [validation, state.mode]);

  const clearAll = useCallback(() => {
    setBudgetId(null);
    dispatch({ type: "clear", settings });
  }, [settings]);

  const fillExample = useCallback(() => {
    setBudgetId(null);
    dispatch({ type: "example", settings });
    track("exemplo_usado");
    showToast("Exemplo preenchido. Troque pelos dados da sua peça.");
  }, [settings, showToast]);

  const updateSettings = useCallback((next: StoreSettings | null) => {
    if (next) {
      saveStoreSettings(next);
      setSettings(next);
      dispatch({ type: "applySettings", settings: next, onlyIfEmpty: true });
    } else {
      remove(KEYS.settings);
      setSettings(loadStoreSettings());
    }
  }, []);

  return {
    state, resolved, validation, result, progress, settings, history, budgetId, toast, clearedBackup,
    set, toggle, setMode, submit, clearAll, fillExample, updateSettings,
    setShopeeTier: (tier: typeof state.shopeeTier) => dispatch({ type: "shopeeTier", tier }),
    setMeliTier: (tier: typeof state.meliTier) => dispatch({ type: "meliTier", tier }),
    saveBudget, openBudget, deleteBudget, clearHistory, undoClearHistory, forgetClearedBackup, showToast,
  };
}

export type Calculator = ReturnType<typeof useCalculator>;
