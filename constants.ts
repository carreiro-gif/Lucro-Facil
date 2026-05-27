
import { GlobalState, MeasureUnit, Category, Product, MenuCategory, IngredientCategory } from './types';

// --- VERSION CONTROL ---
export const APP_VERSION = '3.3.1';
export const STORAGE_KEY_APP_VERSION = 'lucro_facil_app_version';
// -----------------------

const id = () => Math.random().toString(36).substr(2, 9);

export const formatPercent = (value: number | undefined | null) => {
  const val = value ?? 0;
  if (isNaN(val)) return '0,0%';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
};

export const formatMoney = (value: number | undefined | null) => {
  const val = value ?? 0;
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const BACKGROUND_PALETTE = [
  // --- Tons Escuros e Modernos (Dark) ---
  { name: 'Escuro Profundo (Azul Slate)', color: '#0f172a', mode: 'dark' },
  { name: 'Azul Eclipse (Navy)', color: '#172554', mode: 'dark' },
  { name: 'Bordô Premium (Vinho)', color: '#450a0a', mode: 'dark' },
  { name: 'Verde Musgo (Esmeralda Escuro)', color: '#064e3b', mode: 'dark' },
  { name: 'Roxo Imperial (Deep Violet)', color: '#2e1065', mode: 'dark' },
  { name: 'Café Expresso (Madeira Escura)', color: '#291c10', mode: 'dark' },
  { name: 'Preto Ônix (Tech)', color: '#0a0a0a', mode: 'dark' },
  { name: 'Cinza Chumbo (Industrial)', color: '#334155', mode: 'dark' },

  // --- Tons Claros e Especiais ---
  { name: 'Branco Gelo (Padrão)', color: '#f8fafc', mode: 'light' },
  { name: 'Cinza Escuro (Grafite)', color: '#1f2937', mode: 'dark' },

  // --- Tons Femininos e Vibrantes ---
  { name: 'Rosa Choque', color: '#db2777', mode: 'dark' },
  { name: 'Lilás', color: '#e9d5ff', mode: 'light' },
  { name: 'Verde Água', color: '#99f6e4', mode: 'light' },
  { name: 'Vermelho Vivo', color: '#dc2626', mode: 'dark' },
  { name: 'Azul Bebê', color: '#bfdbfe', mode: 'light' },
  { name: 'Bege', color: '#fef3c7', mode: 'light' },
];

const DEFAULT_CATEGORIES_LIST = [
  'Aluguel', 'Comissões/Gorjetas', 'Consumo', 'Contador', 'Custo com Bebidas',
  'Despesas Administrativas', 'Despesas Financeiras (Taxas de cartão + Aluguel Máquinas)',
  'Diferença de caixa', 'Embalagens e Descartáveis', 'Empréstimos', 'Fiado',
  'Fornecedores', 'Frente de Caixa', 'Garçom', 'Ifood (mensalidade + Comissão)',
  'Impostos', 'Internet', 'Luz', 'Manutenção de equipamentos',
  'Marketing (Panfletos, Anúncios, etc)', 'Motoboy', 'Mão de obra Não Contratada (Extras)',
  'Outros', 'Produtos de Limpeza e Higiene', 'Pró-labore', 'Saldo Inicial',
  'Salário dos Funcionários', 'Segurança', 'Tecnologia e Sistemas', 'Telefone', 'Água',
  '🧾 Custo com Insumos / Matéria-prima'
];

const INITIAL_CATEGORIES: Category[] = DEFAULT_CATEGORIES_LIST.map(name => ({
  id: id(),
  name,
  isCustom: false
}));

export const INITIAL_MENU_CATEGORIES: MenuCategory[] = [
    { id: 'cat1', name: 'Hambúrguer', order: 0 },
    { id: 'cat2', name: 'Acompanhamento', order: 1 },
    { id: 'cat3', name: 'Molho', order: 2 },
    { id: 'cat4', name: 'Bebida', order: 3 },
    { id: 'cat5', name: 'Sobremesa', order: 4 },
    { id: 'cat_outros', name: 'OUTROS', order: 5 },
];

export const INITIAL_INGREDIENT_CATEGORIES: IngredientCategory[] = [
  { id: 'ing_cat_1', name: 'Proteínas' },
  { id: 'ing_cat_2', name: 'Laticínios' },
  { id: 'ing_cat_3', name: 'Hortifrúti' },
  { id: 'ing_cat_4', name: 'Mercearia' },
  { id: 'ing_cat_5', name: 'Molhos e Condimentos' },
  { id: 'ing_cat_6', name: 'Panificação' },
  { id: 'ing_cat_7', name: 'Embalagens' },
  { id: 'ing_cat_8', name: 'Bebidas' },
  { id: 'ing_cat_9', name: 'Limpeza e Descartáveis' },
];

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
    { id: '58', name: 'SACHE MAIONESE TEMPERADA DA CASA', unit: MeasureUnit.UN, price: 0.50, packageQuantity: 1, lossPercent: 0.00 },
];

