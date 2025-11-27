
import { GlobalState, MeasureUnit, Category, Product } from './types';

// Helper to generate IDs
const id = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_CATEGORIES_LIST = [
  'Aluguel',
  'Comissões/Gorjetas',
  'Consumo',
  'Contador',
  'Custo com Bebidas',
  'Despesas Administrativas',
  'Despesas Financeiras (Taxas de cartão + Aluguel Máquinas)',
  'Diferença de caixa',
  'Embalagens e Descartáveis',
  'Empréstimos',
  'Fiado',
  'Fornecedores',
  'Frente de Caixa',
  'Garçom',
  'Ifood (mensalidade + Comissão)',
  'Impostos',
  'Internet',
  'Luz',
  'Manutenção de equipamentos',
  'Marketing (Panfletos, Anúncios, etc)',
  'Motoboy',
  'Mão de obra Não Contratada (Extras)',
  'Outros',
  'Produtos de Limpeza e Higiene',
  'Pró-labore',
  'Saldo Inicial',
  'Salário dos Funcionários',
  'Segurança',
  'Tecnologia e Sistemas',
  'Telefone',
  'Água',
  '🧾 Custo com Insumos / Matéria-prima'
];

const INITIAL_CATEGORIES: Category[] = DEFAULT_CATEGORIES_LIST.map(name => ({
  id: id(),
  name,
  isCustom: false
}));

const SEPT_EXPENSES = [
  { description: 'SAIPOS', value: 274.73, category: 'Tecnologia e Sistemas', dueDate: '2025-09-05', paid: true },
  { description: 'CLARO (ACORDO)', value: 63.08, category: 'Telefone', dueDate: '2025-09-10', paid: true },
  { description: 'REPEDIU', value: 239.99, category: 'Tecnologia e Sistemas', dueDate: '2025-09-15', paid: true },
  { description: 'CANVA - (MARKETING)', value: 35.00, category: 'Marketing (Panfletos, Anúncios, etc)', dueDate: '2025-09-20', paid: false },
  { description: 'CAPITAL DE GIRO (ROSANGELA) 5/6', value: 757.43, category: 'Empréstimos', installment: { current: 5, total: 6, id: 'cap_giro' }, dueDate: '2025-09-25', paid: false },
  { description: 'GOOGLE NUVEM', value: 9.90, category: 'Tecnologia e Sistemas', dueDate: '2025-09-28', paid: false },
  { description: 'SALÁRIO (ADENY)', value: 930.00, category: 'Salário dos Funcionários', dueDate: '2025-09-05', paid: true },
  { description: 'SALÁRIO (ENTREGADORES)', value: 1500.00, category: 'Motoboy', dueDate: '2025-09-05', paid: true },
  { description: 'CONTADOR', value: 150.00, category: 'Contador', dueDate: '2025-09-20', paid: true },
  { description: 'CRIATIVO LAB (EQUIPE DE MARKETING)', value: 399.00, category: 'Marketing (Panfletos, Anúncios, etc)', dueDate: '2025-09-10', paid: true },
  { description: 'TRAFEGO PAGO', value: 150.00, category: 'Marketing (Panfletos, Anúncios, etc)', dueDate: '2025-09-15', paid: false },
  { description: 'INTERNET', value: 191.99, category: 'Internet', dueDate: '2025-09-10', paid: true },
  { description: 'BRENDI', value: 250.00, category: 'Tecnologia e Sistemas', dueDate: '2025-09-15', paid: true },
];

const OCT_EXPENSES = SEPT_EXPENSES.map(e => {
  let newVal = e.value;
  let newDesc = e.description;
  let newInstallment = e.installment;

  if (e.description.includes('CAPITAL DE GIRO')) {
    newDesc = 'CAPITAL DE GIRO (ROSANGELA) 3/6';
    newVal = 696.46;
    newInstallment = { current: 6, total: 6, id: 'cap_giro' };
  }
  
  const dateParts = e.dueDate ? e.dueDate.split('-') : ['2025','09','01'];
  const newDate = `2025-10-${dateParts[2]}`;

  return { ...e, description: newDesc, value: newVal, installment: newInstallment, dueDate: newDate, paid: false };
});

