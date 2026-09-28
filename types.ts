
import { BrendiConsolidatedReport } from './utils/brendiReportParser';

export { type BrendiConsolidatedReport };

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
  creditor?: string;
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
  isManual?: boolean;
  source?: 'manual' | 'integration' | 'consolidated';
  updatedAt?: string;
}

export interface SalesDataRecord {
  id: string;
  saleDate?: string;
  date?: string;
  month: string;
  referenceMonth?: string;
  channel: string;
  totalAmount?: number;
  grossRevenue?: number;
  cmvTotal?: number;
  cmv?: number;
  feesTotal?: number;
  channelFee?: number;
  netProfit?: number;
  source: 'Planilha' | 'Manual' | 'Brendi' | string;
  orderId?: string;
  customerName?: string;
  productName?: string;
  productId?: string;
  qty?: number;
  unitPrice?: number;
  notes?: string;
  items?: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    cmvUnit: number;
  }>;
  userId?: string;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  collaboratorMeals?: CollaboratorMeal[];
  customCollaboratorRoles?: string[];
  accountsReceivable?: AccountReceivable[];
  customReceivableOrigins?: CustomReceivableOrigin[];
  brendiConsolidatedReports?: BrendiConsolidatedReport[];
  variableCosts?: VariableCost[];
}

export type VariableCostCategory = 
  | 'CMV'
  | 'EMBALAGEM'
  | 'FRETE'
  | 'CARTAO'
  | 'ROYALTIES'
  | 'TAXA_DE_ENTREGA'
  | 'VOUCHER'
  | 'MARKETING_PERCENT'
  | 'IMPOSTO'
  | 'OUTROS';

export type VariableCostSource = 
  | 'Manual'
  | 'Colaboradores'
  | 'Brendi'
  | 'Entrada de Compras'
  | 'Vendas'
  | 'Outro';

export type VariableCostMode = 'Manual' | 'Automático';

export type VariableCostStatus = 'Ativo' | 'Inativo';

export interface VariableCost {
  id: string;
  date: string;
  category: VariableCostCategory;
  description: string;
  value: number;
  origin: VariableCostSource;
  mode: VariableCostMode;
  period: string; // e.g., '2026-09' ou 'Setembro/2026'
  status: VariableCostStatus;
  sourceType?: 'collaborator_payment' | 'brendi_order' | 'purchase_entry' | 'manual' | string;
  sourceId?: string;
  storeId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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

export type PaymentFrequency = 
  | 'no_dia'
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'personalizado';

export type PaymentMethod = 
  | 'pix'
  | 'dinheiro'
  | 'cartao'
  | 'transferencia'
  | 'outro';

export type CollaboratorCategory = 
  | 'Administração'
  | 'Cozinha/Produção'
  | 'Atendimento'
  | 'Entrega/Logística'
  | 'Limpeza/Apoio'
  | 'Gestão'
  | 'Outros';

export interface CollaboratorBenefitConfig {
  id: string;
  type: 'cartao_alimentacao' | 'cartao_refeicao' | 'vale_alimentacao' | 'vale_refeicao' | 'outro';
  name: string;
  monthlyAmount?: number; // valor fixo mensal pago pela empresa
  dailyAmount?: number;   // valor por dia trabalhado
  paidByCompany: number;  // valor total pago pela empresa
  notes?: string;
}

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
  category?: string; // Categoria do cargo (Cozinha, Entrega, Atendimento, etc.)
  remunerationType: RemunerationType;
  defaultAmount: number;
  paymentFrequency?: PaymentFrequency; // Frequência de pagamento (no_dia, semanal, quinzenal, mensal)
  weeklyRules?: DayOfWeekRule[];
  startDate?: string;
  status: 'active' | 'inactive';
  pixKey?: string;
  phone?: string;
  notes?: string;
  benefits?: CollaboratorBenefitConfig[] | { providesMeals?: boolean };
  createdAt?: string;
  updatedAt?: string;
}

