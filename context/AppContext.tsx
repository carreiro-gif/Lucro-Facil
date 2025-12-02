import React, { createContext, useContext, useState, useEffect } from "react";
import { GlobalState, Ingredient } from "../types";
import {
  listenIngredients,
  addIngredientFB,
  updateIngredientFB,
  deleteIngredientFB,
} from "../firebase/firebase-ingredients";
import { EMPTY_STATE } from "../constants";

// ------------------------------------------------------
// CONTEXTO
// ------------------------------------------------------

interface AppContextType {
  ingredients: Ingredient[];
  addIngredient: (data: Ingredient) => void;
  updateIngredient: (id: string, data: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  getIngredientRealCost: (ing: Ingredient) => number;
  state: GlobalState;
  setState: React.Dispatch<React.SetStateAction<GlobalState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
};

// ------------------------------------------------------
// PROVIDER
// ------------------------------------------------------

interface Props {
  children: React.ReactNode;
  storeId: string;
  initialData: GlobalState;
  onStateChange: (data: GlobalState) => void;
}

export const AppProvider: React.FC<Props> = ({
  children,
  storeId,
  initialData,
  onStateChange,
}) => {
  const [state, setState] = useState<GlobalState>(initialData);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // ------------------------------------------------------------------
  // 🔥 INTEGRAÇÃO FIRESTORE — LISTENER EM TEMPO REAL (INGREDIENTS)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!storeId) return;

    console.log("📡 Escutando ingredientes da loja:", storeId);

    const unsub = listenIngredients(storeId, (items) => {
      console.log("🔥 Ingredientes recebidos do Firestore:", items);
      setIngredients(items);
      setState((prev) => ({ ...prev, ingredients: items }));
    });

    return () => unsub();
  }, [storeId]);

  // ------------------------------------------------------------------
  // 🔥 CRUD no Firestore
  // ------------------------------------------------------------------
  const addIngredient = async (data: Ingredient) => {
    console.log("➕ Adicionando ingrediente:", data);
    await addIngredientFB(storeId, data);
  };

  const updateIngredient = async (id: string, data: Partial<Ingredient>) => {
    console.log("✏ Atualizando ingrediente:", id, data);
    await updateIngredientFB(storeId, id, data);
  };

  const deleteIngredient = async (id: string) => {
    console.log("🗑 Removendo ingrediente:", id);
    await deleteIngredientFB(storeId, id);
  };

  // ------------------------------------------------------------------
  // Função auxiliar — cálculo do custo real
  // ------------------------------------------------------------------
  const getIngredientRealCost = (ing: Ingredient) => {
    const realQty = ing.packageQuantity * (1 - ing.lossPercent / 100);
    return ing.price / realQty;
  };

  // ------------------------------------------------------------------
  // ATUALIZAÇÕES GERAIS DE ESTADO
  // ------------------------------------------------------------------
  useEffect(() => {
    onStateChange(state);
  }, [state]);

  return (
    <AppContext.Provider
      value={{
        ingredients,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        getIngredientRealCost,
        state,
        setState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
