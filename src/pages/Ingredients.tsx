import React, { useState, useEffect } from 'react';
import { MeasureUnit, Ingredient } from '../types';
import { Trash2, Plus, Edit2, Search } from 'lucide-react';
import { useApp } from '../context/AppContext'; // apenas para pegar selectedStoreId e calcular custo real

const Ingredients: React.FC = () => {

  // Agora só usamos o AppContext para pegar o ID da loja e cálculos
  const { selectedStoreId, getIngredientRealCost } = useApp() as any;

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '',
    unit: MeasureUnit.UN,
    price: 0,
    packageQuantity: 1,
    lossPercent: 0
  });

  // =============================
  // 🔥 CARREGAR INGREDIENTES DO FIREBASE
  // =============================
  useEffect(() => {
    if (!selectedStoreId) return;

    (async () => {
      const lista = await (window as any).getIngredientes(selectedStoreId);
      setIngredients(lista);
    })();

  }, [selectedStoreId]);


  // =============================
  // 🔥 SALVAR (CRIAR OU EDITAR)
  // =============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStoreId) return alert("Nenhuma loja selecionada!");

    if (editingId) {
      await (window as any).updateIngrediente(selectedStoreId, editingId, formData);
    } else {
      await (window as any).addIngrediente(selectedStoreId, {
        name: formData.name!,
        unit: formData.unit as MeasureUnit,
        price: Number(formData.price),
        packageQuantity: Number(formData.packageQuantity),
        lossPercent: Number(formData.lossPercent),
      });
    }

    // Recarregar lista
    const novaLista = await (window as any).getIngredientes(selectedStoreId);
    setIngredients(novaLista);

    // Fechar modal e resetar
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', unit: MeasureUnit.UN, price: 0, packageQuantity: 1, lossPercent: 0 });
  };


  // =============================
  // 🔥 EDITAR
  // =============================
  const handleEdit = (ing: Ingredient) => {
    setFormData(ing);
    setEditingId(ing.id);
    setIsModalOpen(true);
  };


  // =============================
  // 🔥 DELETAR
  // =============================
  const handleDelete = async (id: string) => {
    if (!selectedStoreId) return;

    await (window as any).deleteIngrediente(selectedStoreId, id);

    const novaLista = await (window as any).getIngredientes(selectedStoreId);
    setIngredients(novaLista);
  };


  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="animate-fade-in pb-20 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase">Cadastro de Insumos</h2>
          <p className="text-gray-400">Gerencie os ingredientes e seus custos reais com perdas.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', unit: MeasureUnit.UN, price: 0, packageQuantity: 1, lossPercent: 0 });
              setIsModalOpen(true);
            }}
            className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition shadow-lg shadow-red-900/20"
          >
            <Plus size={18} /> <span className="hidden sm:inline">NOVO INSUMO</span>
          </button>
        </div>
      </div>


      {/* TABELA */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0f111a] text-gray-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16">Item</th>
                <th className="px-6 py-4">Nome do Insumo</th>
                <th className="px-6 py-4 text-center">Peso/Qtd</th>
                <th className="px-6 py-4 text-center">Unidade</th>
                <th className="px-6 py-4 text-right">Preço (R$)</th>
                <th className="px-6 py-4 text-center">Perda (%)</th>
                <th className="px-6 py-4 text-center text-gray-500">Qtd. Real</th>
                <th className="px-6 py-4 text-right text-brand-red">Preço Unit.</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800 text-sm">
              {filteredIngredients.map((ing, idx) => {
                const realQty = ing.packageQuantity * (1 - (ing.lossPercent / 100));
                const unitPrice = getIngredientRealCost(ing);

                return (
                  <tr key={ing.id} className="hover:bg-gray-800/50 transition group">
                    <td className="px-6 py-4 text-gray-500 font-mono">{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-white">{ing.name}</td>
                    <td className="px-6 py-4 text-center text-gray-300">{ing.packageQuantity}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-bold border border-gray-700">
                        {ing.unit === MeasureUnit.G ? 'GRAMAS' : ing.unit === MeasureUnit.ML ? 'ML' : 'UN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-300">R$ {ing.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center text-red-400">{ing.lossPercent > 0 ? `${ing.lossPercent}%` : '-'}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{realQty % 1 === 0 ? realQty : realQty.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-white font-mono bg-gray-800/30">
                      R$ {unitPrice.toFixed(4)} <span className="text-[10px] text-gray-500 font-normal">/ {ing.unit === MeasureUnit.G ? 'gr' : ing.unit === MeasureUnit.ML ? 'ml' : 'und'}</span>
                    </td>

                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button onClick={() => handleEdit(ing)} className="text-blue-400 hover:text-blue-300 transition"><Edit2 size={16} /></button>

                      <button onClick={() => handleDelete(ing.id)} className="text-gray-600 hover:text-red-500 transition"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>


      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in">

            <h3 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-2">
              {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
              {editingId ? 'Editar Insumo' : 'Novo Insumo'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* form... (mesmo conteúdo que você já tinha — permanece igual) */}
              {/* Mantive tudo exatamente como estava para não mudar seu design */}

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Nome do Insumo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Unidade de Medida</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as MeasureUnit })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-red outline-none"
                  >
                    <option value={MeasureUnit.UN}>Unidade</option>
                    <option value={MeasureUnit.G}>Gramas</option>
                    <option value={MeasureUnit.ML}>Mililitros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Preço do Pacote (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Peso/Qtd no Pacote</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.packageQuantity}
                    onChange={e => setFormData({ ...formData, packageQuantity: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Perda (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    max="100"
                    min="0"
                    required
                    value={formData.lossPercent}
                    onChange={e => setFormData({ ...formData, lossPercent: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>

              </div>

              {/* SIMULAÇÃO (mantida idêntica) */}
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mt-4">
                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Simulação de Custo Real</p>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Quantidade Real (com perda):</span>
                  <span className="text-white font-mono">
                    {((formData.packageQuantity || 0) * (1 - ((formData.lossPercent || 0) / 100))).toFixed(2)}
                    {' '}{formData.unit === MeasureUnit.G ? 'g' : formData.unit === MeasureUnit.ML ? 'ml' : 'un'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-400">Custo Final por Unidade:</span>
                  <span className="text-brand-red font-bold font-mono">
                    R$ {
                      formData.packageQuantity && formData.price
                        ? (formData.price / ((formData.packageQuantity) * (1 - ((formData.lossPercent || 0) / 100)))).toFixed(4)
                        : '0.0000'
                    }
                  </span>
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-400 hover:text-white font-bold bg-gray-800 rounded-lg transition">Cancelar</button>
                <button type="submit" className="bg-brand-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-900/20">Salvar Insumo</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Ingredients;
