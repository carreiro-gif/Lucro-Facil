
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { GlobalState, Ingredient, Product, Expense, MonthlyData, CfiConfig, PlatformConfig, Category, IngredientCategory, Supplier, FixedCostMode, Combo, StoreInfo, MenuCategory, PurchaseEntry, SupplierMapping, SalesTransaction, Collaborator, CollaboratorPayment, CollaboratorMeal, PaymentMethod, PaymentFrequency, AccountReceivable, CustomReceivableOrigin, AccountReceivablePayment, ReceivablePaymentMethod, ReceivableStatus, BrendiOrder, CategoryRankingItem, RealtimeMonthMetrics, UserIntegrationBrendi, VariableCost } from '../types';
import { INITIAL_STATE, EMPTY_STATE, INITIAL_INGREDIENT_CATEGORIES } from '../constants';
import { useAuth } from './AuthContext';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { BrendiConsolidatedReport, isCorruptedBrendiImportTransaction } from '../utils/brendiReportParser';
import { BRENDI_SEPTEMBER_REALTIME_ORDERS } from '../data/brendiSeptemberRealtimeOrders';

interface AppContextType extends GlobalState {
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  
  addIngredientCategory: (name: string) => void;
  updateIngredientCategory: (id: string, name: string) => void;
  deleteIngredientCategory: (id: string) => void;
  reorderIngredientCategory: (id: string, direction: 'up' | 'down') => void;
  addProduct: (prod: Product) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  bulkUpdateProductsPricing: (key: string, value: number) => void;
  deleteProduct: (id: string) => void;
  reorderProduct: (id: string, direction: 'up' | 'down') => void;

  addMenuCategory: (name: string) => void;
  updateMenuCategory: (id: string, name: string) => void;
  deleteMenuCategory: (id: string) => void;
  reorderMenuCategory: (id: string, direction: 'up' | 'down') => void;

  addCombo: (combo: Combo) => void;
  updateCombo: (id: string, combo: Partial<Combo>) => void;
  deleteCombo: (id: string) => void;
  
  addExpense: (exp: Expense) => void;
  updateExpense: (id: string, exp: Partial<Expense>) => void;
  updateExpenseAndFutureInstallments: (id: string, exp: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addExpenseWithInstallments: (baseExp: Omit<Expense, 'id' | 'installment'>, installments: number) => void;
  
  addCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  
  addSupplier: (sup: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  updateCfi: (cfi: Partial<CfiConfig>) => void;
  updatePlatformConfig: (cfg: Partial<PlatformConfig>) => void;
  updateMonthlyRevenue: (data: MonthlyData[]) => void;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  
  addPurchaseEntry: (entry: PurchaseEntry) => void;
  deletePurchaseEntry: (id: string) => void;
  addSupplierMapping: (mapping: SupplierMapping) => void;
  updateIngredientPriceFromXML: (ingredientId: string, newPrice: number) => void;
  
  addSalesTransaction: (trans: SalesTransaction) => void;
  addSalesTransactionsBatch: (transList: SalesTransaction[]) => void;
  deleteSalesTransaction: (id: string) => void;
  clearSalesTransactions: () => void;
  clearSalesTransactionsByMonth: (month: string) => void;
  updateMonthlyRevenueFromIntegration: (month: string, revenue: number) => void;
  syncIfoodSubscriptionAndCampaign: (brendiConfig?: UserIntegrationBrendi) => void;
  addBrendiConsolidatedReport: (report: BrendiConsolidatedReport) => void;
  removeBrendiConsolidatedReport: (reportId: string) => void;
  sanitizeCorruptedBrendiSales: () => { removedCount: number; affectedMonths: string[] };

  // Collaborators
  addCollaborator: (collab: Collaborator) => void;
  updateCollaborator: (id: string, collab: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;
  addCustomCollaboratorRole: (roleName: string) => void;
  addCollaboratorPayment: (payment: CollaboratorPayment, options?: { skipExpenseSync?: boolean }) => void;
  addCollaboratorPaymentsBatch: (payments: CollaboratorPayment[], options?: { consolidateToExpenses?: boolean; consolidatedTitle?: string; expenseCategory?: string }) => void;
  updateCollaboratorPaymentStatus: (id: string, status: 'pago' | 'pendente' | 'parcial', updateData?: { amountPaid?: number; paymentMethod?: PaymentMethod; paymentDate?: string }) => void;
  deleteCollaboratorPayment: (id: string) => void;
  closeCollaboratorPayments: (params: {
    paymentIds: string[];
    amountToPay?: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    consolidateToExpenses?: boolean;
    consolidatedTitle?: string;
    expenseCategory?: string;
    notes?: string;
  }) => void;
  consolidateLegacyCollaboratorExpenses: () => { consolidatedCount: number };

  // Meals & Benefits
  addCollaboratorMeal: (meal: CollaboratorMeal) => void;
  updateCollaboratorMeal: (id: string, meal: Partial<CollaboratorMeal>) => void;
  deleteCollaboratorMeal: (id: string) => void;
  addCollaboratorMealsBatch: (meals: CollaboratorMeal[]) => void;

  // Accounts Receivable
  addAccountReceivable: (item: AccountReceivable) => void;
  updateAccountReceivable: (id: string, item: Partial<AccountReceivable>) => void;
  markAccountReceivableAsReceived: (id: string, receivedDate?: string) => void;
  deleteAccountReceivable: (id: string) => void;
  addReceivablePayment: (
    receivableId: string, 
    payment: { amount: number; date: string; paymentMethod: ReceivablePaymentMethod; notes?: string; nextDueDate?: string }
  ) => void;
  deleteReceivablePayment: (receivableId: string, paymentId: string) => void;
  addCustomReceivableOrigin: (name: string) => boolean;
  updateCustomReceivableOrigin: (id: string, name: string) => boolean;
  toggleCustomReceivableOriginStatus: (id: string, active: boolean) => void;
  deleteCustomReceivableOrigin: (id: string) => { action: 'deleted' | 'disabled' };

  // Variable Costs Actions
  addVariableCost: (cost: VariableCost) => void;
  updateVariableCost: (id: string, cost: Partial<VariableCost>) => void;
  deleteVariableCost: (id: string) => void;
  addVariableCostsBatch: (costs: VariableCost[]) => void;
  importDeliveryFeesFromCollaborators: (period: string) => { importedCount: number };
  
  setFixedCostMode: (mode: FixedCostMode) => void;
  resetSystem: () => void;
  updateResetPassword: (newPassword: string) => void;
  
  getIngredientRealCost: (ing: Ingredient) => number;
  getProductCMV: (prod: Product) => number;
  calculateFixedCostPercent: (currentMonth?: string) => number;
  calculateTotalCfiPercent: () => number;
  getSortedProducts: () => Product[];
  getCmvAvgPercent: () => number;
  calculateBreakEven: (month: string) => number;
  brendiOrders: BrendiOrder[];
  isBrendiSyncing: boolean;
  getComboCMV: (combo: Combo) => number;
  getRealtimeMonthMetrics: (monthKey?: string) => RealtimeMonthMetrics;
  getCategoryRanking: (monthKey?: string) => CategoryRankingItem[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ 
  children: ReactNode; 
  storeId: string;
  initialData?: GlobalState;
  onStateChange?: (newState: GlobalState) => void;
}> = ({ children, storeId, initialData, onStateChange }) => {
  
  const [state, setState] = useState<GlobalState>(() => {
    if (initialData) {
        // DATA GUARD: Ensure all arrays are initialized even if missing in initialData (localStorage/Backup issues)
        return {
            ...EMPTY_STATE, // Base defaults
            ...initialData, // User data overwrites
            ingredients: initialData.ingredients || [],
            products: (initialData.products || []).map(p => ({
              ...p,
              ingredients: (p.ingredients || []).map(ing => ({ ...ing }))
            })),
            menuCategories: initialData.menuCategories || [],
            combos: initialData.combos || [],
            expenses: initialData.expenses || [],
            monthlyRevenue: initialData.monthlyRevenue || [],
            categories: initialData.categories || [],
            suppliers: initialData.suppliers || [],
            purchaseEntries: initialData.purchaseEntries || [],
            supplierMappings: initialData.supplierMappings || [],
            salesTransactions: (initialData.salesTransactions || []).filter((t: any) => !isCorruptedBrendiImportTransaction(t)),
            ingredientCategories: initialData.ingredientCategories || INITIAL_INGREDIENT_CATEGORIES,
            collaborators: initialData.collaborators || [],
            collaboratorPayments: initialData.collaboratorPayments || [],
            collaboratorMeals: initialData.collaboratorMeals || [],
            customCollaboratorRoles: initialData.customCollaboratorRoles || [],
            accountsReceivable: initialData.accountsReceivable || [],
            customReceivableOrigins: initialData.customReceivableOrigins || [],
            brendiConsolidatedReports: initialData.brendiConsolidatedReports || [],
            variableCosts: initialData.variableCosts || [],
            // Deep merge objects if necessary, but shallow merge for config objects usually suffices if they exist
            cfi: { ...EMPTY_STATE.cfi, ...(initialData.cfi || {}) },
            platformConfig: { 
                ifood: { ...EMPTY_STATE.platformConfig.ifood, ...(initialData.platformConfig?.ifood || {}) },
                food99: { ...EMPTY_STATE.platformConfig.food99, ...(initialData.platformConfig?.food99 || {}) },
                keeta: { ...EMPTY_STATE.platformConfig.keeta, ...(initialData.platformConfig?.keeta || {}) },
            }
        };
    }
    return storeId === '1' ? INITIAL_STATE : EMPTY_STATE;
  });

  const { user, emulatedUser } = useAuth();
  const activeUserId = emulatedUser ? emulatedUser.userId : (user ? user.uid : null);

  const [brendiOrders, setBrendiOrders] = useState<BrendiOrder[]>(() => {
    return (BRENDI_SEPTEMBER_REALTIME_ORDERS && BRENDI_SEPTEMBER_REALTIME_ORDERS.length > 0) 
      ? BRENDI_SEPTEMBER_REALTIME_ORDERS 
      : [];
  });
  const [isBrendiSyncing, setIsBrendiSyncing] = useState<boolean>(false);

  // Initial sync of Brendi September orders on mount so financial charts and reports are populated
  useEffect(() => {
    if (BRENDI_SEPTEMBER_REALTIME_ORDERS && BRENDI_SEPTEMBER_REALTIME_ORDERS.length > 0) {
      syncRealtimeRevenueAndOrders(BRENDI_SEPTEMBER_REALTIME_ORDERS);
    }
  }, []);

  const syncRealtimeRevenueAndOrders = (orderList: BrendiOrder[]) => {
    if (!orderList || orderList.length === 0) return;

    const monthlyMap: Record<string, { revenue: number; count: number }> = {};
    orderList.forEach(o => {
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      if (isCancelled) return;
      const m = (o.createdAt || '').slice(0, 7);
      if (!m) return;

      if (!monthlyMap[m]) {
        monthlyMap[m] = { revenue: 0, count: 0 };
      }
      monthlyMap[m].revenue += Number(o.total || 0);
      monthlyMap[m].count += 1;
    });

    // Update localStorage orders map for Ticket Médio in BreakEven & Dashboard
    try {
      const savedOrders = JSON.parse(localStorage.getItem('lucro_facil_be_monthly_orders_v1') || '{}');
      let changed = false;
      Object.entries(monthlyMap).forEach(([m, data]) => {
        if (!savedOrders[m] || Number(savedOrders[m]) < data.count) {
          savedOrders[m] = data.count;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('lucro_facil_be_monthly_orders_v1', JSON.stringify(savedOrders));
      }
    } catch (e) {}

    // Synchronize state.monthlyRevenue if Brendi revenue is present AND month is not locked manually
    setState(prev => {
      let stateChanged = false;
      const revList = [...(prev.monthlyRevenue || [])];

      Object.entries(monthlyMap).forEach(([m, data]) => {
        const idx = revList.findIndex(r => r.month === m);
        if (idx >= 0) {
          // If the user manually edited this month in Billing, DO NOT overwrite it!
          if (!revList[idx].isManual && (revList[idx].revenue < data.revenue || revList[idx].revenue > 100000)) {
            revList[idx] = { ...revList[idx], revenue: data.revenue, source: 'integration' };
            stateChanged = true;
          }
        } else if (data.revenue > 0) {
          revList.push({ month: m, revenue: data.revenue, isManual: false, source: 'integration' });
          stateChanged = true;
        }
      });

      if (stateChanged) {
        return { ...prev, monthlyRevenue: revList };
      }
      return prev;
    });
  };

  // Real-time listener for Brendi Orders from Firestore
  useEffect(() => {
    if (!activeUserId) {
      setBrendiOrders([]);
      setIsBrendiSyncing(false);
      return;
    }

    setIsBrendiSyncing(true);
    const ordersColRef = collection(db, 'users', activeUserId, 'brendi_orders');
    const q = query(ordersColRef, orderBy('createdAt', 'desc'), limit(500));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: BrendiOrder[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data() as any;
        list.push({
          id: docSnap.id,
          orderId: d.orderId || docSnap.id,
          createdAt: d.createdAt || new Date().toISOString(),
          channel: d.channel || 'Brendi Balcão',
          merchantId: d.merchantId,
          items: Array.isArray(d.items) ? d.items : [],
          total: Number(d.total || 0),
          status: d.status || 'CONCLUDED',
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          deliveryType: d.deliveryType,
          userId: d.userId,
          processed: d.processed || false
        });
      });

      if (list.length === 0) {
        // Fallback to root collection or local fallback if user subcollection is not yet populated
        try {
          const rootRef = collection(db, 'brendi_orders');
          const rootQ = query(rootRef, orderBy('createdAt', 'desc'), limit(100));
          const unsubRoot = onSnapshot(rootQ, (rootSnap) => {
            if (!rootSnap.empty) {
              const rootList: BrendiOrder[] = [];
              rootSnap.forEach(rd => {
                const rdata = rd.data() as any;
                rootList.push({
                  id: rd.id,
                  orderId: rdata.orderId || rd.id,
                  createdAt: rdata.createdAt || new Date().toISOString(),
                  channel: rdata.channel || 'Brendi Balcão',
                  merchantId: rdata.merchantId,
                  items: Array.isArray(rdata.items) ? rdata.items : [],
                  total: Number(rdata.total || 0),
                  status: rdata.status || 'CONCLUDED',
                  customerName: rdata.customerName,
                  customerPhone: rdata.customerPhone,
                  deliveryType: rdata.deliveryType,
                  userId: rdata.userId,
                  processed: rdata.processed || false
                });
              });
              setBrendiOrders(rootList);
              syncRealtimeRevenueAndOrders(rootList);
            } else {
              setBrendiOrders(prev => prev.length > 0 ? prev : (BRENDI_SEPTEMBER_REALTIME_ORDERS || []));
              syncRealtimeRevenueAndOrders(BRENDI_SEPTEMBER_REALTIME_ORDERS || []);
            }
          });
        } catch (e) {
          setBrendiOrders(prev => prev.length > 0 ? prev : (BRENDI_SEPTEMBER_REALTIME_ORDERS || []));
          syncRealtimeRevenueAndOrders(BRENDI_SEPTEMBER_REALTIME_ORDERS || []);
        }
      } else {
        setBrendiOrders(list);
        syncRealtimeRevenueAndOrders(list);
      }
      setIsBrendiSyncing(false);
    }, (error) => {
      console.warn('[AppContext] Real-time brendi_orders listener warning:', error);
      setIsBrendiSyncing(false);
    });

    return () => unsubscribe();
  }, [activeUserId]);

  const [userIntegrationBrendi, setUserIntegrationBrendi] = useState<UserIntegrationBrendi | null>(null);

  // Listen to user integrations config
  useEffect(() => {
    if (!activeUserId) {
      setUserIntegrationBrendi(null);
      return;
    }
    const userDocRef = doc(db, 'users', activeUserId);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data() || {};
        setUserIntegrationBrendi(d.integrations?.brendi || null);
      }
    }, (err) => {
      console.warn('[AppContext] User integrations listener warning:', err);
    });
    return () => unsub();
  }, [activeUserId]);

