import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 🔥 IMPORTS AJUSTADOS PARA "src/pages/"
import Dashboard from "./src/pages/Dashboard";
import Billing from "./src/pages/Billing";
import Expenses from "./src/pages/Expenses";
import Products from "./src/pages/Products";
import Ingredients from "./src/pages/Ingredients";
import Pricing from "./src/pages/Pricing";
import Profit from "./src/pages/Profit";
import StoreList from "./src/pages/StoreList";
import FinancialCategories from "./src/pages/FinancialCategories";
import Dna from "./src/pages/Dna";
import Combos from "./src/pages/Combos";

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
