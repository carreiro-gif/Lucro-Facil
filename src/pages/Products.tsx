
import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Trash2, Plus, Edit2, Search } from "lucide-react";

// 🔥 IMPORTAÇÃO CORRETA DO FIREBASE
import "../firebase/firebase-products"; // ✅ Corrigido caminho do import

interface Product {
  id?: string;
  name: string;
  price: number;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Product>({ name: '', price: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ Carregar produtos ao montar
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getProducts();
    setProducts(data as Product[]);
  }

  async function handleAdd() {
    if (!newProduct.name || newProduct.price <= 0) {
      alert('Preencha nome e preço!');
      return;
    }
    await saveProduct(newProduct);
    setNewProduct({ name: '', price: 0 });
    loadProducts();
  }

  async function handleUpdate(id: string) {
    if (!newProduct.name || newProduct.price <= 0) {
      alert('Preencha nome e preço!');
      return;
    }
    await updateProductFB(id, newProduct);
    setEditingId(null);
    setNewProduct({ name: '', price: 0 });
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (window.confirm('Excluir produto?')) {
      await deleteProductFB(id);
      loadProducts();
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Produtos</h2>

      {/* Formulário */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nome"
          value={newProduct.name}
          onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Preço"
          value={newProduct.price}
          onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
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
          {products.map(prod => (
            <tr key={prod.id}>
              <td className="border p-2">{prod.name}</td>
              <td className="border p-2">R$ {prod.price.toFixed(2)}</td>
              <td className="border p-2 flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(prod.id!);
                    setNewProduct({ name: prod.name, price: prod.price });
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(prod.id!)}
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

export default Products;
