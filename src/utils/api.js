import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const storeToken = (() => {
    try { return localStorage.getItem('store_token'); } catch {}
  })();
  const adminToken = (() => {
    try { return localStorage.getItem('admin_token'); } catch {}
  })();
  const token = adminToken || storeToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      try { localStorage.removeItem('store_token'); } catch {}
      try { localStorage.removeItem('admin_token'); } catch {}
      const path = window.location.pathname;
      if (path.startsWith('/store/') && !path.startsWith('/store/login')) {
        window.location.href = '/store/login';
      } else if (path.startsWith('/admin/') && !path.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