const PRODUCTS_DATA: Product[] = [
  { id: 'p1', name: 'CARREIRINHO', category: 'OUTROS', order: 0, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 }, { ingredientId: '29', quantity: 1 }, 
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '6', quantity: 1 }
  ]},
  { id: 'p2', name: 'DUPLO CARREIRINHO', category: 'OUTROS', order: 1, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 }, { ingredientId: '29', quantity: 1 }, 
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '6', quantity: 1 }
  ]},
  { id: 'p3', name: 'DUPLO CARREIRINHO COM BACON', category: 'OUTROS', order: 2, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 }, { ingredientId: '29', quantity: 1 }, 
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '7', quantity: 30 }, { ingredientId: '6', quantity: 1 }
  ]},
  { id: 'p4', name: 'CARREIRO', category: 'OUTROS', order: 3, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '17', quantity: 20 }, { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, 
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '9', quantity: 1 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '6', quantity: 1 }, 
    { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: 'p5', name: 'BIG CARREIRO - CAMPEÃO DE VENDAS', category: 'OUTROS', order: 4, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 }, 
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }
  ]},
  { id: 'p6', name: 'BIG CHEDDAR CARREIRO', category: 'OUTROS', order: 5, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 }, 
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: 'p7', name: 'BIG BACON CARREIRO', category: 'OUTROS', order: 6, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 }, 
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '7', quantity: 30 }
  ]},
  { id: 'p8', name: 'BIG CHEDDAR COM BACON', category: 'OUTROS', order: 7, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '6', quantity: 2 }, 
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }, { ingredientId: '7', quantity: 30 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: 'p9', name: 'TRIPLO CARREIRINHO C/3 CARNES', category: 'OUTROS', order: 8, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 3 }, { ingredientId: '6', quantity: 3 }, 
    { ingredientId: '13', quantity: 10 }, { ingredientId: '18', quantity: 20 }, { ingredientId: '19', quantity: 20 }, 
    { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, 
    { ingredientId: '11', quantity: 10 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }
  ]},
  { id: 'p10', name: 'SUCULENTO DUPLO CARREIRO', category: 'OUTROS', order: 9, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 2 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '17', quantity: 20 }, { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, 
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '9', quantity: 2 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '6', quantity: 2 }, 
    { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: 'p11', name: 'PODEROSO TRIPLO CARREIRO', category: 'OUTROS', order: 10, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 3 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '17', quantity: 20 }, { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, 
    { ingredientId: '23', quantity: 2 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '9', quantity: 3 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '6', quantity: 3 }, 
    { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 }, { ingredientId: '15', quantity: 25 }
  ]},
  { id: 'p12', name: 'FURIOSO CARREIRO C/4 CARNES', category: 'OUTROS', order: 11, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '3', quantity: 4 }, { ingredientId: '6', quantity: 4 }, 
    { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '11', quantity: 10 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '16', quantity: 20 }
  ]},
  { id: 'p13', name: 'FRITAS PEQUENA', category: 'OUTROS', order: 12, ingredients: [
    { ingredientId: '25', quantity: 1 }, { ingredientId: '20', quantity: 150 }
  ]},
  { id: 'p14', name: 'FRITAS MEDIA', category: 'OUTROS', order: 13, ingredients: [
    { ingredientId: '26', quantity: 1 }, { ingredientId: '20', quantity: 300 }
  ]},
  { id: 'p15', name: 'CAIXA FRITAS GENEROSA', category: 'OUTROS', order: 14, ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '32', quantity: 1 }, { ingredientId: '31', quantity: 2 }
  ]},
  { id: 'p16', name: 'CAIXA FRITAS GIGANTE', category: 'OUTROS', order: 15, ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '31', quantity: 4 }
  ]},
  { id: 'p17', name: 'PORÇÃO 6 NUGGETS', category: 'OUTROS', order: 16, ingredients: [
    { ingredientId: '21', quantity: 162 }, { ingredientId: '25', quantity: 1 }
  ]},
  { id: 'p18', name: 'PORÇÃO 10 NUGGETS', category: 'OUTROS', order: 17, ingredients: [
    { ingredientId: '21', quantity: 270 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p19', name: 'PORÇÃO 20 NUGGETS', category: 'OUTROS', order: 18, ingredients: [
    { ingredientId: '21', quantity: 540 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p20', name: 'PORÇÃO 6 ANÉIS DE CEBOLA', category: 'OUTROS', order: 19, ingredients: [
    { ingredientId: '22', quantity: 120 }, { ingredientId: '25', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p21', name: 'PORÇÃO 10 ANÉIS DE CEBOLA', category: 'OUTROS', order: 20, ingredients: [
    { ingredientId: '22', quantity: 200 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p22', name: 'PORÇÃO 20 ANÉIS DE CEBOLA', category: 'OUTROS', order: 21, ingredients: [
    { ingredientId: '22', quantity: 400 }, { ingredientId: '26', quantity: 1 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p23', name: 'TURBINADA M. C/NUGGETS E OVOS DE CODORNA', category: 'OUTROS', order: 22, ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '21', quantity: 108 }, 
    { ingredientId: '10', quantity: 50 }, { ingredientId: '8', quantity: 50 }, { ingredientId: '14', quantity: 40 }, 
    { ingredientId: '16', quantity: 40 }, { ingredientId: '17', quantity: 40 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p24', name: 'TURBINADA G. C/NUGGETS E OVOS DE CODORNA', category: 'OUTROS', order: 23, ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '21', quantity: 162 }, 
    { ingredientId: '10', quantity: 70 }, { ingredientId: '8', quantity: 70 }, { ingredientId: '14', quantity: 50 }, 
    { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 }, { ingredientId: '31', quantity: 4 }
  ]},
  { id: 'p25', name: 'TURBINADA M. C/ANÉIS DE CEBOLA E OVOS DE CODORNA', category: 'OUTROS', order: 24, ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '22', quantity: 80 }, 
    { ingredientId: '10', quantity: 50 }, { ingredientId: '8', quantity: 50 }, { ingredientId: '14', quantity: 40 }, 
    { ingredientId: '16', quantity: 40 }, { ingredientId: '17', quantity: 40 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p26', name: 'TURBINADA G. C/ANÉIS DE CEBOLA E OVOS DE CODORNA', category: 'OUTROS', order: 25, ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '22', quantity: 120 }, 
    { ingredientId: '10', quantity: 70 }, { ingredientId: '8', quantity: 70 }, { ingredientId: '14', quantity: 50 }, 
    { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 }, { ingredientId: '31', quantity: 4 }
  ]},
  { id: 'p27', name: 'TURBINADA DA CASA MÉDIA', category: 'OUTROS', order: 26, ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '8', quantity: 50 }, 
    { ingredientId: '14', quantity: 50 }, { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 }, { ingredientId: '31', quantity: 1 }
  ]},
  { id: 'p28', name: 'TURBINADA DA CASA GRANDE', category: 'OUTROS', order: 27, ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '8', quantity: 70 }, 
    { ingredientId: '14', quantity: 50 }, { ingredientId: '16', quantity: 50 }, { ingredientId: '17', quantity: 50 }, { ingredientId: '31', quantity: 4 }
  ]},
  { id: 'p29', name: 'TURBINADA M. C/CHEDDAR E BACON', category: 'OUTROS', order: 28, ingredients: [
    { ingredientId: '28', quantity: 1 }, { ingredientId: '20', quantity: 400 }, { ingredientId: '15', quantity: 80 }, { ingredientId: '7', quantity: 35 }
  ]},
  { id: 'p30', name: 'TURBINADA G. C/CHEDDAR E BACON', category: 'OUTROS', order: 29, ingredients: [
    { ingredientId: '33', quantity: 1 }, { ingredientId: '20', quantity: 600 }, { ingredientId: '15', quantity: 120 }, { ingredientId: '7', quantity: 50 }
  ]},
  { id: 'p31', name: 'MOLHO BARBECUE 50ML', category: 'OUTROS', order: 30, ingredients: [
    { ingredientId: '17', quantity: 50 }, { ingredientId: '30', quantity: 1 }
  ]},
  { id: 'p32', name: 'MOLHO ESPECIAL 50ML', category: 'OUTROS', order: 31, ingredients: [
    { ingredientId: '14', quantity: 50 }, { ingredientId: '30', quantity: 1 }
  ]},
  { id: 'p33', name: 'MAIONESE TEMPERADA 50ML', category: 'OUTROS', order: 32, ingredients: [
    { ingredientId: '16', quantity: 50 }, { ingredientId: '30', quantity: 1 }
  ]},
  { id: 'p34', name: 'MAIONESE TEMPERADA SACHE', category: 'OUTROS', order: 33, ingredients: [
    { ingredientId: '58', quantity: 1 }
  ]},
  { id: 'p35', name: 'GUARANA ANT. 1 LITRO', category: 'OUTROS', order: 34, ingredients: [
    { ingredientId: '54', quantity: 1 }
  ]},
  { id: 'p36', name: 'GUARACRAC', category: 'OUTROS', order: 35, ingredients: [
    { ingredientId: '43', quantity: 1 }
  ]},
  { id: 'p37', name: 'COCA COLA 200ML', category: 'OUTROS', order: 36, ingredients: [
    { ingredientId: '44', quantity: 1 }
  ]},
  { id: 'p38', name: 'GUARANA ANTARCTICA 200ML', category: 'OUTROS', order: 37, ingredients: [
    { ingredientId: '46', quantity: 1 }
  ]},
  { id: 'p39', name: 'FLEXA GUARANA 2L', category: 'OUTROS', order: 38, ingredients: [
    { ingredientId: '55', quantity: 1 }
  ]},
  { id: 'p40', name: 'MINEIRINHO 2L', category: 'OUTROS', order: 39, ingredients: [
    { ingredientId: '56', quantity: 1 }
  ]},
  { id: 'p41', name: 'COCA COLA 2L', category: 'OUTROS', order: 40, ingredients: [
    { ingredientId: '57', quantity: 1 }
  ]},
  { id: 'p42', name: 'GUARANA ANTARCTICA LATA', category: 'OUTROS', order: 41, ingredients: [
    { ingredientId: '50', quantity: 1 }
  ]},
  { id: 'p43', name: 'DUPLO CHEDDAR MELT', category: 'OUTROS', order: 42, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 2 }, { ingredientId: '6', quantity: 2 }, 
    { ingredientId: '15', quantity: 30 }, { ingredientId: '13', quantity: 30 }, { ingredientId: '40', quantity: 20 }
  ]},
  { id: 'p44', name: 'CHEDDAR MELT', category: 'OUTROS', order: 43, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 1 }, { ingredientId: '6', quantity: 1 }, 
    { ingredientId: '15', quantity: 30 }, { ingredientId: '13', quantity: 30 }, { ingredientId: '40', quantity: 20 }
  ]},
  { id: 'p45', name: 'CHEESBURGUER', category: 'OUTROS', order: 44, ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, 
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, 
    { ingredientId: '6', quantity: 1 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '38', quantity: 35 }, { ingredientId: '39', quantity: 40 }
  ]},
  { id: 'p46', name: 'X-BACON', category: 'OUTROS', order: 45, ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, 
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, 
    { ingredientId: '6', quantity: 1 }, { ingredientId: '7', quantity: 30 }, { ingredientId: '12', quantity: 25 }, 
    { ingredientId: '13', quantity: 10 }, { ingredientId: '38', quantity: 35 }, { ingredientId: '39', quantity: 40 }
  ]},
  { id: 'p47', name: 'X-EGG', category: 'OUTROS', order: 46, ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, 
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, 
    { ingredientId: '6', quantity: 1 }, { ingredientId: '9', quantity: 1 }, { ingredientId: '12', quantity: 25 }, 
    { ingredientId: '13', quantity: 10 }, { ingredientId: '38', quantity: 35 }, { ingredientId: '39', quantity: 40 }
  ]},
  { id: 'p48', name: 'X-TUDO', category: 'OUTROS', order: 47, ingredients: [
    { ingredientId: '2', quantity: 1 }, { ingredientId: '3', quantity: 1 }, { ingredientId: '13', quantity: 10 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, 
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, 
    { ingredientId: '16', quantity: 20 }, { ingredientId: '9', quantity: 1 }, { ingredientId: '12', quantity: 25 }, 
    { ingredientId: '6', quantity: 1 }, { ingredientId: '7', quantity: 30 }, { ingredientId: '8', quantity: 20 }, 
    { ingredientId: '15', quantity: 25 }, { ingredientId: '38', quantity: 35 }, { ingredientId: '39', quantity: 40 }
  ]},
  { id: 'p49', name: 'FRITAS JR.', category: 'OUTROS', order: 48, ingredients: [
    { ingredientId: '20', quantity: 100 }, { ingredientId: '37', quantity: 1 }
  ]},
  { id: 'p50', name: 'COCA COLA LATA', category: 'OUTROS', order: 49, ingredients: [
    { ingredientId: '48', quantity: 1 }
  ]},
  { id: 'p51', name: 'COCA COLA 200ML ZERO', category: 'OUTROS', order: 50, ingredients: [
    { ingredientId: '45', quantity: 1 }
  ]},
  { id: 'p52', name: 'GUARANA ANTARCTICA ZERO 200ML', category: 'OUTROS', order: 51, ingredients: [
    { ingredientId: '47', quantity: 1 }
  ]},
  { id: 'p53', name: 'CHICKEN CARRIERO - FRANGO CROCANTE', category: 'OUTROS', order: 52, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '5', quantity: 1 }, { ingredientId: '12', quantity: 25 }, 
    { ingredientId: '16', quantity: 20 }, { ingredientId: '24', quantity: 1 }, { ingredientId: '23', quantity: 2 }, 
    { ingredientId: '32', quantity: 1 }, { ingredientId: '29', quantity: 1 }
  ]},
  { id: 'p54', name: 'CARREIRO PRIME', category: 'OUTROS', order: 53, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 1 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, 
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, 
    { ingredientId: '6', quantity: 1 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '38', quantity: 35 }
  ]},
  { id: 'p55', name: 'DUPLO CARREIRO PRIME', category: 'OUTROS', order: 54, ingredients: [
    { ingredientId: '1', quantity: 1 }, { ingredientId: '4', quantity: 2 }, { ingredientId: '16', quantity: 20 }, 
    { ingredientId: '14', quantity: 20 }, { ingredientId: '29', quantity: 1 }, { ingredientId: '23', quantity: 2 }, 
    { ingredientId: '24', quantity: 1 }, { ingredientId: '31', quantity: 2 }, { ingredientId: '32', quantity: 1 }, 
    { ingredientId: '6', quantity: 2 }, { ingredientId: '12', quantity: 25 }, { ingredientId: '13', quantity: 10 }, { ingredientId: '38', quantity: 35 }
  ]},
  { id: 'p56', name: 'COCA COLA ZERO LATA', category: 'OUTROS', order: 55, ingredients: [
    { ingredientId: '49', quantity: 1 }
  ]},
  { id: 'p57', name: 'GUARANA ANTARCTICA ZERO LATA', category: 'OUTROS', order: 56, ingredients: [
    { ingredientId: '51', quantity: 1 }
  ]},
  { id: 'p58', name: 'FANTA LARANJA LATA', category: 'OUTROS', order: 57, ingredients: [
    { ingredientId: '52', quantity: 1 }
  ]},
  { id: 'p59', name: 'FANTA UVA LATA', category: 'OUTROS', order: 58, ingredients: [
    { ingredientId: '53', quantity: 1 }
  ]},
];

