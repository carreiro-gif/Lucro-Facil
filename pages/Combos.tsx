
import React, { useEffect, useState } from 'react';
import {
  saveCombo,
  getCombos,
  updateComboFB,
  deleteComboFB,
} from '../src/firebase/firebase-combos'; // ✅ Corrigido caminho

interface Combo {
  id?: string;
  name: string;
  price: number;
}

const Combos: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [newCombo, setNewCombo] = useState<Combo>({ name: '', price: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCombos();
  }, []);

  async function loadCombos() {
    const data = await getCombos();
    setCombos(data as Combo[]);
  }

  async function handleAdd() {
    if (!newCombo.name || newCombo.price <= 0) {
      alert('Preencha nome e preço!');
      return;
    }
    await saveCombo(newCombo);
    setNewCombo({ name: '', price: 0 });
    loadCombos();
  }

  async function handleUpdate(id: string) {
    if (!newCombo.name || newCombo.price <= 0) {
      alert('Preencha nome e preço!');
      return;
    }
    await updateComboFB(id, newCombo);
    setEditingId(null);
    setNewCombo({ name: '', price: 0 });
    loadCombos();
  }

  async function handleDelete(id: string) {
    if (window.confirm('Excluir combo?')) {
      await deleteComboFB(id);
      loadCombos();
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Combos</h2>

      {/* Formulário */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nome"
          value={newCombo.name}
          onChange={e => setNewCombo({ ...newCombo, name: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Preço"
          value={newCombo.price}
          onChange={e => setNewCombo({ ...newCombo, price: Number(e.target.value) })}
          className="border p-2 rounded"
        />
        {editingId ? (
          <button
            onClick={() => handleUpdate(editingId)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Atualizar
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Adicionar
          </button>
        )}
      </div>

      {/* Lista */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nome</th>
            <th className="border p-2">Preço</th>
            <th className="border p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {combos.map(combo => (
            <tr key={combo.id}>
              <td className="border p-2">{combo.name}</td>
              <td className="border p-2">R$ {combo.price.toFixed(2)}</td>
              <td className="border p-2 flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(combo.id!);
                    setNewCombo({ name: combo.name, price: combo.price });
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(combo.id!)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Combos;