const INGREDIENTS_DATA = [
    { id: '1', name: 'Pão Bimbo 1 Corte', unit: MeasureUnit.UN, price: 11.90, packageQuantity: 15, lossPercent: 0.00 },
    { id: '2', name: 'PÃO TOP BRIOCHE', unit: MeasureUnit.UN, price: 12.90, packageQuantity: 15, lossPercent: 0.00 },
    { id: '3', name: 'Hamburguer Frisa', unit: MeasureUnit.UN, price: 42.90, packageQuantity: 48, lossPercent: 0.00 },
    { id: '4', name: 'HAMBURGUER DE PICANHA', unit: MeasureUnit.UN, price: 54.90, packageQuantity: 24, lossPercent: 0.00 },
    { id: '5', name: 'HAMBURGUER DE FRANGO EMPANADO', unit: MeasureUnit.UN, price: 19.90, packageQuantity: 10, lossPercent: 0.00 },
    { id: '6', name: 'Queijo Cheddar Fatiado Schreiber', unit: MeasureUnit.UN, price: 84.90, packageQuantity: 184, lossPercent: 0.00 },
    { id: '7', name: 'Bacon cubos', unit: MeasureUnit.G, price: 28.90, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '8', name: 'Calabresa Fatiada', unit: MeasureUnit.G, price: 20.90, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '9', name: 'OVO', unit: MeasureUnit.UN, price: 10.90, packageQuantity: 20, lossPercent: 0.00 },
    { id: '10', name: 'Ovo de Codorna', unit: MeasureUnit.G, price: 28.42, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '11', name: 'Picles', unit: MeasureUnit.G, price: 48.90, packageQuantity: 1700, lossPercent: 0.00 },
    { id: '12', name: 'Alface', unit: MeasureUnit.G, price: 3.00, packageQuantity: 300, lossPercent: 0.00 },
    { id: '13', name: 'Cebola', unit: MeasureUnit.G, price: 4.99, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '14', name: 'Bily Jack', unit: MeasureUnit.G, price: 16.99, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '15', name: 'Cheddar Cremoso', unit: MeasureUnit.G, price: 39.90, packageQuantity: 1500, lossPercent: 0.00 },
    { id: '16', name: 'Maionese Temperada da Casa', unit: MeasureUnit.G, price: 12.90, packageQuantity: 490, lossPercent: 0.00 },
    { id: '17', name: 'MOLHO BARBECUE', unit: MeasureUnit.G, price: 9.90, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '18', name: 'Ketchup Predileta', unit: MeasureUnit.G, price: 8.99, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '19', name: 'Mostarda Predileta', unit: MeasureUnit.G, price: 13.41, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '20', name: 'Batata 7mm Congelada', unit: MeasureUnit.G, price: 29.90, packageQuantity: 2250, lossPercent: 0.00 },
    { id: '21', name: 'NUGGETS', unit: MeasureUnit.G, price: 39.90, packageQuantity: 2000, lossPercent: 0.00 },
    { id: '22', name: 'ANÉIS DE CEBOLA', unit: MeasureUnit.G, price: 24.90, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '23', name: 'Sache ketchup Predileta', unit: MeasureUnit.UN, price: 11.90, packageQuantity: 144, lossPercent: 0.00 },
    { id: '24', name: 'Sache Maionese Predileta', unit: MeasureUnit.UN, price: 13.90, packageQuantity: 144, lossPercent: 0.00 },
    { id: '25', name: 'Embalagem (P) Fritas - TH01', unit: MeasureUnit.UN, price: 16.00, packageQuantity: 100, lossPercent: 0.00 },
    { id: '26', name: 'Embalagem (M) Fritas - TH02', unit: MeasureUnit.UN, price: 20.00, packageQuantity: 100, lossPercent: 0.00 },
    { id: '27', name: 'Embalagem (G) Fritas - TH03', unit: MeasureUnit.UN, price: 26.00, packageQuantity: 100, lossPercent: 0.00 },
    { id: '28', name: 'Caixa de Isopor Média - TH001', unit: MeasureUnit.UN, price: 39.90, packageQuantity: 100, lossPercent: 0.00 },
    { id: '29', name: 'Papel Acoplado', unit: MeasureUnit.UN, price: 19.90, packageQuantity: 400, lossPercent: 0.00 },
    { id: '30', name: 'Pote molho 50ml', unit: MeasureUnit.UN, price: 2.90, packageQuantity: 10, lossPercent: 0.00 },
    { id: '31', name: 'Etiquetas', unit: MeasureUnit.UN, price: 19.90, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '32', name: 'Saco Kraft Vermelho (Médio)', unit: MeasureUnit.UN, price: 19.90, packageQuantity: 50, lossPercent: 0.00 },
    { id: '33', name: 'CAIXA 25X25', unit: MeasureUnit.UN, price: 17.00, packageQuantity: 10, lossPercent: 0.00 },
    { id: '34', name: 'CAIXA PIZZA 30CM', unit: MeasureUnit.UN, price: 20.10, packageQuantity: 10, lossPercent: 0.00 },
    { id: '35', name: 'CAIXA DE PIZZA 35CM', unit: MeasureUnit.UN, price: 25.00, packageQuantity: 10, lossPercent: 0.00 },
    { id: '36', name: 'SACHE MAIONESE TEMPERADA DA CASA', unit: MeasureUnit.UN, price: 0.95, packageQuantity: 1, lossPercent: 0.00 },
    { id: '37', name: 'EMBALAGEM FRITAS JR.', unit: MeasureUnit.UN, price: 11.90, packageQuantity: 50, lossPercent: 0.00 },
    { id: '38', name: 'TOMATE', unit: MeasureUnit.G, price: 5.99, packageQuantity: 1000, lossPercent: 0.00 },
    { id: '39', name: 'BATATA PALHA', unit: MeasureUnit.G, price: 13.99, packageQuantity: 800, lossPercent: 0.00 },
    { id: '40', name: 'MOLHO SHOYO', unit: MeasureUnit.ML, price: 5.79, packageQuantity: 150, lossPercent: 0.00 },
    { id: '43', name: 'GUARACRAC', unit: MeasureUnit.UN, price: 19.90, packageQuantity: 24, lossPercent: 0.00 },
    { id: '44', name: 'COCA COLA 200ML', unit: MeasureUnit.UN, price: 20.40, packageQuantity: 12, lossPercent: 0.00 },
    { id: '45', name: 'COCA COLA 200ML ZERO', unit: MeasureUnit.UN, price: 20.40, packageQuantity: 12, lossPercent: 0.00 },
    { id: '46', name: 'GUARANA ANTARCTICA 200ML', unit: MeasureUnit.UN, price: 21.48, packageQuantity: 12, lossPercent: 0.00 },
    { id: '47', name: 'GUARANA ANTARCTICA ZERO 200ML', unit: MeasureUnit.UN, price: 21.48, packageQuantity: 12, lossPercent: 0.00 },
    { id: '48', name: 'COCA COLA LATA', unit: MeasureUnit.UN, price: 39.48, packageQuantity: 12, lossPercent: 0.00 },
    { id: '49', name: 'COCA COLA ZERO LATA', unit: MeasureUnit.UN, price: 39.48, packageQuantity: 12, lossPercent: 0.00 },
    { id: '50', name: 'GUARANA ANTARCTICA LATA', unit: MeasureUnit.UN, price: 39.48, packageQuantity: 12, lossPercent: 0.00 },
    { id: '51', name: 'GUARANA ANTARCTICA ZERO LATA', unit: MeasureUnit.UN, price: 39.48, packageQuantity: 12, lossPercent: 0.00 },
    { id: '52', name: 'FANTA LARANJA LATA', unit: MeasureUnit.UN, price: 19.90, packageQuantity: 6, lossPercent: 0.00 },
    { id: '53', name: 'FANTA UVA LATA', unit: MeasureUnit.UN, price: 19.90, packageQuantity: 6, lossPercent: 0.00 },
    { id: '54', name: 'GUARANA ANTARCTICA 1 LITRO', unit: MeasureUnit.UN, price: 7.90, packageQuantity: 2, lossPercent: 0.00 },
    { id: '55', name: 'FLEXA GUARANA 2L', unit: MeasureUnit.UN, price: 26.16, packageQuantity: 6, lossPercent: 0.00 },
    { id: '56', name: 'MINEIRINHO 2L', unit: MeasureUnit.UN, price: 39.48, packageQuantity: 6, lossPercent: 0.00 },
    { id: '57', name: 'COCA COLA 2L', unit: MeasureUnit.UN, price: 48.60, packageQuantity: 6, lossPercent: 0.00 },
];

