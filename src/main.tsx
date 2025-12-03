import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

// ✔️ IMPORTANDO O CONTEXT PROVIDER
import { AppProvider } from "./context/AppContext";

// 🔥 Importa Firebase ingredients (OK)
import "./firebase/firebase-ingredients.ts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
