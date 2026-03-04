import axios from 'axios';

const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use(config => {
  const user = localStorage.getItem('user');
  if (user) {
    const token = JSON.parse(user)?.token;
    if (token) {
      // Header padrão + header customizado (fallback para Kaspersky que remove 'Authorization')
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Auth-Token'] = token;
      config.params = { ...config.params, token };
    }
  }
  return config;
});

export default api;