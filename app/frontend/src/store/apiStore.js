// /store/apiStore.js
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { api, ApiError } from "@/services/api";

export const useApiStore = create(
  devtools((set, get) => ({
    cache: {}, // { key: { data, timestamp } }
    loading: {}, // { key: boolean }
    errors: {}, // { key: ApiError | null }

    /** Executa e cacheia GETs */
    fetch: async (key, path, query, { force = false, ttl = 30000 } = {}) => {
      const { cache, loading } = get();

      if (!force && cache[key] && Date.now() - cache[key].timestamp < ttl) {
        return cache[key].data;
      }

      if (loading[key]) return cache[key]?.data;

      set((s) => ({ loading: { ...s.loading, [key]: true }, errors: { ...s.errors, [key]: null } }));

      try {
        const data = await api.get(path, { query });
        set((s) => ({
          cache: { ...s.cache, [key]: { data, timestamp: Date.now() } },
        }));
        return data;
      } catch (err) {
        set((s) => ({
          errors: { ...s.errors, [key]: err instanceof ApiError ? err : new ApiError(err.message) },
        }));
        throw err;
      } finally {
        set((s) => ({ loading: { ...s.loading, [key]: false } }));
      }
    },

    /** Limpa cache ou item específico */
    clearCache: (key) => {
      if (!key) return set({ cache: {} });
      set((s) => {
        const newCache = { ...s.cache };
        delete newCache[key];
        return { cache: newCache };
      });
    },

    getCache: (key) => get().cache[key]?.data ?? null,
    getError: (key) => get().errors[key] ?? null,
    isLoading: (key) => !!get().loading[key],
  }))
);
