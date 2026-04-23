import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006';

const api = axios.create({
  baseURL: API_BASE,
});

// Request Interceptor: Inject Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Audit A5 (401 Handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[Session Expired] Redirecting to login...');
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