  const syncIfoodSubscriptionAndCampaign = useCallback((brendiOverride?: UserIntegrationBrendi) => {
    const brendi = brendiOverride || userIntegrationBrendi;
    if (!brendi) return;

    setState(prev => {
      let expensesChanged = false;
      let newExpenses = [...(prev.expenses || [])];
      const currentMonth = new Date().toISOString().slice(0, 7);

      // 1. Campanha Inteligente iFood
      if (brendi.smartCampaign?.active && Number(brendi.smartCampaign.dailyInvestment) > 0) {
        const monthlyCost = Math.round(Number(brendi.smartCampaign.dailyInvestment) * 30 * 100) / 100;
        const existingIdx = newExpenses.findIndex(e => e.month === currentMonth && e.description === 'Campanha Inteligente iFood');
        if (existingIdx === -1) {
          newExpenses.push({
            id: `exp_ci_ifood_${currentMonth}`,
            month: currentMonth,
            description: 'Campanha Inteligente iFood',
            value: monthlyCost,
            category: 'Marketing e Divulgação',
            dueDate: `${currentMonth}-10`,
            paid: false,
          });
          expensesChanged = true;
        }
      }

      // 2. Mensalidade iFood
      if (brendi.monthlySubscription) {
        const threshold = Number(brendi.monthlySubscription.billingThreshold) || 1800;
        const feeValue = Number(brendi.monthlySubscription.feeAmount) || (brendi.monthlySubscription.plan === 'delivery' ? 150 : 110);

        const monthsSet = new Set<string>([currentMonth]);
        (prev.salesTransactions || []).forEach(t => {
          if (t.date) monthsSet.add(t.date.slice(0, 7));
        });
        (brendiOrders || []).forEach(o => {
          if (o.createdAt) monthsSet.add(o.createdAt.slice(0, 7));
        });

        monthsSet.forEach(m => {
          const txIfoodRev = (prev.salesTransactions || [])
            .filter(t => (t.date || '').slice(0, 7) === m && (t.channel || '').toLowerCase().includes('ifood'))
            .reduce((sum, t) => sum + (Number(t.totalAmount) || (Number(t.pricePaidByCustomer) || 0) * (Number(t.qty) || 1)), 0);

          const ordersIfoodRev = (brendiOrders || [])
            .filter(o => (o.createdAt || '').slice(0, 7) === m && ((o.channel || '').toLowerCase().includes('ifood') || (o.merchantId || '').toLowerCase().includes('ifood')))
            .reduce((sum, o) => sum + Number(o.total || 0), 0);

          const totalIfoodMonthRev = Math.max(txIfoodRev, ordersIfoodRev, txIfoodRev + ordersIfoodRev);

          if (totalIfoodMonthRev >= threshold) {
            const hasSub = newExpenses.some(e => e.month === m && (e.description === 'Mensalidade iFood' || e.id === `exp_ifood_sub_${m}`));
            if (!hasSub) {
              newExpenses.push({
                id: `exp_ifood_sub_${m}`,
                month: m,
                description: 'Mensalidade iFood',
                value: feeValue,
                category: 'Taxas e Serviços',
                dueDate: `${m}-15`,
                paid: false,
              });
              expensesChanged = true;
            }
          }
        });
      }

      if (expensesChanged) {
        return {
          ...prev,
          expenses: newExpenses
        };
      }
      return prev;
    });
  }, [userIntegrationBrendi, brendiOrders]);

