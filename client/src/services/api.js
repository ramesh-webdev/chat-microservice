
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

import { useAuthStore } from '../stores/auth.store';

// ... (request interceptor) ...

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401/403 and we haven't retried yet
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000'}/auth/refresh`, {
            refreshToken
          });

          useAuthStore.getState().setAuth(
            useAuthStore.getState().user,
            data.accessToken,
            refreshToken
          );

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (err) {
          useAuthStore.getState().logout();
          return Promise.reject(err);
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
