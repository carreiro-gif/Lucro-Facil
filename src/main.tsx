import React from "react";
import ReactDOM from "react-dom/client";

// IMPORTA O App.tsx QUE ESTÁ NA RAIZ DO PROJETO
import App from "../App";

// 🔥 Importa Firebase principal
import "./firebase/firebase.ts";

// 🔥 Importa o CRUD de ingredientes
import "./firebase/firebase-ingredients.ts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