  useEffect(() => {
    if (userIntegrationBrendi) {
      syncIfoodSubscriptionAndCampaign(userIntegrationBrendi);
    }
  }, [userIntegrationBrendi, syncIfoodSubscriptionAndCampaign]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onStateChange) onStateChange(state);
  }, [state, onStateChange]);

  // --- ACTIONS ---

  const addIngredient = (ing: Ingredient) => setState(s => ({ ...s, ingredients: [...s.ingredients, ing] }));
  const updateIngredient = (id: string, data: Partial<Ingredient>) => {
    setState(s => ({ ...s, ingredients: s.ingredients.map(i => i.id === id ? { ...i, ...data } : i) }));
  };
  const deleteIngredient = (id: string) => setState(s => ({ ...s, ingredients: s.ingredients.filter(i => i.id !== id) }));

  const addIngredientCategory = (name: string) => {
    const newCat = { id: 'ing_cat_' + Math.random().toString(36).substr(2, 9), name };
    setState(s => ({
      ...s,
      ingredientCategories: [...(s.ingredientCategories || INITIAL_INGREDIENT_CATEGORIES), newCat]
    }));
  };

  const updateIngredientCategory = (id: string, name: string) => {
    setState(s => ({
      ...s,
      ingredientCategories: (s.ingredientCategories || INITIAL_INGREDIENT_CATEGORIES).map(c => c.id === id ? { ...c, name } : c)
    }));
  };

  const deleteIngredientCategory = (id: string) => {
    setState(s => ({
      ...s,
      ingredientCategories: (s.ingredientCategories || INITIAL_INGREDIENT_CATEGORIES).filter(c => c.id !== id),
      ingredients: s.ingredients.map(ing => ing.categoryId === id ? { ...ing, categoryId: undefined } : ing)
    }));
  };

  const reorderIngredientCategory = (id: string, direction: 'up' | 'down') => {
    setState(s => {
      const list = [...(s.ingredientCategories || INITIAL_INGREDIENT_CATEGORIES)];
      const idx = list.findIndex(c => c.id === id);
      if (idx === -1) return s;
      if (direction === 'up' && idx === 0) return s;
      if (direction === 'down' && idx === list.length - 1) return s;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const temp = list[idx];
      list[idx] = list[targetIdx];
      list[targetIdx] = temp;

      return {
        ...s,
        ingredientCategories: list
      };
    });
  };

  // Products
  const addProduct = (prod: Product) => setState(s => {
      const sameCat = s.products.filter(p => p.category === prod.category);
      const maxOrder = sameCat.length > 0 ? Math.max(...sameCat.map(p => p.order)) : -1;
      const cleanProd: Product = {
        ...prod,
        ingredients: (prod.ingredients || []).map(i => ({ ...i })),
        pricing: prod.pricing ? JSON.parse(JSON.stringify(prod.pricing)) : undefined,
        order: maxOrder + 1
      };
      return { ...s, products: [...s.products, cleanProd] };
  });

  const updateProduct = (id: string, data: Partial<Product>) => {
    setState(s => ({ 
      ...s, 
      products: s.products.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data };
        if (data.ingredients) {
          updated.ingredients = data.ingredients.map(ing => ({ ...ing }));
        }
        return updated;
      }) 
    }));
  };

  const bulkUpdateProductsPricing = (key: string, value: number) => {
    setState(s => {
      const updatedProducts = (s.products || []).map(p => {
        const newPricing = p.pricing ? JSON.parse(JSON.stringify(p.pricing)) : {};
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          if (!newPricing[parent] || typeof newPricing[parent] !== 'object') {
            newPricing[parent] = {};
          }
          newPricing[parent][child] = value;
        } else {
          newPricing[key] = value;
        }
        return { ...p, pricing: newPricing };
      });
      return {
        ...s,
        products: updatedProducts
      };
    });
  };

  const deleteProduct = (id: string) => setState(s => ({ ...s, products: s.products.filter(p => p.id !== id) }));

  const reorderProduct = (id: string, direction: 'up' | 'down') => {
    setState(s => {
      const product = s.products.find(p => p.id === id);
      if (!product) return s;
      
      const sameCat = s.products
        .filter(p => p.category === product.category)
        .sort((a, b) => a.order - b.order);
      
      const idx = sameCat.findIndex(p => p.id === id);
      if (direction === 'up' && idx === 0) return s;
      if (direction === 'down' && idx === sameCat.length - 1) return s;
      
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const targetProduct = sameCat[targetIdx];
      
      const newProducts = s.products.map(p => {
        if (p.id === product.id) return { ...p, order: targetProduct.order };
        if (p.id === targetProduct.id) return { ...p, order: product.order };
        return p;
      });
      
      return { ...s, products: newProducts };
    });
  };

  // Menu Categories
  const addMenuCategory = (name: string) => setState(s => {
      const maxOrder = s.menuCategories.length > 0 ? Math.max(...s.menuCategories.map(c => c.order)) : -1;
      return { ...s, menuCategories: [...s.menuCategories, { id: Date.now().toString(), name, order: maxOrder + 1 }] };
  });

  const updateMenuCategory = (id: string, name: string) => setState(s => ({
    ...s,
    menuCategories: s.menuCategories.map(c => c.id === id ? { ...c, name } : c),
    products: s.products.map(p => {
      const oldCat = s.menuCategories.find(cat => cat.id === id);
      if (oldCat && p.category === oldCat.name) {
        return { ...p, category: name };
      }
      return p;
    })
  }));

  const deleteMenuCategory = (id: string) => setState(s => {
    const categoryToDelete = s.menuCategories.find(c => c.id === id);
    const catName = categoryToDelete?.name || "";
    
    return {
      ...s,
      menuCategories: s.menuCategories.filter(c => c.id !== id),
      // Move produtos que usavam essa categoria para "Sem Categoria"
      products: s.products.map(p => p.category === catName ? { ...p, category: "Sem Categoria" } : p)
    };
  });

  const reorderMenuCategory = (id: string, direction: 'up' | 'down') => {
    setState(s => {
        const sorted = [...s.menuCategories].sort((a,b) => a.order - b.order);
        const idx = sorted.findIndex(c => c.id === id);
        if (direction === 'up' && idx === 0) return s;
        if (direction === 'down' && idx === sorted.length - 1) return s;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const current = sorted[idx];
        const target = sorted[targetIdx];

        const newList = s.menuCategories.map(c => {
            if (c.id === current.id) return { ...c, order: target.order };
            if (c.id === target.id) return { ...c, order: current.order };
            return c;
        });
        return { ...s, menuCategories: newList };
    });
  };

  const addCombo = (combo: Combo) => setState(s => ({ ...s, combos: [...s.combos, combo] }));
  const updateCombo = (id: string, data: Partial<Combo>) => {
    setState(s => ({ ...s, combos: s.combos.map(c => c.id === id ? { ...c, ...data } : c) }));
  };
  const deleteCombo = (id: string) => setState(s => ({ ...s, combos: s.combos.filter(c => c.id !== id) }));

  const addExpense = (exp: Expense) => setState(s => ({ ...s, expenses: [...s.expenses, exp] }));
  const updateExpense = (id: string, data: Partial<Expense>) => {
    setState(s => ({ ...s, expenses: s.expenses.map(e => e.id === id ? { ...e, ...data } : e) }));
  };
  const updateExpenseAndFutureInstallments = (id: string, data: Partial<Expense>) => {
    setState(s => {
      const expenseToUpdate = s.expenses.find(e => e.id === id);
      if (!expenseToUpdate || !expenseToUpdate.installment) {
        return { ...s, expenses: s.expenses.map(e => e.id === id ? { ...e, ...data } : e) };
      }
      
      const groupId = expenseToUpdate.installment.id;
      const currentInstallment = expenseToUpdate.installment.current;
      
      return {
        ...s,
        expenses: s.expenses.map(e => {
          if (e.id === id) {
            return { ...e, ...data };
          }
          if (e.installment?.id === groupId && e.installment.current > currentInstallment) {
            return { 
              ...e, 
              value: data.value ?? e.value,
              description: data.description ?? e.description,
              category: data.category ?? e.category,
              creditor: data.creditor !== undefined ? data.creditor : e.creditor
            };
          }
          return e;
        })
      };
    });
  };
  const deleteExpense = (id: string) => setState(s => ({ ...s, expenses: s.expenses.filter(e => e.id !== id) }));
  const addExpenseWithInstallments = (baseExp: Omit<Expense, 'id' | 'installment'>, installments: number) => {
    if (installments <= 1) {
      addExpense({ ...baseExp, id: Math.random().toString(36).substr(2, 9) });
      return;
    }
    const newExpenses: Expense[] = [];
    const groupId = Math.random().toString(36).substr(2, 9);
    let [year, month] = baseExp.month.split('-').map(Number);
    for (let i = 1; i <= installments; i++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      let dueDateStr = undefined;
      if (baseExp.dueDate) {
        const [dYear, dMonth, dDay] = baseExp.dueDate.split('-').map(Number);
        let targetMonth = dMonth + (i - 1);
        let targetYear = dYear;
        while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
        dueDateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${dDay.toString().padStart(2, '0')}`;
      }
      newExpenses.push({ ...baseExp, id: Math.random().toString(36).substr(2, 9), month: monthStr, dueDate: dueDateStr, installment: { current: i, total: installments, id: groupId } });
      month++; if (month > 12) { month = 1; year++; }
    }
    setState(s => ({ ...s, expenses: [...s.expenses, ...newExpenses] }));
  };

  const addCategory = (cat: Category) => setState(s => ({ ...s, categories: [...s.categories, cat] }));
  const deleteCategory = (id: string) => setState(s => ({ ...s, categories: s.categories.filter(c => c.id !== id) }));
  const addSupplier = (sup: Supplier) => setState(s => ({ ...s, suppliers: [...s.suppliers, sup] }));
  const deleteSupplier = (id: string) => setState(s => ({ ...s, suppliers: s.suppliers.filter(s => s.id !== id) }));
  const updateCfi = (cfi: Partial<CfiConfig>) => setState(s => ({ ...s, cfi: { ...s.cfi, ...cfi } }));
  const updatePlatformConfig = (cfg: Partial<PlatformConfig>) => {
    setState(s => ({ 
      ...s, 
      platformConfig: { 
        ...s.platformConfig, 
        ...cfg, 
        ifood: { ...s.platformConfig.ifood, ...(cfg.ifood || {}) }, 
        food99: { ...s.platformConfig.food99, ...(cfg.food99 || {}) },
        keeta: { ...s.platformConfig.keeta, ...(cfg.keeta || {}) }
      } 
    }));
  };
  const updateMonthlyRevenue = (data: MonthlyData[]) => setState(s => ({ ...s, monthlyRevenue: data }));
  const updateStoreInfo = (info: Partial<StoreInfo>) => setState(s => ({ ...s, storeInfo: { ...s.storeInfo, ...info } }));

  const addPurchaseEntry = (entry: PurchaseEntry) => setState(s => ({ ...s, purchaseEntries: [entry, ...s.purchaseEntries] }));
  const deletePurchaseEntry = (id: string) => setState(s => ({ ...s, purchaseEntries: s.purchaseEntries.filter(e => e.id !== id) }));
  
  const addSalesTransaction = (trans: SalesTransaction) => setState(s => ({ ...s, salesTransactions: [...(s.salesTransactions || []), trans] }));
  const addSalesTransactionsBatch = (transList: SalesTransaction[]) => setState(s => ({ ...s, salesTransactions: [...(s.salesTransactions || []), ...transList] }));
  const deleteSalesTransaction = (id: string) => setState(s => ({ ...s, salesTransactions: (s.salesTransactions || []).filter(t => t.id !== id) }));
  const clearSalesTransactions = () => setState(s => ({ ...s, salesTransactions: [] }));
  const clearSalesTransactionsByMonth = (month: string) => setState(s => ({
    ...s,
    salesTransactions: (s.salesTransactions || []).filter(t => (t.date || '').slice(0, 7) !== month)
  }));

  const updateMonthlyRevenueFromIntegration = (month: string, revenue: number) => {
    setState(prev => {
      const revList = [...(prev.monthlyRevenue || [])];
      const idx = revList.findIndex(r => r.month === month);

      // If already manually edited by the user in Billing, KEEP MANUAL VALUE
      if (idx >= 0) {
        if (revList[idx].isManual === true) {
          console.log(`[AppContext] Faturamento de ${month} mantido como manual (R$ ${revList[idx].revenue}). Não sobrescrito.`);
          return prev;
        }
        revList[idx] = { 
          ...revList[idx], 
          revenue, 
          isManual: false, 
          source: 'integration', 
          updatedAt: new Date().toISOString() 
        };
      } else {
        revList.push({ 
          month, 
          revenue, 
          isManual: false, 
          source: 'integration', 
          updatedAt: new Date().toISOString() 
        });
      }

      return { ...prev, monthlyRevenue: revList };
    });
  };

  const addBrendiConsolidatedReport = (report: BrendiConsolidatedReport) => {
    setState(prev => {
      const existing = prev.brendiConsolidatedReports || [];
      const filtered = existing.filter(r => r.id !== report.id && r.period.formattedPeriod !== report.period.formattedPeriod);
      return {
        ...prev,
        brendiConsolidatedReports: [report, ...filtered]
      };
    });
  };

  const removeBrendiConsolidatedReport = (reportId: string) => {
    setState(prev => ({
      ...prev,
      brendiConsolidatedReports: (prev.brendiConsolidatedReports || []).filter(r => r.id !== reportId)
    }));
  };

  const sanitizeCorruptedBrendiSales = () => {
    let removedCount = 0;
    const affectedMonths = new Set<string>();

    setState(prev => {
      const currentTransactions = prev.salesTransactions || [];
      const validTransactions = currentTransactions.filter(t => {
        const isCorrupted = isCorruptedBrendiImportTransaction(t);
        if (isCorrupted) {
          removedCount++;
          const m = (t.date || '').slice(0, 7);
          if (m) affectedMonths.add(m);
          return false;
        }
        return true;
      });

      const updatedRevList = [...(prev.monthlyRevenue || [])];

      updatedRevList.forEach((revEntry, idx) => {
        const m = revEntry.month;
        if (affectedMonths.has(m) || (!revEntry.isManual && revEntry.revenue > 100000)) {
          const brendiOrdersThisMonth = (brendiOrders || []).filter(o => {
            const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
            return !isCancelled && (o.createdAt || '').slice(0, 7) === m;
          });

          const brendiRevenueRealtime = brendiOrdersThisMonth.reduce((sum, o) => sum + Number(o.total || 0), 0);

          if (brendiRevenueRealtime > 0) {
            updatedRevList[idx] = {
              ...revEntry,
              revenue: brendiRevenueRealtime,
              source: 'integration',
              isManual: false,
              updatedAt: new Date().toISOString()
            };
          } else {
            const consolidatedForMonth = (prev.brendiConsolidatedReports || []).find(r => r.period.monthKey === m);
            if (consolidatedForMonth && consolidatedForMonth.metrics.totalSales > 0) {
              updatedRevList[idx] = {
                ...revEntry,
                revenue: consolidatedForMonth.metrics.totalSales,
                source: 'integration',
                isManual: false,
                updatedAt: new Date().toISOString()
              };
            } else {
              const validMonthTotal = validTransactions
                .filter(vt => (vt.date || '').slice(0, 7) === m)
                .reduce((acc, vt) => acc + ((vt.pricePaidByCustomer || 0) + (vt.platformSubsidy || 0)) * (vt.qty || 1), 0);

              updatedRevList[idx] = {
                ...revEntry,
                revenue: validMonthTotal,
                source: 'integration',
                isManual: false,
                updatedAt: new Date().toISOString()
              };
            }
          }
        }
      });

      return {
        ...prev,
        salesTransactions: validTransactions,
        monthlyRevenue: updatedRevList
      };
    });

    return { removedCount, affectedMonths: Array.from(affectedMonths) };
  };
  
  const addSupplierMapping = (mapping: SupplierMapping) => setState(s => {
    const filtered = s.supplierMappings.filter(m => !(m.cnpj === mapping.cnpj && m.xmlItemName === mapping.xmlItemName));
    return { ...s, supplierMappings: [...filtered, mapping] };
  });

  const updateIngredientPriceFromXML = (ingredientId: string, newPrice: number) => {
    setState(s => ({
      ...s,
      ingredients: s.ingredients.map(ing => ing.id === ingredientId ? { ...ing, price: newPrice } : ing)
    }));
  };

  const setFixedCostMode = (mode: FixedCostMode) => setState(s => ({ ...s, fixedCostMode: mode }));

  const resetSystem = () => {
    setState(s => ({
      ...EMPTY_STATE,
      storeInfo: s.storeInfo,
      resetPassword: s.resetPassword // Keep the current password even after reset
    }));
  };

  const updateResetPassword = (newPassword: string) => {
    setState(s => ({ ...s, resetPassword: newPassword }));
  };

  // --- COLLABORATORS ACTIONS ---
  const addCollaborator = (collab: Collaborator) => {
    setState(s => ({
      ...s,
      collaborators: [...(s.collaborators || []), collab]
    }));
  };

  const updateCollaborator = (id: string, data: Partial<Collaborator>) => {
    setState(s => ({
      ...s,
      collaborators: (s.collaborators || []).map(c => c.id === id ? { ...c, ...data } : c)
    }));
  };

  const deleteCollaborator = (id: string) => {
    setState(s => ({
      ...s,
      collaborators: (s.collaborators || []).filter(c => c.id !== id)
    }));
  };

  const addCustomCollaboratorRole = (roleName: string) => {
    const trimmed = roleName.trim();
    if (!trimmed) return;
    setState(s => {
      const existing = s.customCollaboratorRoles || [];
      if (existing.includes(trimmed)) return s;
      return {
        ...s,
        customCollaboratorRoles: [...existing, trimmed]
      };
    });
  };

  const helperSyncPaymentToExpenses = (payment: CollaboratorPayment, currentExpenses: Expense[]): { updatedExpenses: Expense[], linkedExpId?: string } => {
    if (payment.baseAmount <= 0) {
      if (payment.linkedExpenseId) {
        return {
          updatedExpenses: currentExpenses.filter(e => e.id !== payment.linkedExpenseId),
          linkedExpId: undefined
        };
      }
      return { updatedExpenses: currentExpenses, linkedExpId: undefined };
    }

    const expId = payment.linkedExpenseId || `exp_collab_${payment.id}`;
    const monthStr = payment.date.slice(0, 7);

    let expCategory = 'Mão de obra Não Contratada (Extras)';
    if (payment.remunerationType === 'pro_labore') {
      expCategory = 'Pró-labore';
    } else if (payment.remunerationType === 'salario') {
      expCategory = 'Salário dos Funcionários';
    }

    const expenseObj: Expense = {
      id: expId,
      month: monthStr,
      description: `Mão de Obra (${payment.collaboratorName} - ${payment.collaboratorRole})`,
      value: payment.baseAmount,
      category: expCategory,
      dueDate: payment.date,
      paid: payment.status === 'pago'
    };

    const existingIdx = currentExpenses.findIndex(e => e.id === expId);
    let updatedExpenses: Expense[];
    if (existingIdx >= 0) {
      updatedExpenses = [...currentExpenses];
      updatedExpenses[existingIdx] = expenseObj;
    } else {
      updatedExpenses = [...currentExpenses, expenseObj];
    }

    return { updatedExpenses, linkedExpId: expId };
  };

  const addCollaboratorPayment = (payment: CollaboratorPayment, options?: { skipExpenseSync?: boolean }) => {
    setState(s => {
      let currentExpenses = s.expenses || [];
      let linkedExpId = payment.linkedExpenseId;

      if (!options?.skipExpenseSync) {
        const syncRes = helperSyncPaymentToExpenses(payment, currentExpenses);
        currentExpenses = syncRes.updatedExpenses;
        linkedExpId = syncRes.linkedExpId;
      }

      const totalPaid = payment.totalPaid ?? Math.max(0, (payment.baseAmount + payment.deliveryFeeAmount) - (payment.mealDeduction || 0));
      const amountPaid = payment.amountPaid !== undefined ? payment.amountPaid : (payment.status === 'pago' ? totalPaid : 0);
      const pendingBalance = payment.pendingBalance !== undefined ? payment.pendingBalance : (payment.status === 'pago' ? 0 : Math.max(0, totalPaid - amountPaid));

      const paymentWithLink: CollaboratorPayment = {
        ...payment,
        totalPaid,
        amountPaid,
        pendingBalance,
        linkedExpenseId: linkedExpId
      };

      return {
        ...s,
        expenses: currentExpenses,
        collaboratorPayments: [...(s.collaboratorPayments || []), paymentWithLink]
      };
    });
  };

  const addCollaboratorPaymentsBatch = (
    payments: CollaboratorPayment[],
    options?: { consolidateToExpenses?: boolean; consolidatedTitle?: string; expenseCategory?: string }
  ) => {
    setState(s => {
      let currentExpenses = [...(s.expenses || [])];
      const finalPayments: CollaboratorPayment[] = [];

      if (options?.consolidateToExpenses) {
        // Calculate total fixed labor (baseAmount) - ONLY base amounts enter expenses, delivery fees DO NOT!
        const totalBaseAmount = payments.reduce((acc, p) => acc + (Number(p.baseAmount) || 0), 0);
        const refDate = payments[0]?.date || new Date().toISOString().slice(0, 10);
        const monthStr = refDate.slice(0, 7);

        let consolidatedExpId: string | undefined = undefined;
        if (totalBaseAmount > 0) {
          consolidatedExpId = `exp_collab_batch_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
          const allPaid = payments.every(p => p.status === 'pago');
          const title = options.consolidatedTitle || `👥 Fechamento Mão de Obra — ${refDate.split('-').reverse().join('/')} (${payments.length} colab.)`;

          const consExpense: Expense = {
            id: consolidatedExpId,
            month: monthStr,
            description: title,
            value: totalBaseAmount,
            category: options.expenseCategory || 'Mão de obra Não Contratada (Extras)',
            dueDate: refDate,
            paid: allPaid
          };
          currentExpenses.push(consExpense);
        }

        payments.forEach(p => {
          const tot = p.totalPaid ?? Math.max(0, (p.baseAmount + p.deliveryFeeAmount) - (p.mealDeduction || 0));
          const amtPaid = p.amountPaid !== undefined ? p.amountPaid : (p.status === 'pago' ? tot : 0);
          const pndBal = p.pendingBalance !== undefined ? p.pendingBalance : (p.status === 'pago' ? 0 : Math.max(0, tot - amtPaid));

          finalPayments.push({
            ...p,
            totalPaid: tot,
            amountPaid: amtPaid,
            pendingBalance: pndBal,
            consolidatedExpenseId: consolidatedExpId,
            linkedExpenseId: undefined
          });
        });
      } else {
        // Individual linking (legacy / standard)
        payments.forEach(p => {
          const { updatedExpenses, linkedExpId } = helperSyncPaymentToExpenses(p, currentExpenses);
          currentExpenses = updatedExpenses;
          const tot = p.totalPaid ?? Math.max(0, (p.baseAmount + p.deliveryFeeAmount) - (p.mealDeduction || 0));
          const amtPaid = p.amountPaid !== undefined ? p.amountPaid : (p.status === 'pago' ? tot : 0);
          const pndBal = p.pendingBalance !== undefined ? p.pendingBalance : (p.status === 'pago' ? 0 : Math.max(0, tot - amtPaid));

          finalPayments.push({
            ...p,
            totalPaid: tot,
            amountPaid: amtPaid,
            pendingBalance: pndBal,
            linkedExpenseId: linkedExpId
          });
        });
      }

      return {
        ...s,
        expenses: currentExpenses,
        collaboratorPayments: [...(s.collaboratorPayments || []), ...finalPayments]
      };
    });
  };

  const updateCollaboratorPaymentStatus = (
    id: string,
    status: 'pago' | 'pendente' | 'parcial',
    updateData?: { amountPaid?: number; paymentMethod?: PaymentMethod; paymentDate?: string }
  ) => {
    setState(s => {
      const target = (s.collaboratorPayments || []).find(p => p.id === id);
      if (!target) return s;

      const newPaymentDate = status === 'pago' || status === 'parcial'
        ? (updateData?.paymentDate || new Date().toISOString().slice(0, 10))
        : undefined;

      const updatedPayments = (s.collaboratorPayments || []).map(p => {
        if (p.id === id) {
          const totalPaid = p.totalPaid ?? Math.max(0, (p.baseAmount + p.deliveryFeeAmount) - (p.mealDeduction || 0));
          let amountPaid = updateData?.amountPaid !== undefined ? updateData.amountPaid : p.amountPaid;
          if (status === 'pago') amountPaid = totalPaid;
          if (status === 'pendente') amountPaid = 0;
          const pendingBalance = Math.max(0, totalPaid - (amountPaid || 0));

          return {
            ...p,
            status,
            amountPaid,
            pendingBalance,
            paymentDate: newPaymentDate,
            paymentMethod: updateData?.paymentMethod || p.paymentMethod
          };
        }
        return p;
      });

      let updatedExpenses = s.expenses || [];

      // If individual linked expense
      if (target.linkedExpenseId) {
        updatedExpenses = updatedExpenses.map(e => e.id === target.linkedExpenseId ? { ...e, paid: status === 'pago' } : e);
      }

      // If part of consolidated batch
      if (target.consolidatedExpenseId) {
        const batchPayments = updatedPayments.filter(p => p.consolidatedExpenseId === target.consolidatedExpenseId);
        const allBatchPaid = batchPayments.every(p => p.status === 'pago');
        updatedExpenses = updatedExpenses.map(e => e.id === target.consolidatedExpenseId ? { ...e, paid: allBatchPaid } : e);
      }

      return {
        ...s,
        expenses: updatedExpenses,
        collaboratorPayments: updatedPayments
      };
    });
  };

  const deleteCollaboratorPayment = (id: string) => {
    setState(s => {
      const target = (s.collaboratorPayments || []).find(p => p.id === id);
      const updatedPayments = (s.collaboratorPayments || []).filter(p => p.id !== id);

      let updatedExpenses = s.expenses || [];
      if (target) {
        if (target.linkedExpenseId) {
          updatedExpenses = updatedExpenses.filter(e => e.id !== target.linkedExpenseId);
        } else if (target.consolidatedExpenseId) {
          // Adjust consolidated expense value
          const otherInBatch = updatedPayments.filter(p => p.consolidatedExpenseId === target.consolidatedExpenseId);
          if (otherInBatch.length === 0) {
            updatedExpenses = updatedExpenses.filter(e => e.id !== target.consolidatedExpenseId);
          } else {
            const newTotalBase = otherInBatch.reduce((sum, p) => sum + (Number(p.baseAmount) || 0), 0);
            if (newTotalBase <= 0) {
              updatedExpenses = updatedExpenses.filter(e => e.id !== target.consolidatedExpenseId);
            } else {
              const allBatchPaid = otherInBatch.every(p => p.status === 'pago');
              updatedExpenses = updatedExpenses.map(e => e.id === target.consolidatedExpenseId ? {
                ...e,
                value: newTotalBase,
                paid: allBatchPaid,
                description: e.description.replace(/\(\d+ colab\.\)/, `(${otherInBatch.length} colab.)`)
              } : e);
            }
          }
        }
      }

      return {
        ...s,
        expenses: updatedExpenses,
        collaboratorPayments: updatedPayments
      };
    });
  };

  const closeCollaboratorPayments = (params: {
    paymentIds: string[];
    amountToPay?: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    consolidateToExpenses?: boolean;
    consolidatedTitle?: string;
    expenseCategory?: string;
    notes?: string;
  }) => {
    setState(s => {
      const targetIds = new Set(params.paymentIds);
      const targetPayments = (s.collaboratorPayments || []).filter(p => targetIds.has(p.id));
      if (targetPayments.length === 0) return s;

      let currentExpenses = [...(s.expenses || [])];
      let consExpId: string | undefined = undefined;

      const totalBase = targetPayments.reduce((acc, p) => acc + (Number(p.baseAmount) || 0), 0);

      if (params.consolidateToExpenses && totalBase > 0) {
        consExpId = `exp_collab_batch_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
        const refMonth = params.paymentDate.slice(0, 7);
        const consTitle = params.consolidatedTitle || `👥 Pagamento Mão de Obra — ${params.paymentDate.split('-').reverse().join('/')} (${targetPayments.length} colab.)`;

        const newConsExpense: Expense = {
          id: consExpId,
          month: refMonth,
          description: consTitle,
          value: totalBase,
          category: params.expenseCategory || 'Mão de obra Não Contratada (Extras)',
          dueDate: params.paymentDate,
          paid: true
        };
        currentExpenses.push(newConsExpense);

        // Clean up individual linked expenses if any existed to avoid duplication
        const oldIndividualIds = new Set(targetPayments.map(p => p.linkedExpenseId).filter(Boolean));
        if (oldIndividualIds.size > 0) {
          currentExpenses = currentExpenses.filter(e => !oldIndividualIds.has(e.id));
        }
      }

      const updatedPayments = (s.collaboratorPayments || []).map(p => {
        if (!targetIds.has(p.id)) return p;
        const total = p.totalPaid ?? Math.max(0, (p.baseAmount + p.deliveryFeeAmount) - (p.mealDeduction || 0));
        return {
          ...p,
          status: 'pago' as const,
          amountPaid: total,
          pendingBalance: 0,
          paymentDate: params.paymentDate,
          paymentMethod: params.paymentMethod,
          notes: params.notes ? (p.notes ? `${p.notes} | ${params.notes}` : params.notes) : p.notes,
          consolidatedExpenseId: consExpId || p.consolidatedExpenseId,
          linkedExpenseId: consExpId ? undefined : p.linkedExpenseId
        };
      });

      // If not consolidated into a new batch expense, update individual linked expenses
      if (!consExpId) {
        targetPayments.forEach(tp => {
          if (tp.linkedExpenseId) {
            currentExpenses = currentExpenses.map(e => e.id === tp.linkedExpenseId ? { ...e, paid: true } : e);
          }
        });
      }

      return {
        ...s,
        expenses: currentExpenses,
        collaboratorPayments: updatedPayments
      };
    });
  };

  const consolidateLegacyCollaboratorExpenses = (): { consolidatedCount: number } => {
    let count = 0;
    setState(s => {
      const expenses = s.expenses || [];
      const legacyCollabExps = expenses.filter(e => e.id.startsWith('exp_collab_') && !e.id.startsWith('exp_collab_batch_'));
      if (legacyCollabExps.length <= 1) return s;

      // Group by month
      const byMonth: Record<string, Expense[]> = {};
      legacyCollabExps.forEach(e => {
        const m = e.month || 'sem_mes';
        if (!byMonth[m]) byMonth[m] = [];
        byMonth[m].push(e);
      });

      let updatedExpenses = [...expenses];
      let updatedPayments = [...(s.collaboratorPayments || [])];

      Object.entries(byMonth).forEach(([month, exps]) => {
        if (exps.length <= 1) return;
        const totalVal = exps.reduce((sum, e) => sum + Number(e.value || 0), 0);
        const allPaid = exps.every(e => e.paid);
        const newBatchId = `exp_collab_batch_${month}_${Date.now().toString(36)}`;
        const legacyIds = new Set(exps.map(e => e.id));

        const batchExp: Expense = {
          id: newBatchId,
          month,
          description: `👥 Mão de Obra Consolidada — ${month} (${exps.length} lançamentos)`,
          value: totalVal,
          category: 'Mão de obra Não Contratada (Extras)',
          dueDate: `${month}-28`,
          paid: allPaid
        };

        // Replace individual expenses with single consolidated expense
        updatedExpenses = updatedExpenses.filter(e => !legacyIds.has(e.id));
        updatedExpenses.push(batchExp);

        // Update linked payments
        updatedPayments = updatedPayments.map(p => {
          if (p.linkedExpenseId && legacyIds.has(p.linkedExpenseId)) {
            return {
              ...p,
              linkedExpenseId: undefined,
              consolidatedExpenseId: newBatchId
            };
          }
          return p;
        });

        count += exps.length;
      });

      return {
        ...s,
        expenses: updatedExpenses,
        collaboratorPayments: updatedPayments
      };
    });
    return { consolidatedCount: count };
  };

  // --- COLLABORATOR MEALS & BENEFITS ACTIONS ---
  const addCollaboratorMeal = (meal: CollaboratorMeal) => {
    setState(s => ({
      ...s,
      collaboratorMeals: [...(s.collaboratorMeals || []), meal]
    }));
  };

  const updateCollaboratorMeal = (id: string, mealData: Partial<CollaboratorMeal>) => {
    setState(s => ({
      ...s,
      collaboratorMeals: (s.collaboratorMeals || []).map(m => m.id === id ? { ...m, ...mealData } : m)
    }));
  };

  const deleteCollaboratorMeal = (id: string) => {
    setState(s => ({
      ...s,
      collaboratorMeals: (s.collaboratorMeals || []).filter(m => m.id !== id)
    }));
  };

  const addCollaboratorMealsBatch = (meals: CollaboratorMeal[]) => {
    setState(s => ({
      ...s,
      collaboratorMeals: [...(s.collaboratorMeals || []), ...meals]
    }));
  };

  // --- CALCULATIONS ---
  
  const getIngredientRealCost = (ing: Ingredient, visited = new Set<string>()): number => {
    if (!ing.packageQuantity || ing.packageQuantity <= 0) return 0;
    
    if (visited.has(ing.id)) return 0; // Prevent circular dependencies
    visited.add(ing.id);

    let basePrice = ing.price;
    if (ing.isSubRecipe && ing.ingredients) {
      basePrice = ing.ingredients.reduce((total, item) => {
        const subIng = state.ingredients.find(i => i.id === item.ingredientId);
        if (!subIng) return total;
        const realPrice = getIngredientRealCost(subIng, new Set(visited));
        return total + (realPrice * item.quantity);
      }, 0);
    }

    const realQty = ing.packageQuantity * (1 - (ing.lossPercent / 100));
    if (realQty <= 0) return 0;
    return basePrice / realQty;
  };

  const getProductCMV = (prod: Product) => {
    return (prod.ingredients || []).reduce((total, item) => {
      const ing = state.ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return total;
      const realPrice = getIngredientRealCost(ing);
      return total + (realPrice * item.quantity);
    }, 0);
  };

  const calculateFixedCostPercent = (currentMonth?: string) => {
    // Ensure arrays are present before reducing
    const safeExpenses = state.expenses || [];
    const safeRevenue = state.monthlyRevenue || [];

    if (state.fixedCostMode === 'AVERAGE') {
       // 1. Get months with valid revenue (> 0)
       const activeRevenueMonths = safeRevenue
          .filter(r => Number(r.revenue) > 0)
          .sort((a, b) => a.month.localeCompare(b.month));
          
       // 2. Consider only the last 12 active months
       const last12 = activeRevenueMonths.slice(-12);
       
       if (last12.length === 0) return 0;

       let totalFixedCost = 0;
       let totalRevenue = 0;
       
       // 3. Sum Cost and Revenue for these specific months
       last12.forEach(m => {
          const monthCost = safeExpenses
            .filter(e => e.month === m.month)
            .reduce((sum, e) => sum + Number(e.value), 0);
          
          totalFixedCost += monthCost;
          totalRevenue += Number(m.revenue);
       });
       
       if (totalRevenue === 0) return 0;
       
       // 4. Calculate %
       return (totalFixedCost / totalRevenue) * 100;

    } else {
        // Mode: CURRENT_MONTH
        const targetMonth = currentMonth || new Date().toISOString().slice(0, 7);
        
        const totalFixedCost = safeExpenses
            .filter(e => e.month === targetMonth)
            .reduce((sum, e) => sum + Number(e.value), 0);
            
        const revenueEntry = safeRevenue.find(r => r.month === targetMonth);
        const revenue = revenueEntry ? Number(revenueEntry.revenue) : 0;
        
        if (revenue === 0) return 0;
        
        return (totalFixedCost / revenue) * 100;
    }
  };

  const calculateTotalCfiPercent = () => {
    const fixedCostPct = calculateFixedCostPercent();
    const avgCardRate = (state.cfi.debitTax + state.cfi.creditTax) / 2;
    return fixedCostPct + avgCardRate + state.cfi.tax + state.cfi.royalties + state.cfi.marketing + state.cfi.voucherTax;
  };

  const getSortedProducts = () => {
      const catOrderMap: Record<string, number> = {};
      (state.menuCategories || []).forEach(c => catOrderMap[c.name] = c.order);

      return [...(state.products || [])].sort((a, b) => {
          const orderA = catOrderMap[a.category] ?? 999;
          const orderB = catOrderMap[b.category] ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.order - b.order;
      });
  };

  const getCmvAvgPercent = (): number => {
    let totalPct = 0;
    let count = 0;

    const safeProducts = state.products || [];
    safeProducts.forEach(p => {
      const cost = getProductCMV(p);
      const price = p.fixedPriceStore || 0;
      if (p.ingredients && p.ingredients.length > 0 && cost > 0 && price > 0) {
        totalPct += (cost / price) * 100;
        count++;
      }
    });

    if (count > 0) {
      return totalPct / count;
    }
    return 35; // Default fallback to 35% if no valid complete data exists
  };

  const calculateBreakEven = (month: string): number => {
    const safeExpenses = state.expenses || [];
    const fixedCosts = safeExpenses
      .filter(e => e.month === month || !e.month)
      .reduce((sum, e) => sum + Number(e.value), 0);

    const avgCmvPercent = getCmvAvgPercent();
    const avgCardRate = (state.cfi.debitTax + state.cfi.creditTax) / 2;
    const totalVarCostsPct = avgCardRate + state.cfi.tax + state.cfi.royalties + state.cfi.marketing + state.cfi.voucherTax;

    const mcPct = 1 - ((avgCmvPercent + totalVarCostsPct) / 100);
    return mcPct > 0 ? fixedCosts / mcPct : 0;
  };

  const getComboCMV = (combo: Combo): number => {
    let cmvCombo = 0;
    const itemCosts: number[] = [];
    
    (combo.items || []).forEach(item => {
      const prod = (state.products || []).find(p => p.id === item.productId);
      if (prod) {
        itemCosts.push(getProductCMV(prod) * item.quantity);
      } else {
        itemCosts.push(0);
      }
    });

    if (combo.type === 'free_choice') {
      const sortedCosts = [...itemCosts].sort((a, b) => b - a);
      const freeChoiceCount = combo.freeChoiceCount || 2;
      cmvCombo = sortedCosts.slice(0, freeChoiceCount).reduce((acc, val) => acc + val, 0);
    } else {
      cmvCombo = itemCosts.reduce((acc, val) => acc + val, 0);
    }

    cmvCombo += (combo.customPackagingCost || 0);
    return cmvCombo;
  };

  const getRealtimeMonthMetrics = (monthKey?: string): RealtimeMonthMetrics => {
    const targetMonth = monthKey || new Date().toISOString().slice(0, 7);

    // 1. Monthly Revenue
    const manualRevEntry = (state.monthlyRevenue || []).find(r => r.month === targetMonth);
    const manualRevenue = manualRevEntry ? Number(manualRevEntry.revenue) : 0;

    // Filter non-cancelled Brendi orders for target month
    const validBrendiOrders = (brendiOrders || []).filter(o => {
      const m = (o.createdAt || '').slice(0, 7);
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      return m === targetMonth && !isCancelled;
    });

    const brendiRevenue = validBrendiOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const brendiOrdersCount = validBrendiOrders.length;

    // Effective revenue for this month
    const effectiveRevenue = Math.max(manualRevenue, brendiRevenue);

    // Order Count
    let orderCount = brendiOrdersCount;
    if (orderCount === 0) {
      try {
        const saved = localStorage.getItem('lucro_facil_be_monthly_orders_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          orderCount = Number(parsed[targetMonth]) || 0;
        }
      } catch (e) {}
    }
    const ticketMedio = orderCount > 0 && effectiveRevenue > 0 ? effectiveRevenue / orderCount : 0;

    // 2. Real CMV of sold items
    let cmvTotalInsumos = 0;
    let itemsSoldRevenue = 0;

    const productMap = new Map<string, Product>();
    (state.products || []).forEach(p => {
      productMap.set(p.name.trim().toLowerCase(), p);
      if (p.id) productMap.set(p.id, p);
    });

    const comboMap = new Map<string, Combo>();
    (state.combos || []).forEach(c => {
      comboMap.set(c.name.trim().toLowerCase(), c);
      if (c.id) comboMap.set(c.id, c);
    });

    const avgCmvFallbackPct = getCmvAvgPercent();

    // From Brendi orders
    validBrendiOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const rawName = (it.name || '').trim().toLowerCase();
        const qty = Number(it.quantity) || 1;
        const lineTotal = Number(it.totalPrice) || ((Number(it.unitPrice) || 0) * qty);
        itemsSoldRevenue += lineTotal;

        const prod = productMap.get(rawName);
        const combo = comboMap.get(rawName);

        if (prod) {
          const unitCmv = getProductCMV(prod);
          cmvTotalInsumos += (unitCmv * qty);
        } else if (combo) {
          const unitCmv = getComboCMV(combo);
          cmvTotalInsumos += (unitCmv * qty);
        } else {
          cmvTotalInsumos += lineTotal * (avgCmvFallbackPct / 100);
        }
      });
    });

    // Also include salesTransactions for this month
    const monthSalesTrans = (state.salesTransactions || []).filter(t => {
      const m = (t.date || '').slice(0, 7);
      const isFromBrendi = t.id?.startsWith('brendi_') || (t as any).orderId;
      return m === targetMonth && !isFromBrendi;
    });

    monthSalesTrans.forEach(t => {
      const rawName = (t.productName || '').trim().toLowerCase();
      const qty = Number(t.quantity) || 1;
      const lineTotal = Number(t.total) || ((Number(t.price) || 0) * qty);
      itemsSoldRevenue += lineTotal;

      const prod = productMap.get(rawName);
      const combo = comboMap.get(rawName);

      if (prod) {
        cmvTotalInsumos += (getProductCMV(prod) * qty);
      } else if (combo) {
        cmvTotalInsumos += (getComboCMV(combo) * qty);
      } else {
        cmvTotalInsumos += lineTotal * (avgCmvFallbackPct / 100);
      }
    });

    // Fallback if no itemized sales but revenue is entered manually
    if (effectiveRevenue > itemsSoldRevenue && itemsSoldRevenue === 0) {
      cmvTotalInsumos = effectiveRevenue * (avgCmvFallbackPct / 100);
    }

    // 3. Fixed Costs / CFI
    const fixedCosts = (state.expenses || [])
      .filter(e => e.month === targetMonth || !e.month)
      .reduce((sum, e) => sum + Number(e.value || 0), 0);

    const cfiPercent = calculateTotalCfiPercent();

    // 4. Net Profit Real in R$ (Faturamento - CMV Real Insumos - Custos Fixos)
    const netProfitReal = effectiveRevenue - cmvTotalInsumos - fixedCosts;
    const profitMargin = effectiveRevenue > 0 ? (netProfitReal / effectiveRevenue) * 100 : 0;
    const cmvPercentAvg = effectiveRevenue > 0 ? (cmvTotalInsumos / effectiveRevenue) * 100 : avgCmvFallbackPct;

    // 5. Break-even
    const breakEvenR$ = calculateBreakEven(targetMonth);
    const gapToBe = Math.max(0, breakEvenR$ - effectiveRevenue);
    const isBreakEvenReached = effectiveRevenue >= breakEvenR$ && breakEvenR$ > 0;

    const lastOrderAt = validBrendiOrders[0]?.createdAt;

    return {
      monthKey: targetMonth,
      revenue: effectiveRevenue,
      manualRevenue,
      brendiRevenue,
      orderCount,
      ticketMedio,
      cmvTotalInsumos,
      cmvPercentAvg,
      fixedCosts,
      cfiPercent,
      netProfitReal,
      profitMargin,
      breakEvenR$,
      gapToBe,
      isBreakEvenReached,
      brendiOrdersCount,
      isRealtimeActive: brendiOrdersCount > 0,
      lastOrderAt
    };
  };

  const getCategoryRanking = (monthKey?: string): CategoryRankingItem[] => {
    const targetMonth = monthKey || new Date().toISOString().slice(0, 7);

    // Filter non-cancelled Brendi orders for this month
    const validBrendiOrders = (brendiOrders || []).filter(o => {
      const m = (o.createdAt || '').slice(0, 7);
      const isCancelled = o.status === 'CANCELLED' || o.status === 'CANCELLATION_REQUESTED';
      return m === targetMonth && !isCancelled;
    });

    const itemMap = new Map<string, {
      rawName: string;
      totalQty: number;
      totalRevenue: number;
    }>();

    // Aggregate from Brendi orders
    validBrendiOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const rawName = (it.name || 'Produto').trim();
        const normKey = rawName.toLowerCase();
        const qty = Number(it.quantity) || 1;
        const lineTotal = Number(it.totalPrice) || ((Number(it.unitPrice) || 0) * qty);

        const curr = itemMap.get(normKey) || { rawName, totalQty: 0, totalRevenue: 0 };
        curr.totalQty += qty;
        curr.totalRevenue += lineTotal;
        itemMap.set(normKey, curr);
      });
    });

    // Also aggregate from salesTransactions for this month
    const monthSalesTrans = (state.salesTransactions || []).filter(t => {
      const m = (t.date || '').slice(0, 7);
      const isFromBrendi = t.id?.startsWith('brendi_') || (t as any).orderId;
      return m === targetMonth && !isFromBrendi;
    });

    monthSalesTrans.forEach(t => {
      const rawName = (t.productName || 'Produto').trim();
      const normKey = rawName.toLowerCase();
      const qty = Number(t.quantity) || 1;
      const lineTotal = Number(t.total) || ((Number(t.price) || 0) * qty);

      const curr = itemMap.get(normKey) || { rawName, totalQty: 0, totalRevenue: 0 };
      curr.totalQty += qty;
      curr.totalRevenue += lineTotal;
      itemMap.set(normKey, curr);
    });

    // Lookup maps
    const productMap = new Map<string, Product>();
    (state.products || []).forEach(p => {
      productMap.set(p.name.trim().toLowerCase(), p);
    });

    const comboMap = new Map<string, Combo>();
    (state.combos || []).forEach(c => {
      comboMap.set(c.name.trim().toLowerCase(), c);
    });

    const totalMonthRevenue = Array.from(itemMap.values()).reduce((sum, it) => sum + it.totalRevenue, 0);
    const monthFixedCosts = (state.expenses || [])
      .filter(e => e.month === targetMonth || !e.month)
      .reduce((sum, e) => sum + Number(e.value || 0), 0);

    const avgCmvPercentFallback = getCmvAvgPercent();

    // If no sales yet, populate ranking from registered products so the user can analyze menu items
    if (itemMap.size === 0 && (state.products || []).length > 0) {
      (state.products || []).forEach(p => {
        itemMap.set(p.name.trim().toLowerCase(), {
          rawName: p.name,
          totalQty: 0,
          totalRevenue: 0
        });
      });
    }

    const rankingList: CategoryRankingItem[] = [];

    itemMap.forEach((entry, normKey) => {
      const prod = productMap.get(normKey);
      const combo = comboMap.get(normKey);

      let id = entry.rawName;
      let name = entry.rawName;
      let category = 'Outros';
      let itemType: 'product' | 'combo' | 'unregistered' = 'unregistered';
      let unitCmv = 0;
      let hasFichaTecnica = false;

      if (prod) {
        id = prod.id;
        name = prod.name;
        category = prod.category || 'Hambúrgueres';
        itemType = 'product';
        unitCmv = getProductCMV(prod);
        hasFichaTecnica = Boolean(prod.ingredients && prod.ingredients.length > 0 && unitCmv > 0);
      } else if (combo) {
        id = combo.id;
        name = combo.name;
        category = combo.category || 'Combos';
        itemType = 'combo';
        unitCmv = getComboCMV(combo);
        hasFichaTecnica = true;
      } else {
        unitCmv = entry.totalQty > 0 ? (entry.totalRevenue / entry.totalQty) * (avgCmvPercentFallback / 100) : 0;
      }

      const totalQty = entry.totalQty;
      const totalRevenue = entry.totalRevenue;
      const avgPrice = totalQty > 0 ? totalRevenue / totalQty : (prod?.fixedPriceStore || 0);
      const totalCmv = unitCmv * (totalQty > 0 ? totalQty : 1);
      const cmvPercent = avgPrice > 0 ? (unitCmv / avgPrice) * 100 : avgCmvPercentFallback;
      const grossProfit = totalRevenue > 0 ? (totalRevenue - (unitCmv * totalQty)) : (avgPrice - unitCmv);

      // Parcela proporcional do Custo Fixo
      const fixedCostShare = totalMonthRevenue > 0 ? (totalRevenue / totalMonthRevenue) * monthFixedCosts : 0;
      const netProfit = grossProfit - fixedCostShare;
      const netMarginPercent = (totalRevenue > 0 ? totalRevenue : avgPrice) > 0
        ? (netProfit / (totalRevenue > 0 ? totalRevenue : avgPrice)) * 100
        : 0;

      rankingList.push({
        id,
        name,
        category,
        type: itemType,
        totalQty,
        totalRevenue,
        avgPrice,
        unitCmv,
        totalCmv: unitCmv * totalQty,
        cmvPercent,
        grossProfit,
        fixedCostShare,
        netProfit,
        netMarginPercent,
        rankOverall: 0,
        rankCategory: 0,
        decision: 'continue',
        recommendation: '',
        hasFichaTecnica
      });
    });

    // Sort by totalQty desc (or totalRevenue desc)
    rankingList.sort((a, b) => {
      if (b.totalQty !== a.totalQty) return b.totalQty - a.totalQty;
      return b.totalRevenue - a.totalRevenue;
    });

    // Calculate volume threshold for classification
    const maxQty = rankingList.length > 0 ? rankingList[0].totalQty : 0;
    const highVolumeThreshold = Math.max(1, maxQty * 0.3);

    rankingList.forEach((item, idx) => {
      item.rankOverall = idx + 1;

      const isHighVolume = item.totalQty >= highVolumeThreshold;
      const isGoodMargin = item.cmvPercent <= 35 && item.netProfit > 0;
      const isCriticalCmv = item.cmvPercent > 38;

      if (isHighVolume && isGoodMargin) {
        item.decision = 'continue';
        item.recommendation = '🏆 Campeão de Lucro! Alta saída e excelente margem. Mantenha em destaque no cardápio!';
      } else if (isHighVolume && isCriticalCmv) {
        item.decision = 'save_margin';
        item.recommendation = '⚠️ Salva-Margem Urgente! Vende muito mas margem está espremida. Combine com batata/refri turbinado!';
      } else if (!isHighVolume && isGoodMargin) {
        item.decision = 'potential';
        item.recommendation = '💎 Alta Rentabilidade! Margem excelente mas pouca saída. Melhore a foto e coloque no topo do cardápio!';
      } else {
        item.decision = 'remove';
        item.recommendation = '❌ Candidato a Retirada. Vende pouco e gera pouco lucro ou prejuízo. Reformule a receita ou retire do cardápio.';
      }
    });

    // Category Rank
    const categoryCountMap: Record<string, number> = {};
    rankingList.forEach(item => {
      const cat = item.category || 'Outros';
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
      item.rankCategory = categoryCountMap[cat];
    });

    return rankingList;
  };

  // Accounts Receivable Actions
  const addAccountReceivable = (item: AccountReceivable) => {
    setState(s => ({
      ...s,
      accountsReceivable: [...(s.accountsReceivable || []), item]
    }));
  };

  const updateAccountReceivable = (id: string, itemData: Partial<AccountReceivable>) => {
    setState(s => ({
      ...s,
      accountsReceivable: (s.accountsReceivable || []).map(ar => 
        ar.id === id ? { ...ar, ...itemData, updatedAt: new Date().toISOString() } : ar
      )
    }));
  };

  const markAccountReceivableAsReceived = (id: string, receivedDate?: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateToUse = receivedDate || todayStr;
    setState(s => ({
      ...s,
      accountsReceivable: (s.accountsReceivable || []).map(ar => {
        if (ar.id !== id) return ar;
        const currentPayments = ar.payments || [];
        const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
        const remaining = Math.max(0, ar.amount - paidSoFar);

        const newPayments = [...currentPayments];
        if (remaining > 0) {
          newPayments.push({
            id: 'pay_' + Math.random().toString(36).substr(2, 9),
            amount: remaining,
            date: dateToUse,
            paymentMethod: 'pix',
            notes: 'Quitação total do título',
            createdAt: new Date().toISOString()
          });
        }

        return {
          ...ar,
          status: 'recebido' as const,
          receivedDate: dateToUse,
          payments: newPayments,
          updatedAt: new Date().toISOString()
        };
      })
    }));
  };

  const addReceivablePayment = (
    receivableId: string, 
    payment: { amount: number; date: string; paymentMethod: ReceivablePaymentMethod; notes?: string; nextDueDate?: string }
  ) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    setState(s => ({
      ...s,
      accountsReceivable: (s.accountsReceivable || []).map(ar => {
        if (ar.id !== receivableId) return ar;

        const currentPayments = ar.payments || [];
        const newPayment: AccountReceivablePayment = {
          id: 'pay_' + Math.random().toString(36).substr(2, 9),
          amount: payment.amount,
          date: payment.date || todayStr,
          paymentMethod: payment.paymentMethod,
          notes: payment.notes || undefined,
          createdAt: new Date().toISOString()
        };

        const updatedPayments = [...currentPayments, newPayment];
        const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);

        let newStatus: ReceivableStatus = ar.status;
        let newDueDate = ar.dueDate;

        if (totalPaid >= ar.amount) {
          newStatus = 'recebido';
        } else if (totalPaid > 0) {
          newStatus = 'parcial';
          if (payment.nextDueDate) {
            newDueDate = payment.nextDueDate;
          }
        }

        return {
          ...ar,
          status: newStatus,
          dueDate: newDueDate,
          receivedDate: payment.date || todayStr,
          payments: updatedPayments,
          updatedAt: new Date().toISOString()
        };
      })
    }));
  };

  const deleteReceivablePayment = (receivableId: string, paymentId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);

    setState(s => ({
      ...s,
      accountsReceivable: (s.accountsReceivable || []).map(ar => {
        if (ar.id !== receivableId) return ar;

        const currentPayments = ar.payments || [];
        const updatedPayments = currentPayments.filter(p => p.id !== paymentId);
        const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);

        let newStatus: ReceivableStatus = 'a_receber';
        let lastReceivedDate: string | undefined = undefined;

        if (totalPaid >= ar.amount) {
          newStatus = 'recebido';
          lastReceivedDate = updatedPayments[updatedPayments.length - 1]?.date || todayStr;
        } else if (totalPaid > 0) {
          newStatus = 'parcial';
          lastReceivedDate = updatedPayments[updatedPayments.length - 1]?.date || todayStr;
        } else {
          if (ar.dueDate < todayStr) {
            newStatus = 'atrasado';
          } else {
            newStatus = 'a_receber';
          }
        }

        return {
          ...ar,
          status: newStatus,
          receivedDate: lastReceivedDate,
          payments: updatedPayments,
          updatedAt: new Date().toISOString()
        };
      })
    }));
  };

  const deleteAccountReceivable = (id: string) => {
    setState(s => ({
      ...s,
      accountsReceivable: (s.accountsReceivable || []).filter(ar => ar.id !== id)
    }));
  };

  const addCustomReceivableOrigin = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const defaultNames = ['fiado', 'ifood', '99food', 'keeta', 'brendi', 'venda para empresa', 'evento', 'encomenda', 'outro', 'fiado / cliente', 'evento / encomenda'];
    const existing = state.customReceivableOrigins || [];
    
    if (
      defaultNames.some(d => d.toLowerCase() === trimmed.toLowerCase()) ||
      existing.some(c => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return false;
    }

    const newOrigin: CustomReceivableOrigin = {
      id: 'cro_' + Math.random().toString(36).substr(2, 9),
      name: trimmed,
      active: true,
      createdAt: new Date().toISOString()
    };

    setState(s => ({
      ...s,
      customReceivableOrigins: [...(s.customReceivableOrigins || []), newOrigin]
    }));
    return true;
  };

  const updateCustomReceivableOrigin = (id: string, name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const defaultNames = ['fiado', 'ifood', '99food', 'keeta', 'brendi', 'venda para empresa', 'evento', 'encomenda', 'outro', 'fiado / cliente', 'evento / encomenda'];
    const existing = state.customReceivableOrigins || [];
    
    if (
      defaultNames.some(d => d.toLowerCase() === trimmed.toLowerCase()) ||
      existing.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return false;
    }

    setState(s => ({
      ...s,
      customReceivableOrigins: (s.customReceivableOrigins || []).map(cro => 
        cro.id === id ? { ...cro, name: trimmed } : cro
      )
    }));
    return true;
  };

  const toggleCustomReceivableOriginStatus = (id: string, active: boolean) => {
    setState(s => ({
      ...s,
      customReceivableOrigins: (s.customReceivableOrigins || []).map(cro => 
        cro.id === id ? { ...cro, active } : cro
      )
    }));
  };

  const deleteCustomReceivableOrigin = (id: string): { action: 'deleted' | 'disabled' } => {
    const target = (state.customReceivableOrigins || []).find(c => c.id === id);
    if (!target) return { action: 'deleted' };

    const isUsed = (state.accountsReceivable || []).some(ar => 
      ar.customOrigin === target.name || ar.origin === id as any
    );

    if (isUsed) {
      setState(s => ({
        ...s,
        customReceivableOrigins: (s.customReceivableOrigins || []).map(cro => 
          cro.id === id ? { ...cro, active: false } : cro
        )
      }));
      return { action: 'disabled' };
    } else {
      setState(s => ({
        ...s,
        customReceivableOrigins: (s.customReceivableOrigins || []).filter(cro => cro.id !== id)
      }));
      return { action: 'deleted' };
    }
  };

  // Variable Costs Actions
  const addVariableCost = (cost: VariableCost) => {
    setState(s => ({
      ...s,
      variableCosts: [
        ...(s.variableCosts || []),
        {
          ...cost,
          id: cost.id || 'cv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
          period: cost.period || cost.date.slice(0, 7),
          status: cost.status || 'Ativo',
          mode: cost.mode || 'Manual',
          createdAt: cost.createdAt || new Date().toISOString()
        }
      ]
    }));
  };

  const updateVariableCost = (id: string, costData: Partial<VariableCost>) => {
    setState(s => ({
      ...s,
      variableCosts: (s.variableCosts || []).map(c => 
        c.id === id ? { 
          ...c, 
          ...costData, 
          period: costData.date ? costData.date.slice(0, 7) : (costData.period || c.period),
          updatedAt: new Date().toISOString() 
        } : c
      )
    }));
  };

  const deleteVariableCost = (id: string) => {
    setState(s => ({
      ...s,
      variableCosts: (s.variableCosts || []).filter(c => c.id !== id)
    }));
  };

  const addVariableCostsBatch = (costs: VariableCost[]) => {
    if (!costs || costs.length === 0) return;
    setState(s => {
      const existing = s.variableCosts || [];
      const existingSourceIds = new Set(existing.map(c => c.sourceId).filter(Boolean));

      // Filter out duplicate sources if sourceId is provided
      const newItems = costs
        .filter(c => !c.sourceId || !existingSourceIds.has(c.sourceId))
        .map(cost => ({
          ...cost,
          id: cost.id || 'cv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
          period: cost.period || cost.date.slice(0, 7),
          status: cost.status || 'Ativo',
          createdAt: cost.createdAt || new Date().toISOString()
        }));

      return {
        ...s,
        variableCosts: [...existing, ...newItems]
      };
    });
  };

  // Sincronização automática com taxas de entrega dos colaboradores
  const importDeliveryFeesFromCollaborators = (period: string): { importedCount: number } => {
    const safePayments = state.collaboratorPayments || [];
    const safeVarCosts = state.variableCosts || [];
    const existingSourceIds = new Set(safeVarCosts.map(c => c.sourceId).filter(Boolean));

    // Encontra pagamentos com deliveryFeeAmount > 0 pertencentes ao período solicitado
    const eligiblePayments = safePayments.filter(p => {
      const pPeriod = p.date ? p.date.slice(0, 7) : '';
      const fee = Number(p.deliveryFeeAmount) || 0;
      return pPeriod === period && fee > 0 && !existingSourceIds.has(`collab_fee_${p.id}`);
    });

    if (eligiblePayments.length === 0) {
      return { importedCount: 0 };
    }

    const newCosts: VariableCost[] = eligiblePayments.map(p => {
      const collabName = p.collaboratorName || 'Entregador';
      const countStr = p.deliveryCount ? ` (${p.deliveryCount} entregas)` : '';
      return {
        id: 'cv_collab_' + p.id,
        date: p.date,
        category: 'TAXA_DE_ENTREGA' as const,
        description: `Taxa de entrega — ${collabName}${countStr}`,
        value: Number(p.deliveryFeeAmount) || 0,
        origin: 'Colaboradores' as const,
        mode: 'Automático' as const,
        period: p.date.slice(0, 7),
        status: 'Ativo' as const,
        sourceType: 'collaborator_payment',
        sourceId: `collab_fee_${p.id}`,
        notes: `Importado de Colaboradores: Pagamento ${p.id}`,
        createdAt: new Date().toISOString()
      };
    });

    setState(s => ({
      ...s,
      variableCosts: [...(s.variableCosts || []), ...newCosts]
    }));

    return { importedCount: newCosts.length };
  };

  return (
    <AppContext.Provider value={{
      ...state,
      addIngredient, updateIngredient, deleteIngredient,
      addIngredientCategory, updateIngredientCategory, deleteIngredientCategory, reorderIngredientCategory,
      addProduct, updateProduct, bulkUpdateProductsPricing, deleteProduct, reorderProduct,
      addMenuCategory, updateMenuCategory, deleteMenuCategory, reorderMenuCategory,
      addCombo, updateCombo, deleteCombo,
      addExpense, updateExpense, updateExpenseAndFutureInstallments, deleteExpense, addExpenseWithInstallments,
      addCategory, deleteCategory,
      addSupplier, deleteSupplier,
      updateCfi, updatePlatformConfig, updateMonthlyRevenue, updateStoreInfo,
      addPurchaseEntry, deletePurchaseEntry, addSupplierMapping, updateIngredientPriceFromXML,
      addSalesTransaction, addSalesTransactionsBatch, deleteSalesTransaction, clearSalesTransactions,
      clearSalesTransactionsByMonth, updateMonthlyRevenueFromIntegration,
      syncIfoodSubscriptionAndCampaign,
      addBrendiConsolidatedReport, removeBrendiConsolidatedReport, sanitizeCorruptedBrendiSales,
      addCollaborator, updateCollaborator, deleteCollaborator, addCustomCollaboratorRole,
      addCollaboratorPayment, addCollaboratorPaymentsBatch, updateCollaboratorPaymentStatus, deleteCollaboratorPayment,
      closeCollaboratorPayments, consolidateLegacyCollaboratorExpenses,
      addCollaboratorMeal, updateCollaboratorMeal, deleteCollaboratorMeal, addCollaboratorMealsBatch,
      addAccountReceivable, updateAccountReceivable, markAccountReceivableAsReceived, deleteAccountReceivable,
      addReceivablePayment, deleteReceivablePayment,
      addCustomReceivableOrigin, updateCustomReceivableOrigin, toggleCustomReceivableOriginStatus, deleteCustomReceivableOrigin,
      addVariableCost, updateVariableCost, deleteVariableCost, addVariableCostsBatch, importDeliveryFeesFromCollaborators,
      setFixedCostMode, resetSystem, updateResetPassword,
      getIngredientRealCost, getProductCMV, calculateFixedCostPercent, calculateTotalCfiPercent,
      getSortedProducts,
      getCmvAvgPercent,
      calculateBreakEven,
      brendiOrders,
      isBrendiSyncing,
      getComboCMV,
      getRealtimeMonthMetrics,
      getCategoryRanking
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
