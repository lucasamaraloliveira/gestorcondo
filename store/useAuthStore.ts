import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    setCurrentUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    currentUser: JSON.parse(localStorage.getItem('gc_session') || 'null'),
    isAuthenticated: !!localStorage.getItem('gc_session'),
    isLoading: false,

    login: async (email: string) => {
        set({ isLoading: true });
        try {
            const user = await api.login(email);
            localStorage.setItem('gc_session', JSON.stringify(user));
            set({ currentUser: user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('gc_session');
        set({ currentUser: null, isAuthenticated: false });
    },

    updateUser: (data: Partial<User>) => {
        set((state) => {
            if (!state.currentUser) return state;
            const updatedUser = { ...state.currentUser, ...data };
            localStorage.setItem('gc_session', JSON.stringify(updatedUser));
            return { currentUser: updatedUser };
        });
    },

    setCurrentUser: (user: User | null) => {
        if (user) {
            localStorage.setItem('gc_session', JSON.stringify(user));
        } else {
            localStorage.removeItem('gc_session');
        }
        set({ currentUser: user, isAuthenticated: !!user });
    }
}));
