/**
 * Authentication state management using Zustand
 */
import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => 
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false 
    }),
  
  setLoading: (loading) => 
    set({ isLoading: loading }),
  
  login: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ 
      user, 
      isAuthenticated: true,
      isLoading: false 
    });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    set({ 
      user: null, 
      isAuthenticated: false 
    });
  },
}));
