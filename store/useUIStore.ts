import { create } from 'zustand';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onUndo?: () => void;
}

interface UIState {
    theme: 'light' | 'dark';
    toasts: ToastMessage[];
    isSupportChatOpen: boolean;
    isTourOpen: boolean;
    toggleTheme: () => void;
    addToast: (message: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => void;
    removeToast: (id: string) => void;
    setSupportChatOpen: (open: boolean) => void;
    setTourOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    theme: (localStorage.getItem('gc_theme') as 'light' | 'dark') || 'light',
    toasts: [],
    isSupportChatOpen: false,
    isTourOpen: false,

    toggleTheme: () => {
        set((state) => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('gc_theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return { theme: newTheme };
        });
    },

    addToast: (message: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => {
        set((state) => ({
            toasts: [...state.toasts, { id: Date.now().toString(), message, type, onUndo }]
        }));
    },

    removeToast: (id: string) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    },

    setSupportChatOpen: (open: boolean) => set({ isSupportChatOpen: open }),
    setTourOpen: (open: boolean) => set({ isTourOpen: open }),
}));
