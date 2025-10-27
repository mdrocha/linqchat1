import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  userName: localStorage.getItem('userName') || 'Cliente',
  setAuth: (token, userName) => {
    localStorage.setItem('token', token);
    set({ token, userName });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    set({ token: null, userName: 'Cliente' });
  }
}));
