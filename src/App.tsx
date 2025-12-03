import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

import StoreList from "./pages/StoreList";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Expenses from "./pages/Expenses";
import Products from "./pages/Products";
import Ingredients from "./pages/Ingredients";
import Pricing from "./pages/Pricing";
import Profit from "./pages/Profit";
import FinancialCategories from "./pages/FinancialCategories";
import Dna from "./pages/Dna";
import Combos from "./pages/Combos";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StoreList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/products" element={<Products />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/profit" element={<Profit />} />
          <Route path="/financial-categories" element={<FinancialCategories />} />
          <Route path="/dna" element={<Dna />} />
          <Route path="/combos" element={<Combos />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
