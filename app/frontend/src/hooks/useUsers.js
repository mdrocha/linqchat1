// /hooks/useUsers.js
import { useApi } from "@/hooks/useApi";

/**
 * Hook de usuários, exemplo de consumo padronizado.
 * Demonstra integração de cache, reatividade e refresh.
 */
export function useUsers({ enabled = true } = {}) {
  return useApi("users", "/users", null, { ttl: 60000, enabled });
}