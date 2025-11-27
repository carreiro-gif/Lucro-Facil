import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { GlobalState, Ingredient, Product, Expense, MonthlyData, CfiConfig, PlatformConfig, Category, Supplier, FixedCostMode, Combo, StoreInfo } from '../types';
import { INITIAL_STATE, EMPTY_STATE } from '../constants';

interface AppContextType extends GlobalState {
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  
  addProduct: (prod: Product) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

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
  
  // Calculations
  getIngredientRealCost: (ing: Ingredient) => number;
  getProductCMV: (prod: Product) => number;
  calculateFixedCostPercent: (currentMonth?: string) => number;
  calculateTotalCfiPercent: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ 
  children: ReactNode; 
  storeId: string;
  initialData?: GlobalState;
  onStateChange?: (newState: GlobalState) => void;
}> = ({ children, storeId, initialData, onStateChange }) => {
  
  // Initialize state: Priority to initialData passed from App.tsx (the central "database")
  const [state, setState] = useState<GlobalState>(() => {
    if (initialData) return initialData;
    return storeId === '1' ? INITIAL_STATE : EMPTY_STATE;
  });

  // Sync state back to parent (App.tsx) whenever it changes
  // We use a ref to avoid infinite loops if onStateChange changes identity, 
  // though typically it should be stable.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // --- Actions ---

  // Ingredients
  const addIngredient = (ing: Ingredient) => setState(s => ({ ...s, ingredients: [...s.ingredients, ing] }));
  const updateIngredient = (id: string, data: Partial<Ingredient>) => {
    setState(s => ({
      ...s,
      ingredients: s.ingredients.map(i => i.id === id ? { ...i, ...data } : i)
    }));
  };
  const deleteIngredient = (id: string) => setState(s => ({ ...s, ingredients: s.ingredients.filter(i => i.id !== id) }));

  // Products
  const addProduct = (prod: Product) => setState(s => ({ ...s, products: [...s.products, prod] }));
  const updateProduct = (id: string, data: Partial<Product>) => {
    setState(s => ({
      ...s,
      products: s.products.map(p => p.id === id ? { ...p, ...data } : p)
    }));
  };
  const deleteProduct = (id: string) => setState(s => ({ ...s, products: s.products.filter(p => p.id !== id) }));

  // Combos
  const addCombo = (combo: Combo) => setState(s => ({ ...s, combos: [...s.combos, combo] }));
  const updateCombo = (id: string, data: Partial<Combo>) => {
    setState(s => ({
      ...s,
      combos: s.combos.map(c => c.id === id ? { ...c, ...data } : c)
    }));
  };
  const deleteCombo = (id: string) => setState(s => ({ ...s, combos: s.combos.filter(c => c.id !== id) }));

  // Expenses
  const addExpense = (exp: Expense) => setState(s => ({ ...s, expenses: [...s.expenses, exp] }));
  
  const updateExpense = (id: string, data: Partial<Expense>) => {
    setState(s => ({
      ...s,
      expenses: s.expenses.map(e => e.id === id ? { ...e, ...data } : e)
    }));
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
      // Calculate due date based on base due date, incrementing month
      let dueDateStr = undefined;
      if (baseExp.dueDate) {
        const [dYear, dMonth, dDay] = baseExp.dueDate.split('-').map(Number);
        // Simple increment logic
        let targetMonth = dMonth + (i - 1);
        let targetYear = dYear;
        while (targetMonth > 12) {
            targetMonth -= 12;
            targetYear++;
        }
        dueDateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${dDay.toString().padStart(2, '0')}`;
      }

      newExpenses.push({
        ...baseExp,
        id: Math.random().toString(36).substr(2, 9),
        month: monthStr,
        dueDate: dueDateStr,
        installment: {
          current: i,
          total: installments,
          id: groupId
        }
      });
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
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
        food99: { ...s.platformConfig.food99, ...(cfg.food99 || {}) }
      } 
    }));
  };
  
  const updateMonthlyRevenue = (data: MonthlyData[]) => setState(s => ({ ...s, monthlyRevenue: data }));

  const updateStoreInfo = (info: Partial<StoreInfo>) => {
    setState(s => {
      // Logic handled in App.tsx via onStateChange, but we update local state immediately for UI
      return { ...s, storeInfo: { ...s.storeInfo, ...info } };
    });
  };

  const setFixedCostMode = (mode: FixedCostMode) => setState(s => ({ ...s, fixedCostMode: mode }));

  // --- Calculations ---
  
  const getIngredientRealCost = (ing: Ingredient) => {
    if (!ing.packageQuantity || ing.packageQuantity <= 0) return 0;
    const realQty = ing.packageQuantity * (1 - (ing.lossPercent / 100));
    if (realQty <= 0) return 0;
    return ing.price / realQty;
  };

  const getProductCMV = (prod: Product) => {
    return prod.ingredients.reduce((total, item) => {
      const ing = state.ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return total;
      const realPrice = getIngredientRealCost(ing);
      return total + (realPrice * item.quantity);
    }, 0);
  };

  const calculateFixedCostPercent = (currentMonth?: string) => {
    if (state.fixedCostMode === 'AVERAGE') {
       const expenseMonths = state.expenses.map(e => e.month);
       const revenueMonths = state.monthlyRevenue.filter(r => r.revenue > 0).map(r => r.month);
       const allMonths = Array.from(new Set([...expenseMonths, ...revenueMonths])).sort();
       const last12 = allMonths.slice(-12);
       
       let totalCost = 0;
       let totalRev = 0;

       last12.forEach(m => {
          const exp = state.expenses.filter(e => e.month === m).reduce((s, e) => s + e.value, 0);
          const rev = state.monthlyRevenue.find(r => r.month === m)?.revenue || 0;
          if (exp > 0 || rev > 0) {
             totalCost += exp;
             if(rev > 0) totalRev += rev;
          }
       });

       if (totalRev === 0) return 0;
       return (totalCost / totalRev) * 100;
    } else {
        const targetMonth = currentMonth || new Date().toISOString().slice(0, 7);
        const totalCost = state.expenses.filter(e => e.month === targetMonth).reduce((s, e) => s + e.value, 0);
        const revenue = state.monthlyRevenue.find(r => r.month === targetMonth)?.revenue || 0;
        
        if (revenue === 0) return 0;
        return (totalCost / revenue) * 100;
    }
  };

  const calculateTotalCfiPercent = () => {
    const fixedCostPct = calculateFixedCostPercent();
    const avgCardRate = (state.cfi.debitTax + state.cfi.creditTax) / 2;
    return fixedCostPct + avgCardRate + state.cfi.tax + state.cfi.royalties + state.cfi.marketing + state.cfi.voucherTax;
  };

  return (
    <AppContext.Provider value={{
      ...state,
      addIngredient, updateIngredient, deleteIngredient,
      addProduct, updateProduct, deleteProduct,
      addCombo, updateCombo, deleteCombo,
      addExpense, updateExpense, addExpenseWithInstallments,
      addCategory, deleteCategory,
      addSupplier, deleteSupplier,
      updateCfi, updatePlatformConfig, updateMonthlyRevenue, updateStoreInfo,
      setFixedCostMode,
      getIngredientRealCost, getProductCMV, calculateFixedCostPercent, calculateTotalCfiPercent
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};