const PRODUCTS_DATA: Product[] = [
  { id: id(), name: 'CARREIRINHO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 }, { ingredientId: '29', quantity: 1 }, 
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '6', quantity: 1 }
  ]},
  { id: id(), name: 'DUPLO CARREIRINHO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 }, { ingredientId: '29', quantity: 1 },
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '6', quantity: 1 }
  ]},
  { id: id(), name: 'DUPLO CARREIRINHO COM BACON', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 }, { ingredientId: '29', quantity: 1 },
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '7', quantity: 30 }, { ingredientId: '6', quantity: 1 }
  ]},
  { id: id(), name: 'CARREIRO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '17', quantity: 20 }, { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 },
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '9', quantity: 1 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '6', quantity: 1 },
    { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: id(), name: 'BIG CARREIRO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 },
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '29', quantity: 1 },
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }
  ]},
  { id: id(), name: 'BIG CHEDDAR CARREIRO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 },
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '15', quantity: 25 },
    { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 },
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }
  ]},
  { id: id(), name: 'BIG BACON CARREIRO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 },
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '7', quantity: 30 },
    { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 },
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }
  ]},
  { id: id(), name: 'BIG CHEDDAR COM BACON', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 },
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '7', quantity: 30 },
    { ingredientId: '15', quantity: 25 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }
  ]},
  { id: id(), name: 'TRIPLO CARREIRINHO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 3 }, { ingredientId: '6', quantity: 3 },
    { ingredientId: '13', quantity: 10 }, { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 },
    { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 },
    { ingredientId: '11', quantity: 10 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }
  ]},
  { id: id(), name: 'SUCULENTO DUPLO CARREIRO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '17', quantity: 20 }, { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 },
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '9', quantity: 2 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '6', quantity: 2 },
    { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: id(), name: 'PODEROSO TRIPLO CARREIRO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 3 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '17', quantity: 20 }, { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 },
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '9', quantity: 3 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '6', quantity: 3 },
    { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: id(), name: 'FURIOSO CARREIRO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 4 }, { ingredientId: '6', quantity: 4 },
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '29', quantity: 1 },
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 },
    { ingredientId: '32', quantity: 1 }
  ]},
  { id: id(), name: 'FRITAS PEQUENA', category: 'Acompanhamento', ingredients: [
    { ingredientId: '25', quantity: 1 }, { ingredientId: '20', quantity: 150 }
  ]},
  { id: id(), name: 'FRITAS MEDIA', category: 'Acompanhamento', ingredients: [
    { ingredientId: '26', quantity: 1 }, { ingredientId: '20', quantity: 300 },
    { ingredientId: '32', quantity: 1 }, { ingredientId: '31', quantity: 2 }
  ]},
  { id: id(), name: 'CAIXA FRITAS GENEROSA', category: 'Acompanhamento', ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 },
    { ingredientId: '32', quantity: 1 }, { ingredientId: '31', quantity: 2 }
  ]},
  { id: id(), name: 'CAIXA FRITAS GIGANTE', category: 'Acompanhamento', ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '31', quantity: 4 }
  ]},
  { id: id(), name: 'PORÇÃO 6 NUGGETS', category: 'Acompanhamento', ingredients: [
    { ingredientId: '21', quantity: 162 }, { ingredientId: '25', quantity: 1 }
  ]},
  { id: id(), name: 'PORÇÃO 10 NUGGETS', category: 'Acompanhamento', ingredients: [
    { ingredientId: '21', quantity: 270 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'PORÇÃO 20 NUGGETS', category: 'Acompanhamento', ingredients: [
    { ingredientId: '21', quantity: 540 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'PORÇÃO 6 ANÉIS DE CEBOLA', category: 'Acompanhamento', ingredients: [
    { ingredientId: '22', quantity: 120 }, { ingredientId: '25', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'PORÇÃO 10 ANÉIS DE CEBOLA', category: 'Acompanhamento', ingredients: [
    { ingredientId: '22', quantity: 200 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'PORÇÃO 20 ANÉIS DE CEBOLA', category: 'Acompanhamento', ingredients: [
    { ingredientId: '22', quantity: 400 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'TURBINADA M. NUGGETS/OVOS', category: 'Acompanhamento', ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '21', quantity: 108 },
    { ingredientId: '10', quantity: 50 }, { ingredientId: '8', quantity: 50 }, { ingredientId: '14', quantity: 40 },
    { ingredientId: '16', quantity: 40 }, { ingredientId: '17', quantity: 40 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'TURBINADA G. NUGGETS/OVOS', category: 'Acompanhamento', ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '21', quantity: 162 },
    { ingredientId: '10', quantity: 70 }, { ingredientId: '8', quantity: 70 }, { ingredientId: '14', quantity: 50 },
    { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 }, { ingredientId: '31', quantity: 4 }
  ]},
  { id: id(), name: 'TURBINADA M. ANÉIS/OVOS', category: 'Acompanhamento', ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '22', quantity: 80 },
    { ingredientId: '10', quantity: 50 }, { ingredientId: '8', quantity: 50 }, { ingredientId: '14', quantity: 40 },
    { ingredientId: '16', quantity: 40 }, { ingredientId: '17', quantity: 40 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'TURBINADA G. ANÉIS/OVOS', category: 'Acompanhamento', ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '22', quantity: 120 },
    { ingredientId: '10', quantity: 70 }, { ingredientId: '8', quantity: 70 }, { ingredientId: '14', quantity: 50 },
    { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 }, { ingredientId: '31', quantity: 4 }
  ]},
  { id: id(), name: 'TURBINADA DA CASA MÉDIA', category: 'Acompanhamento', ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '8', quantity: 50 },
    { ingredientId: '14', quantity: 50 }, { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 },
    { ingredientId: '31', quantity: 1 }
  ]},
  { id: id(), name: 'TURBINADA DA CASA GRANDE', category: 'Acompanhamento', ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '8', quantity: 70 },
    { ingredientId: '14', quantity: 50 }, { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 },
    { ingredientId: '31', quantity: 4 }
  ]},
  { id: id(), name: 'TURBINADA M. CHEDDAR/BACON', category: 'Acompanhamento', ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '15', quantity: 80 },
    { ingredientId: '7', quantity: 35 }
  ]},
  { id: id(), name: 'TURBINADA G. CHEDDAR/BACON', category: 'Acompanhamento', ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '15', quantity: 120 },
    { ingredientId: '7', quantity: 50 }
  ]},
  { id: id(), name: 'MOLHO BARBECUE 50ML', category: 'Molho', ingredients: [
    { ingredientId: '17', quantity: 50 }, { ingredientId: '30', quantity: 1 }
  ]},
  { id: id(), name: 'MOLHO ESPECIAL 50ML', category: 'Molho', ingredients: [
    { ingredientId: '14', quantity: 50 }, { ingredientId: '30', quantity: 1 }
  ]},
  { id: id(), name: 'MAIONESE TEMPERADA 50ML', category: 'Molho', ingredients: [
    { ingredientId: '16', quantity: 50 }, { ingredientId: '30', quantity: 1 }
  ]},
  { id: id(), name: 'MAIONESE TEMPERADA SACHE', category: 'Molho', ingredients: [
    { ingredientId: '36', quantity: 1 }
  ]},
  { id: id(), name: 'GUARANA ANT. 1 LITRO', category: 'Bebida', ingredients: [
    { ingredientId: '54', quantity: 1 }
  ]},
  { id: id(), name: 'GUARACRAC', category: 'Bebida', ingredients: [
    { ingredientId: '43', quantity: 1 }
  ]},
  { id: id(), name: 'COCA COLA 200ML', category: 'Bebida', ingredients: [
    { ingredientId: '44', quantity: 1 }
  ]},
  { id: id(), name: 'GUARANA ANTARCTICA 200ML', category: 'Bebida', ingredients: [
    { ingredientId: '46', quantity: 1 }
  ]},
  { id: id(), name: 'FLEXA GUARANA 2L', category: 'Bebida', ingredients: [
    { ingredientId: '55', quantity: 1 }
  ]},
  { id: id(), name: 'MINEIRINHO 2L', category: 'Bebida', ingredients: [
    { ingredientId: '56', quantity: 1 }
  ]},
  { id: id(), name: 'COCA COLA 2L', category: 'Bebida', ingredients: [
    { ingredientId: '57', quantity: 1 }
  ]},
  { id: id(), name: 'GUARANA ANTARCTICA LATA', category: 'Bebida', ingredients: [
    { ingredientId: '50', quantity: 1 }
  ]},
  { id: id(), name: 'DUPLO CHEDDAR MELT', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 2 }, { ingredientId: '6', quantity: 2 },
    { ingredientId: '15', quantity: 30 }, { ingredientId: '13', quantity: 30 }, { ingredientId: '40', quantity: 20 }
  ]},
  { id: id(), name: 'CHEDDAR MELT', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 1 }, { ingredientId: '6', quantity: 1 },
    { ingredientId: '15', quantity: 30 }, { ingredientId: '13', quantity: 30 }, { ingredientId: '40', quantity: 20 }
  ]},
  { id: id(), name: 'CHEESBURGUER', category: 'Hambúrguer', ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 },
    { ingredientId: '6', quantity: 1 }
  ]},
  { id: id(), name: 'X-BACON', category: 'Hambúrguer', ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 },
    { ingredientId: '6', quantity: 1 }, { ingredientId: '7', quantity: 30 }, { ingredientId: '12', quantity: 25 },
    { ingredientId: '13', quantity: 10 }, { ingredientId: '38', quantity: 35 }, { ingredientId: '39', quantity: 40 }
  ]},
  { id: id(), name: 'X-EGG', category: 'Hambúrguer', ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 },
    { ingredientId: '6', quantity: 1 }, { ingredientId: '9', quantity: 1 }, { ingredientId: '12', quantity: 25 },
    { ingredientId: '13', quantity: 10 }, { ingredientId: '38', quantity: 35 }, { ingredientId: '39', quantity: 40 }
  ]},
  { id: id(), name: 'X-TUDO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 },
    { ingredientId: '16', quantity: 20 }, { ingredientId: '9', quantity: 1 }, { ingredientId: '12', quantity: 25 },
    { ingredientId: '6', quantity: 1 }, { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 },
    { ingredientId: '15', quantity: 25 }, { ingredientId: '38', quantity: 35 }, { ingredientId: '39', quantity: 40 }
  ]},
  { id: id(), name: 'FRITAS JR.', category: 'Acompanhamento', ingredients: [
    { ingredientId: '20', quantity: 100 }, { ingredientId: '37', quantity: 1 }
  ]},
  { id: id(), name: 'COCA COLA LATA', category: 'Bebida', ingredients: [
    { ingredientId: '48', quantity: 1 }
  ]},
  { id: id(), name: 'COCA COLA 200ML ZERO', category: 'Bebida', ingredients: [
    { ingredientId: '45', quantity: 1 }
  ]},
  { id: id(), name: 'GUARANA ANTARCTICA ZERO 200ML', category: 'Bebida', ingredients: [
    { ingredientId: '47', quantity: 1 }
  ]},
  { id: id(), name: 'CHICKEN CARRIERO', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '5', quantity: 1 }, { ingredientId: '12', quantity: 25 },
    { ingredientId: '16', quantity: 20 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '32', quantity: 1 }, { ingredientId: '29', quantity: 1 }
  ]},
  { id: id(), name: 'CARREIRO PRIME', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 1 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 },
    { ingredientId: '6', quantity: 1 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '38', quantity: 35 }
  ]},
  { id: id(), name: 'DUPLO CARREIRO PRIME', category: 'Hambúrguer', ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 2 }, { ingredientId: '16', quantity: 20 },
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 },
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 },
    { ingredientId: '6', quantity: 2 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 },
    { ingredientId: '38', quantity: 35 }
  ]},
  { id: id(), name: 'COCA COLA ZERO LATA', category: 'Bebida', ingredients: [
    { ingredientId: '49', quantity: 1 }
  ]},
  { id: id(), name: 'GUARANA ANTARCTICA ZERO LATA', category: 'Bebida', ingredients: [
    { ingredientId: '51', quantity: 1 }
  ]},
  { id: id(), name: 'FANTA LARANJA LATA', category: 'Bebida', ingredients: [
    { ingredientId: '52', quantity: 1 }
  ]},
  { id: id(), name: 'FANTA UVA LATA', category: 'Bebida', ingredients: [
    { ingredientId: '53', quantity: 1 }
  ]}
];

