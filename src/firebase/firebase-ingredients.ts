// ------------------------------------------------------
// CRUD de INGREDIENTES usando Firebase compat via CDN
// ------------------------------------------------------

// Garante que o Firebase carregou no index.html
// e fica acessível globalmente como window.firebase
const firebaseApp = (window as any).firebase?.app();
const db = (window as any).firebase?.firestore();

if (!firebaseApp || !db) {
  console.error("❌ Firebase não carregou! Verifique os scripts no index.html");
}

// ------------------------------------------------------
// SALVAR INGREDIENTE
// ------------------------------------------------------
export async function saveIngredient(data: any) {
  try {
    const docRef = await db.collection("ingredients").add(data);
    console.log("🔥 Ingrediente salvo:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("❌ Erro ao salvar ingrediente:", e);
    return null;
  }
}

// ------------------------------------------------------
// LISTAR INGREDIENTES
// ------------------------------------------------------
export async function getIngredients() {
  try {
    const snapshot = await db.collection("ingredients").get();
    const list: any[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (e) {
    console.error("❌ Erro ao listar ingredientes:", e);
    return [];
  }
}

// ------------------------------------------------------
// ATUALIZAR INGREDIENTE
// ------------------------------------------------------
export async function updateIngredientFB(id: string, data: any) {
  try {
    await db.collection("ingredients").doc(id).update(data);
    console.log("🔥 Ingrediente atualizado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao atualizar ingrediente:", e);
    return false;
  }
}

// ------------------------------------------------------
// DELETAR INGREDIENTE
// ------------------------------------------------------
export async function deleteIngredientFB(id: string) {
  try {
    await db.collection("ingredients").doc(id).delete();
    console.log("🔥 Ingrediente deletado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao deletar ingrediente:", e);
    return false;
  }
}
