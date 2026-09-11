
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { GlobalState, Ingredient, Product, Expense, MonthlyData, CfiConfig, PlatformConfig, Category, IngredientCategory, Supplier, FixedCostMode, Combo, StoreInfo, MenuCategory, PurchaseEntry, SupplierMapping, SalesTransaction, Collaborator, CollaboratorPayment, AccountReceivable, CustomReceivableOrigin, AccountReceivablePayment, ReceivablePaymentMethod, ReceivableStatus, BrendiOrder, CategoryRankingItem, RealtimeMonthMetrics } from '../types';
import { INITIAL_STATE, EMPTY_STATE, INITIAL_INGREDIENT_CATEGORIES } from '../constants';
import { useAuth } from './AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

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

  // Collaborators
  addCollaborator: (collab: Collaborator) => void;
  updateCollaborator: (id: string, collab: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;
  addCustomCollaboratorRole: (roleName: string) => void;
  addCollaboratorPayment: (payment: CollaboratorPayment) => void;
  addCollaboratorPaymentsBatch: (payments: CollaboratorPayment[]) => void;
  updateCollaboratorPaymentStatus: (id: string, status: 'pago' | 'pendente') => void;
  deleteCollaboratorPayment: (id: string) => void;

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
            salesTransactions: initialData.salesTransactions || [],
            ingredientCategories: initialData.ingredientCategories || INITIAL_INGREDIENT_CATEGORIES,
            collaborators: initialData.collaborators || [],
            collaboratorPayments: initialData.collaboratorPayments || [],
            customCollaboratorRoles: initialData.customCollaboratorRoles || [],
            accountsReceivable: initialData.accountsReceivable || [],
            customReceivableOrigins: initialData.customReceivableOrigins || [],
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

  const [brendiOrders, setBrendiOrders] = useState<BrendiOrder[]>([]);
  const [isBrendiSyncing, setIsBrendiSyncing] = useState<boolean>(false);

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

    // Synchronize state.monthlyRevenue if Brendi revenue is present
    setState(prev => {
      let stateChanged = false;
      const revList = [...(prev.monthlyRevenue || [])];

      Object.entries(monthlyMap).forEach(([m, data]) => {
        const idx = revList.findIndex(r => r.month === m);
        if (idx >= 0) {
          if (revList[idx].revenue < data.revenue) {
            revList[idx] = { ...revList[idx], revenue: data.revenue };
            stateChanged = true;
          }
        } else if (data.revenue > 0) {
          revList.push({ month: m, revenue: data.revenue });
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
        // Fallback to root collection if user subcollection is not yet populated
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
            }
          });
        } catch (e) {}
      }

      setBrendiOrders(list);
      setIsBrendiSyncing(false);
      syncRealtimeRevenueAndOrders(list);
    }, (error) => {
      console.warn('[AppContext] Real-time brendi_orders listener warning:', error);
      setIsBrendiSyncing(false);
    });

    return () => unsubscribe();
  }, [activeUserId]);

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

  const addCollaboratorPayment = (payment: CollaboratorPayment) => {
    setState(s => {
      const currentExpenses = s.expenses || [];
      const { updatedExpenses, linkedExpId } = helperSyncPaymentToExpenses(payment, currentExpenses);
      const paymentWithLink = { ...payment, linkedExpenseId: linkedExpId };
      return {
        ...s,
        expenses: updatedExpenses,
        collaboratorPayments: [...(s.collaboratorPayments || []), paymentWithLink]
      };
    });
  };

  const addCollaboratorPaymentsBatch = (payments: CollaboratorPayment[]) => {
    setState(s => {
      let currentExpenses = s.expenses || [];
      const finalPayments: CollaboratorPayment[] = [];

      payments.forEach(p => {
        const { updatedExpenses, linkedExpId } = helperSyncPaymentToExpenses(p, currentExpenses);
        currentExpenses = updatedExpenses;
        finalPayments.push({ ...p, linkedExpenseId: linkedExpId });
      });

      return {
        ...s,
        expenses: currentExpenses,
        collaboratorPayments: [...(s.collaboratorPayments || []), ...finalPayments]
      };
    });
  };

  const updateCollaboratorPaymentStatus = (id: string, status: 'pago' | 'pendente') => {
    setState(s => {
      const target = (s.collaboratorPayments || []).find(p => p.id === id);
      if (!target) return s;

      const updatedPayments = (s.collaboratorPayments || []).map(p => {
        if (p.id === id) {
          return {
            ...p,
            status,
            paymentDate: status === 'pago' ? new Date().toISOString().slice(0, 10) : undefined
          };
        }
        return p;
      });

      let updatedExpenses = s.expenses || [];
      if (target.linkedExpenseId) {
        updatedExpenses = updatedExpenses.map(e => e.id === target.linkedExpenseId ? { ...e, paid: status === 'pago' } : e);
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
      if (target && target.linkedExpenseId) {
        updatedExpenses = updatedExpenses.filter(e => e.id !== target.linkedExpenseId);
      }

      return {
        ...s,
        expenses: updatedExpenses,
        collaboratorPayments: updatedPayments
      };
    });
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
      addCollaborator, updateCollaborator, deleteCollaborator, addCustomCollaboratorRole,
      addCollaboratorPayment, addCollaboratorPaymentsBatch, updateCollaboratorPaymentStatus, deleteCollaboratorPayment,
      addAccountReceivable, updateAccountReceivable, markAccountReceivableAsReceived, deleteAccountReceivable,
      addReceivablePayment, deleteReceivablePayment,
      addCustomReceivableOrigin, updateCustomReceivableOrigin, toggleCustomReceivableOriginStatus, deleteCustomReceivableOrigin,
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
