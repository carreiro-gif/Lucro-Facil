// src/firebase/firebase-ingredients.ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Ingredient } from "../types";

// Caminho: stores/{storeId}/ingredients
export const getIngredientsRef = (storeId: string) =>
  collection(db, "stores", storeId, "ingredients");

export const listenIngredients = (
  storeId: string,
  callback: (data: Ingredient[]) => void
) => {
  return onSnapshot(getIngredientsRef(storeId), (snapshot) => {
    const list: Ingredient[] = [];
    snapshot.forEach((doc) =>
      list.push({ ...(doc.data() as Ingredient), id: doc.id })
    );
    callback(list);
  });
};

export const addIngredientFB = async (storeId: string, data: Ingredient) => {
  await addDoc(getIngredientsRef(storeId), data);
};

export const updateIngredientFB = async (
  storeId: string,
  id: string,
  data: Partial<Ingredient>
) => {
  const ref = doc(db, "stores", storeId, "ingredients", id);
  await updateDoc(ref, data);
};

export const deleteIngredientFB = async (storeId: string, id: string) => {
  const ref = doc(db, "stores", storeId, "ingredients", id);
  await deleteDoc(ref);
};