const ALL_PRODUCTS = PRODUCTS_DATA; 

export const INITIAL_STATE: GlobalState = {
  storeInfo: {
    id: '1',
    name: 'Matriz - Centro',
    address: 'Rua das Flores, 123'
  },
  ingredients: INGREDIENTS_DATA,
  products: ALL_PRODUCTS,
  combos: [],
  expenses: [
    ...SEPT_EXPENSES.map(e => ({ id: id(), month: '2025-09', ...e })),
    ...OCT_EXPENSES.map(e => ({ id: id(), month: '2025-10', ...e })),
  ],
  monthlyRevenue: [
    { month: '2025-01', revenue: 0 },
    { month: '2025-02', revenue: 0 },
    { month: '2025-03', revenue: 0 },
    { month: '2025-04', revenue: 0 },
    { month: '2025-05', revenue: 0 },
    { month: '2025-06', revenue: 0 },
    { month: '2025-07', revenue: 0 },
    { month: '2025-08', revenue: 0 },
    { month: '2025-09', revenue: 18037.58 }, 
    { month: '2025-10', revenue: 20146.19 }, 
    { month: '2025-11', revenue: 0 },
    { month: '2025-12', revenue: 0 },
  ],
  cfi: {
    debitTax: 1.90,
    creditTax: 5.38,
    voucherTax: 7.99,
    tax: 0.00,
    royalties: 0.00,
    marketing: 0.00,
    profitMargin: 20.0,
  },
  platformConfig: {
    ifood: {
      fee: 12,
      onlinePayment: 3.2,
      anticipation: 1.9,
      delivery: 4.00,
      ciValue: 5.00
    },
    food99: {
      fee: 8.9,
      onlinePayment: 3.2,
      delivery: 4.00,
      anticipation: 0
    },
    keeta: {
      fee: 8.9,
      onlinePayment: 3.2,
      delivery: 4.00,
      anticipation: 0
    }
  },
  categories: INITIAL_CATEGORIES,
  suppliers: [],
  fixedCostMode: 'AVERAGE'
};

