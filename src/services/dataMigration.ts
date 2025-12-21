// src/services/dataMigration.ts

import { INITIAL_STATE, EMPTY_STATE } from '../constants';
import { GlobalState } from '../types';

const CURRENT_DATA_VERSION = '3.0';

export interface VersionedData {
  version: string;
  data: Record<string, GlobalState>;
}

export function migrateStoredData(raw: any): VersionedData {
  // Caso não exista nada salvo
  if (!raw) {
    return {
      version: CURRENT_DATA_VERSION,
      data: {}
    };
  }

  // Caso seja estrutura ANTIGA (sem versionamento)
  if (!raw.version || !raw.data) {
    return {
      version: CURRENT_DATA_VERSION,
      data: sanitizeStoresData(raw)
    };
  }

  // Se já está na versão atual
  if (raw.version === CURRENT_DATA_VERSION) {
    return raw;
  }

  // 🔄 FUTURAS MIGRAÇÕES FICAM AQUI
  let migratedData = raw.data;

  // Exemplo de migração futura (comentado)
  /*
  if (raw.version === '3.0') {
    Object.values(migratedData).forEach(store => {
      store.novoCampo ??= valorPadrao;
    });
    raw.version = '3.1';
  }
  */

  return {
    version: CURRENT_DATA_VERSION,
    data: migratedData
  };
}

function sanitizeStoresData(data: Record<string, GlobalState>) {
  const sanitized: Record<string, GlobalState> = {};

  Object.entries(data).forEach(([storeId, store]) => {
    sanitized[storeId] = {
      ...INITIAL_STATE,
      ...store,
      storeInfo: store.storeInfo ?? EMPTY_STATE.storeInfo
    };
  });

  return sanitized;
}
