// ------------------------------------------------------
// CRUD de PRODUTOS usando Firebase compat via CDN
// ------------------------------------------------------

const firebaseApp = (window as any).firebase?.app();
const db = (window as any).firebase?.firestore();

if (!firebaseApp || !db) {
  console.error("❌ Firebase não carregou! Verifique os scripts no index.html");
}

// ------------------------------------------------------
// SALVAR PRODUTO
// ------------------------------------------------------
async function saveProduct(data: any) {
  try {
    const docRef = await db.collection("products").add(data);
    console.log("🔥 Produto salvo:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("❌ Erro ao salvar produto:", e);
    return null;
  }
}

// ------------------------------------------------------
// LISTAR PRODUTOS
// ------------------------------------------------------
async function getProducts() {
  try {
    const snapshot = await db.collection("products").get();
    const list: any[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (e) {
    console.error("❌ Erro ao listar produtos:", e);
    return [];
  }
}

// ------------------------------------------------------
// ATUALIZAR PRODUTO
// ------------------------------------------------------
async function updateProductFB(id: string, data: any) {
  try {
    await db.collection("products").doc(id).update(data);
    console.log("🔥 Produto atualizado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao atualizar produto:", e);
    return false;
  }
}

// ------------------------------------------------------
// DELETAR PRODUTO
// ------------------------------------------------------
async function deleteProductFB(id: string) {
  try {
    await db.collection("products").doc(id).delete();
    console.log("🔥 Produto deletado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao deletar produto:", e);
    return false;
  }
}

// ------------------------------------------------------
// 🔥 EXPOR PARA O SISTEMA (IMPORTANTE!)
// ------------------------------------------------------
(window as any).saveProduct = saveProduct;
(window as any).getProducts = getProducts;
(window as any).updateProduct = updateProductFB;
(window as any).deleteProduct = deleteProductFB;

// Também exporta, caso queira usar via import
export {
  saveProduct,
  getProducts,
  updateProductFB,
  deleteProductFB
};
