import { create } from 'zustand';
import { User, Condominium, RolePermissions, Notification, Bill, PaginatedResponse } from '../types';
import { api } from '../services/api';
import { DEFAULT_PERMISSIONS } from '../constants';

interface PaginatedData<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
    isLoadingMore: boolean;
}

const initialPaginatedState = <T>(): PaginatedData<T> => ({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    isLoadingMore: false
});

interface DataState {
    users: PaginatedData<User>;
    condos: Condominium[];
    notifications: Notification[];
    bills: PaginatedData<Bill>;
    rolePermissions: RolePermissions;
    isLoading: boolean;
    fetchInitialData: (currentUser: User) => Promise<void>;

    // User Actions
    updateUser: (id: string, userData: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    addUser: (userData: Omit<User, 'id'>) => Promise<void>;
    fetchMoreUsers: () => Promise<void>;

    // Condo Actions
    addCondo: (condoData: Omit<Condominium, 'id'>) => Promise<void>;
    updateCondo: (id: string, condoData: Partial<Condominium>) => Promise<void>;
    deleteCondo: (id: string) => Promise<void>;

    // Bill Actions
    addBill: (billData: Omit<Bill, 'id' | 'status'>) => Promise<void>;
    fetchMoreBills: () => Promise<void>;
    payBill: (billId: string, userId: string) => Promise<void>;

    setRolePermissions: (permissions: RolePermissions) => void;
    setNotifications: (notifications: Notification[]) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
    users: initialPaginatedState<User>(),
    condos: [],
    notifications: [],
    bills: initialPaginatedState<Bill>(),
    rolePermissions: DEFAULT_PERMISSIONS,
    isLoading: false,

    fetchInitialData: async (currentUser: User) => {
        set({ isLoading: true });
        try {
            const [usersRes, condosData, permissionsData, billsRes] = await Promise.all([
                api.getUsers(1, 10),
                api.getCondos(),
                api.getPermissions(),
                api.getAllBills(1, 10)
            ]);

            const targetCondoIds = (currentUser.role === 'SUPER_ADMIN')
                ? condosData.map(c => c.id)
                : (currentUser.role === 'SYNDIC' && currentUser.managedCondoIds)
                    ? currentUser.managedCondoIds
                    : currentUser.condominiumId ? [currentUser.condominiumId] : [];

            let notificationsData: Notification[] = [];
            if (targetCondoIds.length > 0) {
                notificationsData = await api.getNotifications(targetCondoIds, currentUser.id);
            }

            set({
                users: { ...usersRes, isLoadingMore: false },
                condos: condosData,
                rolePermissions: permissionsData,
                notifications: notificationsData,
                bills: { ...billsRes, isLoadingMore: false },
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching initial data:', error);
            set({ isLoading: false });
        }
    },

    // User Actions
    addUser: async (userData) => {
        const newUser = await api.createUser(userData);
        set((state) => ({
            users: {
                ...state.users,
                data: [newUser, ...state.users.data],
                total: state.users.total + 1
            }
        }));
    },
    updateUser: async (id, userData) => {
        const updatedUser = await api.updateUser(id, userData);
        set((state) => ({
            users: {
                ...state.users,
                data: state.users.data.map(u => u.id === id ? updatedUser : u)
            }
        }));
    },
    deleteUser: async (id) => {
        await api.deleteUser(id);
        set((state) => ({
            users: {
                ...state.users,
                data: state.users.data.filter(u => u.id !== id),
                total: state.users.total - 1
            }
        }));
    },
    fetchMoreUsers: async () => {
        const { users } = get();
        if (users.page >= users.totalPages || users.isLoadingMore) return;

        set((state) => ({ users: { ...state.users, isLoadingMore: true } }));
        try {
            const nextPage = users.page + 1;
            const res = await api.getUsers(nextPage, 10);
            set((state) => ({
                users: {
                    ...res,
                    data: [...state.users.data, ...res.data],
                    isLoadingMore: false
                }
            }));
        } catch (error) {
            set((state) => ({ users: { ...state.users, isLoadingMore: false } }));
        }
    },

    // Condo Actions
    addCondo: async (condoData) => {
        const newCondo = await api.createCondo(condoData);
        set((state) => ({ condos: [newCondo, ...state.condos] }));
    },
    updateCondo: async (id, condoData) => {
        const updatedCondo = await api.updateCondo(id, condoData);
        set((state) => ({
            condos: state.condos.map(c => c.id === id ? updatedCondo : c)
        }));
    },
    deleteCondo: async (id) => {
        await api.deleteCondo(id);
        set((state) => ({
            condos: state.condos.filter(c => c.id !== id)
        }));
    },

    // Bill Actions
    addBill: async (billData) => {
        const newBill = await api.createBill(billData);
        set((state) => ({
            bills: {
                ...state.bills,
                data: [newBill, ...state.bills.data],
                total: state.bills.total + 1
            }
        }));
    },
    fetchMoreBills: async () => {
        const { bills } = get();
        if (bills.page >= bills.totalPages || bills.isLoadingMore) return;

        set((state) => ({ bills: { ...state.bills, isLoadingMore: true } }));
        try {
            const nextPage = bills.page + 1;
            const res = await api.getAllBills(nextPage, 10);
            set((state) => ({
                bills: {
                    ...res,
                    data: [...state.bills.data, ...res.data],
                    isLoadingMore: false
                }
            }));
        } catch (error) {
            set((state) => ({ bills: { ...state.bills, isLoadingMore: false } }));
        }
    },
    payBill: async (billId: string, userId: string) => {
        await api.payBill(billId, userId);

        set((state) => {
            const updatedBills = state.bills.data.map(b =>
                b.id === billId ? { ...b, status: 'PAID' as any } : b
            );

            // Re-check if user still has overdue bills in local state
            const stillOverdue = updatedBills.some(b =>
                b.userId === userId && b.status === 'LATE'
            );

            // Update user in data store if necessary
            const updatedUsers = state.users.data.map(u =>
                (u.id === userId && !stillOverdue) ? { ...u, financialStatus: 'PAID' as any } : u
            );

            return {
                bills: { ...state.bills, data: updatedBills },
                users: { ...state.users, data: updatedUsers }
            };
        });
    },

    setRolePermissions: (permissions) => {
        set({ rolePermissions: permissions });
    },

    setNotifications: (notifications) => {
        set({ notifications });
    }
}));

