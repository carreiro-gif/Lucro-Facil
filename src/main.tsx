import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";

// 🔥 Importa apenas o arquivo que realmente EXISTE
import "./firebase/firebase-ingredients.ts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
