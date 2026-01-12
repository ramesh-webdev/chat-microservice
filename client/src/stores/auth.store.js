
import { create } from 'zustand';

export const useAuthStore = create(set => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user, token, refreshToken: refreshToken || localStorage.getItem('refreshToken') });
  },
  logout: () => {
    localStorage.clear();
    set({ user: null, token: null, refreshToken: null });
  }
}));
