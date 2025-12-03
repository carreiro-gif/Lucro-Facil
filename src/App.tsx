import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useApp } from "./context/AppContext";

// ✔ IMPORTS DAS PÁGINAS
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Expenses from "./pages/Expenses";
import Products from "./pages/Products";
import Ingredients from "./pages/Ingredients";
import Pricing from "./pages/Pricing";
import Profit from "./pages/Profit";
import StoreList from "./pages/StoreList";
import FinancialCategories from "./pages/FinancialCategories";
import Dna from "./pages/Dna";
import Combos from "./pages/Combos";

function App() {

  // ✔ PEGANDO TUDO DO CONTEXT
  const {
    stores,
    selectStore,
    addStore,
    updateStore,
    deleteStore,
    replicateData,
    toggleTheme,
    isDark,
  } = useApp();

  return (
    <Router>
      <Routes>

        {/* ✔ StoreList RECEBE TODAS AS PROPS */}
        <Route
          path="/"
          element={
            <StoreList
              stores={stores}
              onSelectStore={selectStore}
              onAddStore={addStore}
              onUpdateStore={updateStore}
              onDeleteStore={deleteStore}
              onReplicate={replicateData}
              toggleTheme={toggleTheme}
              isDark={isDark}
            />
          }
        />

        {/* OUTRAS ROTAS */}
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
