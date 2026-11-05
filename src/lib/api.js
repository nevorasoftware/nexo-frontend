// URL del backend. En Railway se define VITE_API_URL (se inyecta en tiempo de build).
let base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
if (base.endsWith('/api')) base = base.slice(0, -4);

export const API_URL = base;
const TOKEN_KEY = 'nexo_token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* almacenamiento no disponible */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  },
};

export async function api(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_URL}/api${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin cuerpo */
  }

  if (res.status === 401 && token && !path.startsWith('/auth/login')) {
    tokenStore.clear();
    window.dispatchEvent(new Event('nexo:logout'));
  }
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}
