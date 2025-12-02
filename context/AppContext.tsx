import React, { createContext, useContext, useState, useEffect } from "react";
import { GlobalState, Ingredient } from "../types";
import {
  saveIngredient as addIngredientFB,
  getIngredients,
  updateIngredientFB,
  deleteIngredientFB,
} from "../firebase/firebase-ingredients.ts";
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
  // 🔥 LISTA INGREDIENTES DO FIRESTORE (carregamento inicial)
  // ------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      console.log("📡 Buscando ingredientes no Firestore...");

      const items = await getIngredients();

      console.log("🔥 Ingredientes carregados:", items);

      setIngredients(items);
      setState((prev) => ({ ...prev, ingredients: items }));
    }

    load();
  }, [storeId]);

  // ------------------------------------------------------------------
  // 🔥 CRUD no Firestore
  // ------------------------------------------------------------------
  const addIngredient = async (data: Ingredient) => {
    console.log("➕ Adicionando ingrediente:", data);
    await addIngredientFB(data);
    const updated = await getIngredients();
    setIngredients(updated);
  };

  const updateIngredient = async (id: string, data: Partial<Ingredient>) => {
    console.log("✏ Atualizando ingrediente:", id, data);
    await updateIngredientFB(id, data);
    const updated = await getIngredients();
    setIngredients(updated);
  };

  const deleteIngredient = async (id: string) => {
    console.log("🗑 Removendo ingrediente:", id);
    await deleteIngredientFB(id);
    const updated = await getIngredients();
    setIngredients(updated);
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
