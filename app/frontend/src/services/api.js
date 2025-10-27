import { getAuth } from "firebase/auth";

const env = {
  // Vite
  VITE_API_URL: typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined,
  // CRA
  REACT_APP_API_URL: typeof process !== "undefined" ? process.env?.REACT_APP_API_URL : undefined,
};

let BASE_URL =
  env.VITE_API_URL ||
  env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.__ENV__?.API_URL) ||
  "/api"; // fallback relativo

export const setBaseURL = (url) => {
  if (typeof url === "string" && url.trim()) BASE_URL = url.replace(/\/+$/, "");
};

export const getBaseURL = () => BASE_URL;

/** =============================
 *  Auth (Firebase)
 *  ============================= */
const auth = getAuth();
let currentIdToken = null;

// Mantém o token em memória atualizado
if (auth) {
  // Atualiza token sempre que o usuário troca/renova
  auth.onIdTokenChanged(async (user) => {
    currentIdToken = user ? await user.getIdToken() : null;
  });
}

// Obtém token atual (forceRefresh quando 401)
async function getToken({ forceRefresh = false } = {}) {
  const user = auth?.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

/** =============================
 *  Utilitários
 *  ============================= */
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

function toQueryString(query) {
  if (!query) return "";
  const params = new URLSearchParams();
  const append = (key, value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => append(key, v));
    } else if (isObject(value)) {
      // serializa objetos aninhados com notação dot
      Object.entries(value).forEach(([k, v]) => append(`${key}.${k}`, v));
    } else {
      params.append(key, String(value));
    }
  };
  Object.entries(query).forEach(([k, v]) => append(k, v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

class ApiError extends Error {
  constructor(message, { status, code, details, response, url } = {}) {
    super(message || "API Error");
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.response = response;
    this.url = url;
  }
}

/** =============================
 *  Núcleo de requisição com retry
 *  ============================= */
const DEFAULTS = {
  timeout: 30000,
  retries: 2,
  retryDelayBaseMs: 350,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Controle de abort por timeout
function withTimeout(ms, externalSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), ms);

  // Encaminha abort externo sem sobrescrever propriedades
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    externalSignal.addEventListener("abort", () => controller.abort());
  }

  const signal = controller.signal;
  const cleanup = () => clearTimeout(timeoutId);
  return { signal, cleanup };
}

async function coreFetch(path, { method = "GET", query, data, headers, auth: useAuth = true, timeout = DEFAULTS.timeout, signal } = {}) {
  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}${toQueryString(query)}`;

  const ctrl = withTimeout(timeout, signal);
  try {
    const finalHeaders = new Headers(headers || {});
    finalHeaders.set("Accept", "application/json");

    // Token
    let tokenToUse = currentIdToken;
    if (useAuth) {
      tokenToUse = tokenToUse || (await getToken());
      if (tokenToUse) finalHeaders.set("Authorization", `Bearer ${tokenToUse}`);
    }

    let body;
    let isFormData = false;

    if (data instanceof FormData) {
      body = data;
      isFormData = true;
    } else if (data !== undefined && data !== null) {
      finalHeaders.set("Content-Type", "application/json");
      body = JSON.stringify(data);
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body,
      signal: ctrl.signal,
      credentials: "include", // para cookies de mesma origem quando aplicável
    });

    // Tenta parsear JSON, mesmo em erro
    const text = await res.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text || null;
    }

    if (!res.ok) {
      throw new ApiError(payload?.message || res.statusText || "Request failed", {
        status: res.status,
        code: payload?.code,
        details: payload?.details ?? payload,
        response: payload,
        url,
      });
    }

    // Quando Content-Type não for JSON, devolve o texto
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return payload;

    return payload;
  } finally {
    ctrl.cleanup?.();
  }
}

async function request(path, opts = {}) {
  const {
    retries = DEFAULTS.retries,
    retryDelayBaseMs = DEFAULTS.retryDelayBaseMs,
    auth: useAuth = true,
    ...rest
  } = opts;

  let attempt = 0;
  let lastErr;

  while (attempt <= retries) {
    try {
      return await coreFetch(path, { auth: useAuth, ...rest });
    } catch (err) {
      const status = err?.status;
      const retriable =
        // Rede/timeout
        err?.name === "TypeError" ||
        err?.name === "AbortError" ||
        // 5xx
        (typeof status === "number" && status >= 500 && status !== 501) ||
        // 429
        status === 429;

      // 401: tenta um refresh de token uma vez
      if (useAuth && status === 401 && attempt < retries) {
        // força refresh do token
        currentIdToken = await getToken({ forceRefresh: true });
      }

      if (!retriable || attempt === retries) {
        throw err;
      }

      lastErr = err;
      const backoff = Math.round(retryDelayBaseMs * Math.pow(2, attempt) + Math.random() * 100);
      await sleep(backoff);
      attempt += 1;
    }
  }

  throw lastErr || new ApiError("Unknown error");
}

// HTTP verbs
export const api = {
  get: (path, options = {}) => request(path, { method: "GET", ...options }),
  post: (path, data, options = {}) => request(path, { method: "POST", data, ...options }),
  put: (path, data, options = {}) => request(path, { method: "PUT", data, ...options }),
  patch: (path, data, options = {}) => request(path, { method: "PATCH", data, ...options }),
  delete: (path, options = {}) => request(path, { method: "DELETE", ...options }),

  // Upload multipart. `files` pode ser File, Blob, ou { fieldName: File|Blob|File[] }
  upload: (path, { files, fields, options = {} } = {}) => {
    const form = new FormData();

    if (files) {
      if (files instanceof File || files instanceof Blob) {
        form.append("file", files, files.name || "upload.bin");
      } else if (isObject(files)) {
        Object.entries(files).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            val.forEach((f) => form.append(key, f, f.name || "upload.bin"));
          } else {
            form.append(key, val, val.name || "upload.bin");
          }
        });
      }
    }

    if (fields && isObject(fields)) {
      Object.entries(fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) form.append(k, String(v));
      });
    }

    return request(path, { method: "POST", data: form, ...options });
  },

  // Paginador básico padronizado: { page, limit, ...query }
  paginate: (path, { page = 1, limit = 20, ...query } = {}, options = {}) =>
    request(path, { method: "GET", query: { page, limit, ...query }, ...options }),

  // SSE (Server-Sent Events) simples com auto header de auth
  sse: async (path, { query, headers, withCredentials = false } = {}) => {
    const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}${toQueryString(query)}`;
    const h = new Headers(headers || {});
    h.set("Accept", "text/event-stream");

    const token = await getToken();
    if (token) h.set("Authorization", `Bearer ${token}`);

    return new EventSource(url, { withCredentials, headers: h });
  },
};

// Helpers para headers customizados em chamadas pontuais
export const withHeaders = (extra = {}) => ({
  get: (path, options) => api.get(path, { headers: { ...(options?.headers || {}), ...extra }, ...options }),
  post: (path, data, options) => api.post(path, data, { headers: { ...(options?.headers || {}), ...extra }, ...options }),
  put: (path, data, options) => api.put(path, data, { headers: { ...(options?.headers || {}), ...extra }, ...options }),
  patch: (path, data, options) => api.patch(path, data, { headers: { ...(options?.headers || {}), ...extra }, ...options }),
  delete: (path, options) => api.delete(path, { headers: { ...(options?.headers || {}), ...extra }, ...options }),
});

// Exponha utilitários quando necessário
export { ApiError, toQueryString, getToken };