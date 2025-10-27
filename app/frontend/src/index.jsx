import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppInitializer from "@/context/AppInitializer";
import AppRoutes from "@/routes/AppRoutes";
import "@/styles/global.css";

/**
 * Ponto de entrada principal do frontend.
 * - Inicializa Firebase/Auth via AppInitializer
 * - Ativa o roteamento React Router
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppInitializer>
        <AppRoutes />
      </AppInitializer>
    </BrowserRouter>
  </React.StrictMode>
);