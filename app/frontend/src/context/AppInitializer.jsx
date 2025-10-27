import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import app from "@/services/firebase";

/**
 * Aguarda a sincronização do Firebase Auth antes de renderizar o app.
 * Evita piscar a tela de login quando o usuário já está autenticado.
 */
export default function AppInitializer({ children }) {
  const { init, initialized } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (initialized) setReady(true);
  }, [initialized]);

  if (!ready) return <div style={{ textAlign: "center", marginTop: "40vh" }}>Carregando...</div>;
  return children;
}