
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { GlobalState, Ingredient, Product, Expense, MonthlyData, CfiConfig, PlatformConfig, Category, Supplier, FixedCostMode, Combo, StoreInfo, MenuCategory } from '../types';
import { INITIAL_STATE, EMPTY_STATE } from '../constants';

interface AppContextType extends GlobalState {
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  
  addProduct: (prod: Product) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
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
  addExpenseWithInstallments: (baseExp: Omit<Expense, 'id' | 'installment'>, installments: number) => void;
  
  addCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  
  addSupplier: (sup: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  updateCfi: (cfi: Partial<CfiConfig>) => void;
  updatePlatformConfig: (cfg: Partial<PlatformConfig>) => void;
  updateMonthlyRevenue: (data: MonthlyData[]) => void;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  
  setFixedCostMode: (mode: FixedCostMode) => void;
  
  getIngredientRealCost: (ing: Ingredient) => number;
  getProductCMV: (prod: Product) => number;
  calculateFixedCostPercent: (currentMonth?: string) => number;
  calculateTotalCfiPercent: () => number;
  getSortedProducts: () => Product[];
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
            products: initialData.products || [],
            menuCategories: initialData.menuCategories || [],
            combos: initialData.combos || [],
            expenses: initialData.expenses || [],
            monthlyRevenue: initialData.monthlyRevenue || [],
            categories: initialData.categories || [],
            suppliers: initialData.suppliers || [],
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

  // Products
  const addProduct = (prod: Product) => setState(s => {
      const sameCat = s.products.filter(p => p.category === prod.category);
      const maxOrder = sameCat.length > 0 ? Math.max(...sameCat.map(p => p.order)) : -1;
      return { ...s, products: [...s.products, { ...prod, order: maxOrder + 1 }] };
  });

  const updateProduct = (id: string, data: Partial<Product>) => {
    setState(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, ...data } : p) }));
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
    setState(s => ({ ...s, platformConfig: { ...s.platformConfig, ...cfg, ifood: { ...s.platformConfig.ifood, ...(cfg.ifood || {}) }, food99: { ...s.platformConfig.food99, ...(cfg.food99 || {}) } } }));
  };
  const updateMonthlyRevenue = (data: MonthlyData[]) => setState(s => ({ ...s, monthlyRevenue: data }));
  const updateStoreInfo = (info: Partial<StoreInfo>) => setState(s => ({ ...s, storeInfo: { ...s.storeInfo, ...info } }));
  const setFixedCostMode = (mode: FixedCostMode) => setState(s => ({ ...s, fixedCostMode: mode }));

  // --- CALCULATIONS ---
  
  const getIngredientRealCost = (ing: Ingredient) => {
    if (!ing.packageQuantity || ing.packageQuantity <= 0) return 0;
    const realQty = ing.packageQuantity * (1 - (ing.lossPercent / 100));
    if (realQty <= 0) return 0;
    return ing.price / realQty;
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

  return (
    <AppContext.Provider value={{
      ...state,
      addIngredient, updateIngredient, deleteIngredient,
      addProduct, updateProduct, deleteProduct, reorderProduct,
      addMenuCategory, updateMenuCategory, deleteMenuCategory, reorderMenuCategory,
      addCombo, updateCombo, deleteCombo,
      addExpense, updateExpense, addExpenseWithInstallments,
      addCategory, deleteCategory,
      addSupplier, deleteSupplier,
      updateCfi, updatePlatformConfig, updateMonthlyRevenue, updateStoreInfo,
      setFixedCostMode,
      getIngredientRealCost, getProductCMV, calculateFixedCostPercent, calculateTotalCfiPercent,
      getSortedProducts
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
