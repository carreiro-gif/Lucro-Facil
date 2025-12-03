import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

interface Store {
  id: string;
  name: string;
  logoUrl?: string;
}

const StoreList: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [newStoreName, setNewStoreName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");

  // ---------------------------------------------------------
  // 🔥 CARREGAR LISTA DE LOJAS
  // ---------------------------------------------------------
  async function loadStores() {
    const snap = await getDocs(collection(db, "stores"));
    const list: Store[] = [];

    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Store));

    setStores(list);
  }

  useEffect(() => {
    loadStores();
  }, []);

  // ---------------------------------------------------------
  // ➕ ADICIONAR LOJA
  // ---------------------------------------------------------
  async function addStore() {
    if (!newStoreName.trim()) {
      alert("Digite o nome da loja!");
      return;
    }

    await addDoc(collection(db, "stores"), {
      name: newStoreName,
      logoUrl: newLogoUrl || "",
      createdAt: new Date(),
    });

    setNewStoreName("");
    setNewLogoUrl("");
    loadStores(); // recarregar
  }

  // ---------------------------------------------------------
  // ✏ EDITAR LOJA
  // ---------------------------------------------------------
  async function updateStore(store: Store) {
    const name = prompt("Novo nome:", store.name);
    if (!name) return;

    const logo = prompt("Nova logo (URL):", store.logoUrl || "");

    await updateDoc(doc(db, "stores", store.id), {
      name,
      logoUrl: logo,
    });

    loadStores();
  }

  // ---------------------------------------------------------
  // 🗑 EXCLUIR LOJA
  // ---------------------------------------------------------
  async function removeStore(id: string) {
    if (!confirm("Deseja excluir esta loja?")) return;

    await deleteDoc(doc(db, "stores", id));
    loadStores();
  }

  // ---------------------------------------------------------
  // 📌 ENTRAR NA LOJA
  // ---------------------------------------------------------
  function openStore(storeId: string) {
    localStorage.setItem("storeId", storeId);
    window.location.href = "/dashboard";
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Lojas</h1>

      {/* FORM NOVA LOJA */}
      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded"
          placeholder="Nome da loja"
          value={newStoreName}
          onChange={(e) => setNewStoreName(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="URL da logo (opcional)"
          value={newLogoUrl}
          onChange={(e) => setNewLogoUrl(e.target.value)}
        />

        <button
          className="bg-green-600 text-white px-4 rounded"
          onClick={addStore}
        >
          Adicionar
        </button>
      </div>

      {/* LISTA DE LOJAS */}
      <div className="grid grid-cols-1 gap-3">
        {stores.map((store) => (
          <div
            key={store.id}
            className="border p-4 flex justify-between rounded shadow"
          >
            <div>
              <h2 className="font-bold text-xl">{store.name}</h2>
              {store.logoUrl && (
                <img
                  src={store.logoUrl}
                  className="h-12 mt-2"
                  alt="logo"
                />
              )}
            </div>

            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white px-3 rounded"
                onClick={() => updateStore(store)}
              >
                Editar
              </button>

              <button
                className="bg-red-600 text-white px-3 rounded"
                onClick={() => removeStore(store.id)}
              >
                Excluir
              </button>

              <button
                className="bg-black text-white px-3 rounded"
                onClick={() => openStore(store.id)}
              >
                Acessar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreList;
