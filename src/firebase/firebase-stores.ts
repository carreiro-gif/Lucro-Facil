// --------------------------------------------------------------------
// CRUD de LOJAS usando Firebase compat (CDN) – mesmo padrão dos outros
// --------------------------------------------------------------------

const firebaseApp = (window as any).firebase?.app();
const db = (window as any).firebase?.firestore();

if (!firebaseApp || !db) {
  console.error("❌ Firebase não carregou! Verifique os scripts no index.html");
}

// LISTAR LOJAS
export async function getStores() {
  try {
    const snap = await db.collection("stores").get();
    const list: any[] = [];
    snap.forEach((doc: any) => list.push({ id: doc.id, ...doc.data() }));
    return list;
  } catch (e) {
    console.error("❌ Erro ao listar lojas:", e);
    return [];
  }
}

// CRIAR LOJA
export async function addStore(data: any) {
  try {
    const ref = await db.collection("stores").add(data);
    return ref.id;
  } catch (e) {
    console.error("❌ Erro ao adicionar loja:", e);
    return null;
  }
}

// ATUALIZAR LOJA
export async function updateStore(id: string, data: any) {
  try {
    await db.collection("stores").doc(id).update(data);
    return true;
  } catch (e) {
    console.error("❌ Erro ao atualizar loja:", e);
    return false;
  }
}

// DELETAR LOJA
export async function deleteStore(id: string) {
  try {
    await db.collection("stores").doc(id).delete();
    return true;
  } catch (e) {
    console.error("❌ Erro ao excluir loja:", e);
    return false;
  }
}