export const EMPTY_STATE: GlobalState = {
  storeInfo: {
    id: 'new',
    name: 'Nova Loja',
    address: ''
  },
  ingredients: [],
  products: [],
  combos: [],
  expenses: [],
  monthlyRevenue: [
    { month: '2025-01', revenue: 0 },
    { month: '2025-02', revenue: 0 },
    { month: '2025-03', revenue: 0 },
    { month: '2025-04', revenue: 0 },
    { month: '2025-05', revenue: 0 },
    { month: '2025-06', revenue: 0 },
    { month: '2025-07', revenue: 0 },
    { month: '2025-08', revenue: 0 },
    { month: '2025-09', revenue: 0 },
    { month: '2025-10', revenue: 0 },
    { month: '2025-11', revenue: 0 },
    { month: '2025-12', revenue: 0 },
  ],
  cfi: {
    debitTax: 0,
    creditTax: 0,
    voucherTax: 0,
    tax: 0,
    royalties: 0,
    marketing: 0,
    profitMargin: 20.0,
  },
  platformConfig: {
    ifood: {
      fee: 12,
      onlinePayment: 3.2,
      anticipation: 1.9,
      delivery: 4.00,
      ciValue: 5.00
    },
    food99: {
      fee: 8.9,
      onlinePayment: 3.2,
      delivery: 4.00,
      anticipation: 0
    },
    keeta: {
      fee: 8.9,
      onlinePayment: 3.2,
      delivery: 4.00,
      anticipation: 0
    }
  },
  categories: INITIAL_CATEGORIES,
  suppliers: [],
  fixedCostMode: 'AVERAGE'
};
