
export enum MeasureUnit {
  KG = 'KG',
  UN = 'UN',
  L = 'L',
  ML = 'ML',
  G = 'G'
}

export interface Ingredient {
  id: string;
  name: string;
  unit: MeasureUnit;
  price: number;
  packageQuantity: number;
  lossPercent: number;
}

export interface ProductIngredient {
  ingredientId: string;
  quantity: number;
}

export interface ProductPricing {
  profitMargin?: number;
  ifood?: {
    fee?: number;
    onlinePayment?: number;
    anticipation?: number;
    delivery?: number;
    ciValue?: number;
    coupon?: number;
  };
  food99?: {
    fee?: number;
    onlinePayment?: number;
    anticipation?: number;
    delivery?: number;
    coupon?: number;
  };
  keeta?: {
    fee?: number;
    onlinePayment?: number;
    anticipation?: number;
    delivery?: number;
    coupon?: number;
  };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  ingredients: ProductIngredient[];
  fixedPriceStore?: number;
  pricing?: ProductPricing;
  order: number; // New: Custom sort order within category
}

export interface MenuCategory {
  id: string;
  name: string;
  order: number; // New: Custom sort order for sections
}

export interface ComboItem {
  productId: string;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  items: ComboItem[];
  profitMargin: number;
  ifoodFee: number;
  food99Fee: number;
  delivery: number;
  coupon: number;
}

export interface Expense {
  id: string;
  month: string;
  description: string;
  value: number;
  category: string;
  dueDate?: string;
  paid?: boolean;
  installment?: {
    current: number;
    total: number;
    id: string;
  };
}

export interface Category {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
}

export interface MonthlyData {
  month: string;
  revenue: number;
}

export interface CfiConfig {
  debitTax: number;
  creditTax: number;
  voucherTax: number;
  tax: number;
  royalties: number;
  marketing: number;
  profitMargin: number;
}

export interface PlatformConfig {
  ifood: {
    fee: number;
    onlinePayment: number;
    anticipation: number;
    delivery: number;
    ciValue: number;
  };
  food99: {
    fee: number;
    onlinePayment: number;
    anticipation: number;
    delivery: number;
  };
  keeta: {
    fee: number;
    onlinePayment: number;
    anticipation: number;
    delivery: number;
  };
}

export interface StoreInfo {
  id?: string;
  name: string;
  logo?: string;
  address?: string;
}

export type FixedCostMode = 'AVERAGE' | 'CURRENT_MONTH';

export interface GlobalState {
  storeInfo: StoreInfo;
  ingredients: Ingredient[];
  products: Product[];
  menuCategories: MenuCategory[]; // New
  combos: Combo[];
  expenses: Expense[];
  monthlyRevenue: MonthlyData[];
  cfi: CfiConfig;
  platformConfig: PlatformConfig;
  categories: Category[];
  suppliers: Supplier[];
  fixedCostMode: FixedCostMode;
}
