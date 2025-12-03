import React from "react";
import ReactDOM from "react-dom/client";

// ✔️ Caminho correto para App.tsx dentro de /src
import App from "./App";

// 🔥 Importa o Firebase ingredients
import "./firebase/firebase-ingredients.ts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