export const INITIAL_STATE: GlobalState = {
  storeInfo: { id: '1', name: 'ESPAÇO CARREIRO LANCHES', address: 'RUA DAS PÉROLAS, 490' },
  ingredients: INGREDIENTS_DATA,
  products: PRODUCTS_DATA,
  menuCategories: INITIAL_MENU_CATEGORIES,
  combos: [],
  expenses: [
    { id: 'exp1', month: '2024-01', description: 'SISTEMA SAIPOS', value: 239, category: 'Sistemas', paid: true },
    { id: 'exp2', month: '2024-01', description: 'CANVA', value: 35, category: 'Marketing', paid: true },
    { id: 'exp3', month: '2024-01', description: 'ALUGUEL', value: 1500, category: 'Ocupação', paid: true },
    { id: 'exp4', month: '2024-01', description: 'ENERGIA', value: 800, category: 'Utilidades', paid: true },
    { id: 'exp5', month: '2024-01', description: 'ÁGUA', value: 150, category: 'Utilidades', paid: true },
    { id: 'exp6', month: '2024-01', description: 'INTERNET', value: 120, category: 'Utilidades', paid: true },
    { id: 'exp7', month: '2024-01', description: 'PRO-LABORE', value: 3000, category: 'Pessoal', paid: true },
    { id: 'exp8', month: '2024-01', description: 'CONTABILIDADE', value: 450, category: 'Serviços', paid: true }
  ],
  monthlyRevenue: [
    { month: '2024-01', revenue: 42000 },
    { month: '2024-02', revenue: 38500 },
    { month: '2024-03', revenue: 45000 },
    { month: '2024-04', revenue: 48000 }
  ],
  cfi: {
    debitTax: 1.90, creditTax: 5.38, voucherTax: 7.99,
    tax: 0.00, royalties: 0.00, marketing: 0.00, profitMargin: 20.0,
  },
  platformConfig: {
    ifood: { fee: 12, onlinePayment: 3.2, anticipation: 1.9, delivery: 4.00, ciValue: 5.00 },
    food99: { fee: 8.9, onlinePayment: 3.2, delivery: 4.00, anticipation: 0 },
    keeta: { fee: 8.9, onlinePayment: 3.2, delivery: 4.00, anticipation: 0 }
  },
  categories: INITIAL_CATEGORIES,
  suppliers: [],
  fixedCostMode: 'AVERAGE',
  purchaseEntries: [],
  supplierMappings: [],
  resetPassword: '1234',
  ingredientCategories: INITIAL_INGREDIENT_CATEGORIES
};

export const EMPTY_STATE: GlobalState = {
  ...INITIAL_STATE,
  storeInfo: { id: 'new', name: 'Nova Loja', address: '' },
  ingredients: [],
  products: [],
  menuCategories: INITIAL_MENU_CATEGORIES,
  expenses: [],
  monthlyRevenue: [],
  purchaseEntries: [],
  supplierMappings: [],
  resetPassword: '1234',
  ingredientCategories: INITIAL_INGREDIENT_CATEGORIES
};
