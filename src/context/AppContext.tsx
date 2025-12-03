import React, { createContext, useContext, useState, useEffect } from "react";

// Tipos
export interface StoreInfo {
  id?: string;
  name: string;
  address?: string;
  logo?: string;
}

// Importações Firebase
import {
  getStores,
  addStore,
  updateStore,
  deleteStore
} from "../firebase/firebase-stores";

import {
  getIngredients,
  saveIngredient as addIngredientFB,
  updateIngredientFB,
  deleteIngredientFB
} from "../firebase/firebase-ingredients";

import {
  getProducts,
  saveProduct as addProductFB,
  updateProductFB,
  deleteProductFB
} from "../firebase/firebase-products";

interface AppContextType {
  stores: StoreInfo[];
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string) => void;

  // lojas
  addLoja: (data: StoreInfo) => void;
  updateLoja: (id: string, data: Partial<StoreInfo>) => void;
  deleteLoja: (id: string) => void;

  // ingredients
  ingredients: any[];
  getIngredientRealCost: (i: any) => number;

  // products
  products: any[];

  reloadStoreData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // ------------------------------------------------------------
  // 🔥 Carregar lojas
  // ------------------------------------------------------------
  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    const list = await getStores();
    setStores(list);
  }

  // ------------------------------------------------------------
  // 🔥 CRUD Lojas
  // ------------------------------------------------------------
  async function addLoja(data: StoreInfo) {
    const id = await addStore(data);
    if (!id) return;
    await loadStores();
  }

  async function updateLoja(id: string, data: Partial<StoreInfo>) {
    await updateStore(id, data);
    await loadStores();
  }

  async function deleteLoja(id: string) {
    await deleteStore(id);
    await loadStores();
  }

  // ------------------------------------------------------------
  // 🔥 Quando seleciona loja, carrega dados dela
  // ------------------------------------------------------------
  useEffect(() => {
    if (!selectedStoreId) return;
    reloadStoreData();
  }, [selectedStoreId]);

  async function reloadStoreData() {
    const ing = await getIngredients(selectedStoreId);
    const prod = await getProducts(selectedStoreId);

    setIngredients(ing || []);
    setProducts(prod || []);
  }

  // ------------------------------------------------------------
  // Cálculo custo real
  // ------------------------------------------------------------
  const getIngredientRealCost = (i: any) => {
    const realQty = i.packageQuantity * (1 - i.lossPercent / 100);
    return i.price / realQty;
  };

  return (
    <AppContext.Provider
      value={{
        stores,
        selectedStoreId,
        setSelectedStoreId,

        addLoja,
        updateLoja,
        deleteLoja,

        ingredients,
        getIngredientRealCost,

        products,

        reloadStoreData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
