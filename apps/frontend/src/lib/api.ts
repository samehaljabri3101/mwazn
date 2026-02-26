import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mwazn_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('mwazn_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;
        const newRefresh = data.data.refreshToken;

        localStorage.setItem('mwazn_access_token', newToken);
        localStorage.setItem('mwazn_refresh_token', newRefresh);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('mwazn_access_token');
        localStorage.removeItem('mwazn_refresh_token');
        localStorage.removeItem('mwazn_user');
        localStorage.removeItem('mwazn_company');
        window.location.href = '/en/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
