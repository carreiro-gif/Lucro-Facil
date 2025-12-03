// ------------------------------------------------------
// Firebase compat — usa window.db
// ------------------------------------------------------

const db = (window as any).db;

if (!db) {
  console.error("❌ Firestore não carregado!");
}

// ------------------------------------------------------
// CRUD PRODUTOS
// ------------------------------------------------------

export async function saveProduct(data: any) {
  return db.collection("products").add(data);
}

export async function getProducts() {
  const snap = await db.collection("products").get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

export async function updateProductFB(id: string, data: any) {
  return db.collection("products").doc(id).update(data);
}

export async function deleteProductFB(id: string) {
  return db.collection("products").doc(id).delete();
}
