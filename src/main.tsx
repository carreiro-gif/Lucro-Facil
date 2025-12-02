import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 🔥 Importa Firebase principal (firebase.ts)
import "./firebase/firebase.ts";

// 🔥 Importa o CRUD de ingredientes
import "./firebase/firebase-ingredients.ts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
