// /hooks/useApi.js
import { useEffect, useMemo } from "react";
import { useApiStore } from "@/store/apiStore";

/**
 * Hook simplificado para requisições GET reativas com cache e TTL.
 * 
 * @param {string} key - identificador único da requisição
 * @param {string} path - endpoint relativo
 * @param {object} query - parâmetros opcionais
 * @param {object} options - { ttl, force, enabled }
 */
export function useApi(key, path, query, { ttl = 30000, force = false, enabled = true } = {}) {
  const { fetch, getCache, isLoading, getError } = useApiStore();

  const data = getCache(key);
  const loading = isLoading(key);
  const error = getError(key);

  useEffect(() => {
    if (!enabled || !path) return;
    fetch(key, path, query, { force, ttl }).catch(() => {});
  }, [key, path, JSON.stringify(query), enabled, force]);

  return useMemo(() => ({ data, loading, error, refresh: () => fetch(key, path, query, { force: true }) }), [
    data,
    loading,
    error,
  ]);
}