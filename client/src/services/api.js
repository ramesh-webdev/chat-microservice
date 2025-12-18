
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if(token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