export interface CollaboratorPayment {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorRole: string;
  date: string; // YYYY-MM-DD (fechamento do dia) or YYYY-MM (competência)
  remunerationType: RemunerationType;
  baseAmount: number; // Mão de obra fixa (Salário, Diária, Pró-Labore) -> Vai para DESPESAS FIXAS / CFI
  deliveryFeeAmount: number; // Taxas de entrega variáveis -> NÃO entra no CFI / Despesas Fixas
  deliveryCount?: number;
  mealDeduction?: number; // Dedução de refeição/alimentação consumida pelo colaborador
  totalPaid: number; // (baseAmount + deliveryFeeAmount) - mealDeduction (valor líquido a pagar)
  amountPaid?: number; // Valor já pago efetivamente
  pendingBalance?: number; // Saldo pendente caso pagamento seja parcial
  status: 'pago' | 'pendente' | 'parcial';
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  linkedExpenseId?: string; // ID da Despesa vinculada em Contas a Pagar (se individual)
  consolidatedExpenseId?: string; // ID do lote consolidado em Contas a Pagar (se consolidado)
  periodStart?: string;
  periodEnd?: string;
  periodType?: 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'personalizado';
  notes?: string;
  createdAt?: string;
}

export interface CollaboratorMealItem {
  id: string;
  type: 'product' | 'custom';
  productId?: string;
  name: string;
  category?: 'lanche' | 'bebida' | 'sobremesa' | 'marmita' | 'outro';
  cost: number; // CUSTO REAL DO PRODUTO (NUNCA PREÇO DE VENDA)
  salePriceReference?: number; // Preço de venda apenas como referência comparativa
  quantity: number;
}

export interface CollaboratorMeal {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  date: string; // YYYY-MM-DD
  items?: CollaboratorMealItem[];
  type?: 'produto_proprio' | 'item_externo';
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  unitCost?: number;
  totalCost: number; // Custo real total absorvido pela empresa
  notes?: string;
  createdAt: string;
}

export interface BrendiChannelFees {
  ifood: number;          // percentual total iFood
  food99: number;         // percentual total 99Food
  keeta: number;          // percentual total Keeta
  brendiDelivery: number; // percentual total Brendi Delivery próprio
  brendiBalcao: number;   // percentual total Brendi Balcão
}

export interface BrendiDetailedFeeChannel {
  fee?: number;
  onlinePayment?: number;
  anticipation?: number;
  delivery?: number;
  coupon?: number;
  feePercent?: number;
  onlinePaymentPercent?: number;
  anticipationPercent?: number;
  deliveryReais?: number;
  couponReais?: number;
}

export interface BrendiDetailedFees {
  ifood: BrendiDetailedFeeChannel;
  food99: BrendiDetailedFeeChannel;
  keeta: BrendiDetailedFeeChannel;
  brendiDelivery: {
    fee?: number;
    delivery?: number;
    feePercent?: number;
    deliveryReais?: number;
  };
  brendiBalcao: {
    fee?: number;
    feePercent?: number;
  };
}

export interface BrendiSmartCampaign {
  active: boolean;
  dailyInvestment: number;
}

export interface BrendiMonthlySubscription {
  plan: 'basic' | 'delivery'; // basic = R$ 110, delivery = R$ 150
  feeAmount: number;
  billingThreshold: number; // default R$ 1800
}

export interface UserIntegrationBrendi {
  storeUuid: string;
  webhookSecret: string;
  active?: boolean;
  updatedAt?: string;
  channelFees?: BrendiChannelFees;
  detailedFees?: BrendiDetailedFees;
  smartCampaign?: BrendiSmartCampaign;
  monthlySubscription?: BrendiMonthlySubscription;
}

export interface UserIntegrations {
  brendi?: UserIntegrationBrendi;
}

export interface PaymentDetail {
  amount?: number;
  method?: string;
  type?: string;
  transactionId?: string;
  provider?: string;
  paidAt?: string;
  rawMethod?: string;
  brand?: string;
  changeFor?: number;
}

export interface FeeDetail {
  type: string;
  amount: number;
  percentage?: number;
  sourceType: 'real';
  description?: string;
}

export interface BrendiOrderItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  notes?: string;
}

export interface BrendiOrder {
  id: string;
  orderId?: string;
  displayId?: string;
  createdAt: string;
  channel: 'Brendi Balcão' | 'Brendi Delivery' | 'iFood' | '99Food' | string;
  merchantId?: string;
  items: BrendiOrderItem[];
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  serviceFee?: number;
  status: 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'DISPATCHED' | 'READY_FOR_PICKUP' | 'PICKUP_AREA_ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CONCLUDED' | 'CANCELLED' | 'CANCELLATION_REQUESTED' | string;
  customerName?: string;
  customerPhone?: string;
  deliveryType?: string;
  userId?: string;
  processed?: boolean;
  hasCoupon?: boolean;
  couponAmount?: number;
  discountAmount?: number;
  payments?: PaymentDetail[];
  fees?: FeeDetail[];
  rawPaymentData?: any;
  receivedAt?: string;
  updatedAt?: string;
}

