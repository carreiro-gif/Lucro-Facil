// ------------------------------------------------------
// Firebase compat — usa window.db
// ------------------------------------------------------

const db = (window as any).db;

if (!db) {
  console.error("❌ Firestore não carregado!");
}

// ------------------------------------------------------
// CRUD COMBOS
// ------------------------------------------------------

export async function saveCombo(data: any) {
  return db.collection("combos").add(data);
}

export async function getCombos() {
  const snap = await db.collection("combos").get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

export async function updateComboFB(id: string, data: any) {
  return db.collection("combos").doc(id).update(data);
}

export async function deleteComboFB(id: string) {
  return db.collection("combos").doc(id).delete();
}
