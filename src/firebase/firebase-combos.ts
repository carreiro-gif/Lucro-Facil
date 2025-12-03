// ------------------------------------------------------
// CRUD de COMBOS usando Firebase compat via CDN
// ------------------------------------------------------

const db = (window as any).firebase?.firestore();

if (!db) {
  console.error("❌ Firebase não carregou! Verifique o index.html");
}

// SALVAR COMBO
export async function saveCombo(data: any) {
  try {
    const docRef = await db.collection("combos").add(data);
    console.log("🔥 Combo salvo:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("❌ Erro ao salvar combo:", e);
    return null;
  }
}

// LISTAR COMBOS
export async function getCombos() {
  try {
    const snapshot = await db.collection("combos").get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (e) {
    console.error("❌ Erro ao listar combos:", e);
    return [];
  }
}

// ATUALIZAR COMBO
export async function updateComboFB(id: string, data: any) {
  try {
    await db.collection("combos").doc(id).update(data);
    console.log("🔥 Combo atualizado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao atualizar combo:", e);
    return false;
  }
}

// DELETAR COMBO
export async function deleteComboFB(id: string) {
  try {
    await db.collection("combos").doc(id).delete();
    console.log("🔥 Combo deletado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao deletar combo:", e);
    return false;
  }
}
