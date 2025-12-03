// ------------------------------------------------------
// Firebase compat — usa window.db
// ------------------------------------------------------

const db = (window as any).db;

if (!db) {
  console.error("❌ Firestore não carregado!");
}

// ------------------------------------------------------
// CRUD INGREDIENTES
// ------------------------------------------------------

export async function saveIngredient(data: any) {
  return db.collection("ingredients").add(data);
}

export async function getIngredients() {
  const snap = await db.collection("ingredients").get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

export async function updateIngredientFB(id: string, data: any) {
  return db.collection("ingredients").doc(id).update(data);
}

export async function deleteIngredientFB(id: string) {
  return db.collection("ingredients").doc(id).delete();
}
