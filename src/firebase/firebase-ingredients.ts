// firebase-ingredients.ts
// CRUD profissional para ingredientes usando Firestore (compat)
// Estrutura: stores/{storeId}/ingredients/{ingredientId}

console.log("🔥 firebase-ingredients.ts carregado");

// Garante que firebase.ts já carregou
if (!window.firebase || !window.db) {
  console.error("❌ Firebase ainda não carregou. Verifique firebase.ts");
}

// =====================
// ➕ Criar ingrediente
// =====================
window.addIngrediente = async function (storeId, data) {
  try {
    const ref = window.db
      .collection("stores")
      .doc(storeId)
      .collection("ingredients");

    const doc = await ref.add({
      ...data,
      criadoEm: new Date(),
    });

    console.log("🔥 Ingrediente criado:", doc.id);
    return doc.id;
  } catch (e) {
    console.error("❌ Erro ao adicionar ingrediente:", e);
    throw e;
  }
};

// =====================
// 📄 Listar ingredientes
// =====================
window.getIngredientes = async function (storeId) {
  try {
    const ref = window.db
      .collection("stores")
      .doc(storeId)
      .collection("ingredients");

    const snap = await ref.get();

    const lista = [];
    snap.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() });
    });

    console.log("📄 Ingredientes carregados:", lista);
    return lista;
  } catch (e) {
    console.error("❌ Erro ao listar ingredientes:", e);
    throw e;
  }
};

// =====================
// ✏️ Atualizar ingrediente
// =====================
window.updateIngrediente = async function (storeId, id, data) {
  try {
    await window.db
      .collection("stores")
      .doc(storeId)
      .collection("ingredients")
      .doc(id)
      .update(data);

    console.log("✏️ Ingrediente atualizado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao atualizar ingrediente:", e);
    throw e;
  }
};

// =====================
// 🗑 Excluir ingrediente
// =====================
window.deleteIngrediente = async function (storeId, id) {
  try {
    await window.db
      .collection("stores")
      .doc(storeId)
      .collection("ingredients")
      .doc(id)
      .delete();

    console.log("🗑 Ingrediente deletado:", id);
    return true;
  } catch (e) {
    console.error("❌ Erro ao deletar ingrediente:", e);
    throw e;
  }
};
