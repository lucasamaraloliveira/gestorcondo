import React, { useState } from 'react';
import { Search, Filter, Plus, Edit2, Trash2 } from 'lucide-react';
import { User, UserRole } from '../types';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import UserModal from './UserModal';
import ConfirmModal from './ConfirmModal';
import Skeleton from './ui/Skeleton';

const UsersView: React.FC = () => {
    const { currentUser } = useAuthStore();
    const { users, condos, addUser, updateUser, deleteUser, fetchMoreUsers, isLoading } = useDataStore();
    const { addToast } = useUIStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

    const handleSaveUser = async (userData: Partial<User>) => {
        try {
            if (editingUser) {
                await updateUser(editingUser.id, userData);
                addToast('Usuário editado com sucesso!', 'success');
                setEditingUser(null);
            } else {
                await addUser(userData as any);
                addToast('Usuário adicionado com sucesso!', 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            addToast('Erro ao salvar usuário.', 'error');
        }
    };

    const handleConfirmDeleteUser = async () => {
        if (deleteUserId) {
            try {
                await deleteUser(deleteUserId);
                addToast('Usuário removido.', 'success');
            } catch (error) {
                addToast('Erro ao remover usuário.', 'error');
            }
            setDeleteUserId(null);
        }
    };

    const getCondoName = (id?: string) => {
        if (!id) return 'N/A';
        return condos.find(c => c.id === id)?.name || 'Desconhecido';
    };

    return (
        <div className="max-w-full mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-2xl border border-white/50 dark:border-slate-700">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou unidade..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white shadow-sm transition-all placeholder:text-slate-400"
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                </div>

                <div className="flex space-x-2 w-full sm:w-auto p-1">
                    <button className="flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors shadow-sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtrar
                    </button>
                    <button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex-1 sm:flex-none"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Usuário
                    </button>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white/60 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perfil</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Condomínio / Unidade</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading && users.data.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Skeleton variant="circle" className="h-10 w-10 flex-shrink-0" />
                                                <div className="ml-4">
                                                    <Skeleton className="h-4 w-24 mb-1" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24 mb-1" /> <Skeleton className="h-3 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm" src={user.avatarUrl} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border 
                      ${user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                                                user.role === UserRole.SYNDIC ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                                    user.role === UserRole.SUPPORT ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800' :
                                                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'}`}>
                                            {user.role === UserRole.SUPER_ADMIN ? 'Admin' :
                                                user.role === UserRole.SYNDIC ? 'Síndico' :
                                                    user.role === UserRole.SUPPORT ? 'Suporte' : 'Morador'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{getCondoName(user.condominiumId)}</div>
                                        <div className="text-xs text-slate-400">{user.unitId ? `Unidade: ${user.unitId}` : '—'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className={`flex w-2 h-2 rounded-full mr-2 ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className={`text-xs font-medium ${user.active ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                                {user.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteUserId(user.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.page < users.totalPages && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                        <button
                            onClick={fetchMoreUsers}
                            disabled={users.isLoadingMore}
                            className="px-6 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {users.isLoadingMore ? 'Carregando...' : 'Carregar Mais Usuários'}
                        </button>
                    </div>
                )}
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
                onSave={handleSaveUser}
                currentUser={currentUser!}
                condos={condos}
                initialData={editingUser}
            />
            <ConfirmModal
                isOpen={!!deleteUserId}
                onClose={() => setDeleteUserId(null)}
                onConfirm={handleConfirmDeleteUser}
                title="Excluir Usuário"
                description="Tem certeza que deseja remover este usuário? Esta ação pode ser desfeita por um curto período."
                confirmText="Excluir"
                isDestructive={true}
            />
        </div>
    );
};


export default UsersView;