export interface CategoryRankingItem {
  id: string;
  name: string;
  category: string;
  type: 'product' | 'combo' | 'unregistered';
  totalQty: number;
  totalRevenue: number;
  avgPrice: number;
  unitCmv: number;
  totalCmv: number;
  cmvPercent: number;
  grossProfit: number;
  fixedCostShare: number;
  netProfit: number;
  netMarginPercent: number;
  rankOverall: number;
  rankCategory: number;
  decision: 'continue' | 'save_margin' | 'potential' | 'remove';
  recommendation: string;
  hasFichaTecnica: boolean;
}

export interface RealtimeMonthMetrics {
  monthKey: string;
  revenue: number;
  manualRevenue: number;
  brendiRevenue: number;
  orderCount: number;
  ticketMedio: number;
  cmvTotalInsumos: number;
  cmvPercentAvg: number;
  fixedCosts: number;
  cfiPercent: number;
  netProfitReal: number;
  profitMargin: number;
  breakEvenR$: number;
  gapToBe: number;
  isBreakEvenReached: boolean;
  brendiOrdersCount: number;
  isRealtimeActive: boolean;
  lastOrderAt?: string;
}

// ============================================================================
// ETAPA 1.5B — MODELO FINANCEIRO NORMALIZADO (CANONICAL SALE)
// ============================================================================

export type CanonicalSaleSource = 
  | 'brendi' 
  | 'manual' 
  | 'spreadsheet' 
  | 'saipos' 
  | 'suitable' 
  | 'ifood' 
  | '99food' 
  | 'keeta' 
  | string;

export type CanonicalSaleSourceType = 
  | 'integration' 
  | 'manual' 
  | 'import' 
  | 'api' 
  | 'webhook' 
  | string;

export interface CanonicalSaleItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sourceItemId?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CanonicalSaleCustomer {
  name?: string;
  phone?: string;
}

export interface CanonicalSale {
  id: string;
  originId: string;
  source: CanonicalSaleSource;
  sourceType: CanonicalSaleSourceType;

  orderDate: string;
  createdAt?: string;
  updatedAt?: string;

  status?: string;
  channel?: string;

  items: CanonicalSaleItem[];

  grossAmount: number;

  discountAmount?: number;
  couponAmount?: number;

  deliveryFee?: number;
  serviceFee?: number;

  totalAmount: number;

  payments?: PaymentDetail[];

  fees?: FeeDetail[];

  customer?: CanonicalSaleCustomer;

  deliveryType?: string;
  merchantId?: string;
  storeId?: string;
  userId?: string;

  metadata?: Record<string, any>;
}

// ============================================================================
// ETAPA 2 — MOTOR DE CMV REAL POR VENDA (CANONICAL CMV)
// ============================================================================

export type CanonicalSaleCmvItemStatus = 'complete' | 'pending' | 'unmatched';

export interface CanonicalSaleCmvItemResult {
  sourceItemName: string;
  productId?: string;
  productName?: string;
  comboId?: string;
  comboName?: string;
  quantity: number;
  unitPrice: number;
  saleTotal: number;
  unitCmv?: number;
  totalCmv?: number;
  status: CanonicalSaleCmvItemStatus;
  reason?: string;
}

export type CanonicalSaleCmvStatus = 'COMPLETE' | 'PARTIAL' | 'PENDING';

export interface CanonicalSaleCmvResult {
  saleId: string;
  originId: string;
  source: string;
  orderDate: string;
  grossAmount: number;
  totalAmount: number;
  totalCmv: number;
  matchedAmount: number;
  pendingAmount: number;
  status: CanonicalSaleCmvStatus;
  items: CanonicalSaleCmvItemResult[];
}

export interface PeriodCmvResult {
  period?: string;
  totalRevenue: number;
  matchedRevenue: number;
  pendingRevenue: number;
  coveragePercent: number;
  totalCmv: number;
  cmvPercent: number;
  cmvPercentOverall: number;
  salesCount: number;
  completeSalesCount: number;
  partialSalesCount: number;
  pendingSalesCount: number;
  completeItemsCount: number;
  pendingFichaItemsCount: number;
  unmatchedItemsCount: number;
  sales: CanonicalSaleCmvResult[];
}

