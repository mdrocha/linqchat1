import { useState, useEffect } from "react";
import { useAuthStore } from "./useAuthStore";

export const useDashboard = () => {
  const { userName, logout } = useAuthStore();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simula fetch ou integração futura
  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics([
        { label: "Usuários ativos", value: 132 },
        { label: "Conversas hoje", value: 87 },
        { label: "Novos clientes", value: 9 },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => logout();

  return { userName, metrics, loading, handleLogout };
};