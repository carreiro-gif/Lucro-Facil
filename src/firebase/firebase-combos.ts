
// ------------------------------------------------------
// CRUD de COMBOS usando Firebase compat via CDN
// ------------------------------------------------------

const firebaseApp = (window as any).firebase?.app();
const db = (window as any).firebase?.firestore();

if (!firebaseApp || !db) {
  console.error("❌ Firebase não carregou! Verifique os scripts no index.html");
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
    const list: any[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
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
