import type { Expense } from '../types';

/**
 * Determina a competência (mês efetivo no formato YYYY-MM) de uma despesa.
 * 
 * Regra Única de Competência (ETAPA 2.8):
 * - PRIORIDADE 1: Se existir dueDate válido, utiliza dueDate.slice(0, 7).
 * - PRIORIDADE 2: Se não existir dueDate válido, mas existir month válido, utiliza month.
 * - PRIORIDADE 3: Se nenhum dos dois existir, retorna null.
 * 
 * Não utiliza fallbacks de mês atual, mês anterior, criação, média ou estimativa.
 */
export const getExpenseEffectiveMonth = (
  e: Partial<Expense> | null | undefined
): string | null => {
  if (!e) return null;

  // PRIORIDADE 1: Se existir dueDate válido
  if (e.dueDate && typeof e.dueDate === 'string' && e.dueDate.trim().length >= 7) {
    const candidate = e.dueDate.trim().slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(candidate)) {
      return candidate;
    }
  }

  // PRIORIDADE 2: Se não existir dueDate válido, mas existir month válido
  if (e.month && typeof e.month === 'string' && e.month.trim().length >= 7) {
    const candidate = e.month.trim().slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(candidate)) {
      return candidate;
    }
  }

  // PRIORIDADE 3: Se nenhum dos dois existir
  return null;
};
