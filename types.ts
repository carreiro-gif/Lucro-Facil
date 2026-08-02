
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
  price: number; // For sub-recipes, this could be calculated dynamically or stored. Let's keep it stored and update when saving.
  packageQuantity: number; // Equivalent to Yield Quantity (Rendimento Total) for sub-recipes
  lossPercent: number; // Loss percent after preparation
  isSubRecipe?: boolean;
  ingredients?: ProductIngredient[]; // The ingredients used to make this sub-recipe
  categoryId?: string; // New: Optional category ID for the ingredient
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
  isTopSeller?: boolean;
  isSlowMover?: boolean;
  isAnchor?: boolean;
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
  description?: string;
  type?: 'fixed' | 'free_choice' | 'boosted';
  category?: string;
  items: ComboItem[];
  freeChoiceCount?: number;
  profitMargin: number;
  ifoodFee: number;
  food99Fee: number;
  keetaFee: number;
  ifoodDelivery: number;
  food99Delivery: number;
  keetaDelivery: number;
  ifoodCoupon: number;
  food99Coupon: number;
  keetaCoupon: number;
  ciValue: number;
  customPackagingCost?: number;
  fixedPriceStore?: number; // Added to let the user input the price they are actually charging
  order?: number;
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

export interface IngredientCategory {
  id: string;
  name: string;
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

export interface SupplierMapping {
  cnpj: string;
  xmlItemName: string;
  ingredientId: string;
  unit: MeasureUnit;
  conversionFactor: number;
}

export interface PurchaseEntryItem {
  xmlItemName: string;
  xmlUnit: string;
  xmlUnitPrice: number;
  xmlQty: number;
  mappedIngredientId?: string;
  mappedUnit?: MeasureUnit;
  conversionFactor?: number;
  status: 'CONFIRMED' | 'PENDING';
  previousPrice?: number;
  variation?: number;
}

export interface PurchaseEntry {
  id: string;
  date: string;
  supplierCnpj: string;
  supplierName: string;
  items: PurchaseEntryItem[];
}

export interface SalesTransaction {
  id: string;
  date: string;
  orderId?: string;
  productId: string;
  productName: string;
  qty: number;
  channel: 'ifood' | 'food99' | 'keeta' | 'store';
  pricePaidByCustomer: number;
  platformSubsidy: number; // For iFood Campanha Inteligente
  couponCostByStore: number;
  feePaid: number;
  notes?: string;
  isFourColumnsTotal?: boolean;
  totalAmount?: number;
}

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
  purchaseEntries: PurchaseEntry[];
  supplierMappings: SupplierMapping[];
  salesTransactions?: SalesTransaction[];
  resetPassword?: string;
  ingredientCategories?: IngredientCategory[];
  collaborators?: Collaborator[];
  collaboratorPayments?: CollaboratorPayment[];
  customCollaboratorRoles?: string[];
  accountsReceivable?: AccountReceivable[];
  customReceivableOrigins?: CustomReceivableOrigin[];
}

export interface CustomReceivableOrigin {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export type ReceivableStatus = 'a_receber' | 'parcial' | 'recebido' | 'atrasado';

export type ReceivablePaymentMethod = 
  | 'pix' 
  | 'dinheiro' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'transferencia' 
  | 'outro';

export interface AccountReceivablePayment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: ReceivablePaymentMethod;
  notes?: string;
  createdAt: string;
}

export type ReceivableOrigin = 
  | 'fiado'
  | 'ifood'
  | '99food'
  | 'keeta'
  | 'brendi'
  | 'empresa'
  | 'evento'
  | 'outro';

export interface AccountReceivable {
  id: string;
  origin: ReceivableOrigin;
  customOrigin?: string;
  description: string;
  customerName?: string;
  customerPhone?: string;
  orderNumber?: string;
  saleDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (Data prevista para receber)
  amount: number; // Valor Total Original
  status: ReceivableStatus;
  receivedDate?: string; // Data efetiva do último recebimento ou quitação
  payments?: AccountReceivablePayment[]; // Histórico de recebimentos parciais e totais
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type RemunerationType = 
  | 'salario'
  | 'diaria'
  | 'por_entrega'
  | 'diaria_mais_taxas'
  | 'pro_labore'
  | 'outro';

export interface DayOfWeekRule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  remunerationType: RemunerationType;
  baseValue: number;
  active: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  remunerationType: RemunerationType;
  defaultAmount: number;
  weeklyRules?: DayOfWeekRule[];
  startDate?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
}

export interface CollaboratorPayment {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorRole: string;
  date: string; // YYYY-MM-DD (fechamento do dia) or YYYY-MM (competência)
  remunerationType: RemunerationType;
  baseAmount: number; // Fixed expense portion (Salário, Diária, Pró-Labore) -> GOES TO DESPESAS FIXAS / CFI
  deliveryFeeAmount: number; // Variable delivery fee -> DOES NOT GO TO DESPESAS FIXAS / CFI
  deliveryCount?: number;
  totalPaid: number; // baseAmount + deliveryFeeAmount
  status: 'pago' | 'pendente';
  paymentDate?: string;
  linkedExpenseId?: string; // ID of the linked Expense in Despesas
  notes?: string;
}

