import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function StoreList() {
  const navigate = useNavigate();

  const {
    stores,
    selectedStoreId,
    setSelectedStoreId,
    addLoja,
    deleteLoja,
  } = useApp();

  const [newStore, setNewStore] = useState({
    name: "",
    address: "",
  });

  // Redireciona automaticamente se já existe loja selecionada
  useEffect(() => {
    if (selectedStoreId) {
      navigate("/dashboard");
    }
  }, [selectedStoreId]);

  async function handleAdd() {
    if (!newStore.name.trim()) {
      alert("Digite o nome da loja");
      return;
    }

    await addLoja(newStore);
    setNewStore({ name: "", address: "" });
  }

  async function handleSelect(id: string) {
    setSelectedStoreId(id);
    navigate("/dashboard");
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta loja?")) return;
    await deleteLoja(id);
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Selecionar Loja</h1>

      {/* Lista de lojas */}
      <div className="bg-white shadow rounded p-4 mb-6">
        {stores.length === 0 && (
          <p className="text-gray-500 text-center">N
