import axios from 'axios';

const api = axios.create({
        baseURL: 'http://localhost:3000', // ajuste se necessário
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