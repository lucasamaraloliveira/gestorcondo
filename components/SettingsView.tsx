import React, { useState, useEffect } from 'react';
import { Lock, Edit2, Trash2, Bell, MapPin, Headphones } from 'lucide-react';
import { UserRole, RolePermissions } from '../types';
import { APP_MODULES } from '../constants';
import { api } from '../services/api';
import { BrandSettings } from './BrandSettings';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';

const SettingsView: React.FC = () => {
    const { currentUser, updateUser } = useAuthStore();
    const { condos, rolePermissions, setRolePermissions } = useDataStore();
    const { addToast, setTourOpen, setSupportChatOpen } = useUIStore();

    const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'branding'>('profile');
    const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

    const [tempPermissions, setTempPermissions] = useState<RolePermissions>(rolePermissions);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        setTempPermissions(rolePermissions);
    }, [rolePermissions]);

    const handlePermissionChange = (role: UserRole, moduleId: string) => {
        setTempPermissions(prev => {
            const currentModules = prev[role] || [];
            const newModules = currentModules.includes(moduleId) ? currentModules.filter(m => m !== moduleId) : [...currentModules, moduleId];
            return { ...prev, [role]: newModules };
        });
    };

    const savePermissions = async () => {
        await api.updatePermissions(tempPermissions);
        setRolePermissions(tempPermissions);
        addToast('Permissões atualizadas.', 'success');
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const avatarUrl = reader.result as string;
                await api.updateUser(currentUser!.id, { avatarUrl });
                updateUser({ avatarUrl });
                addToast('Foto atualizada!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.new !== passData.confirm) return addToast("Senhas não conferem.", 'error');
        setPassLoading(true);
        try {
            await api.changePassword(currentUser!.id, passData.current, passData.new);
            addToast("Senha alterada!", 'success');
            setIsChangingPassword(false);
            setPassData({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            addToast(err.message || "Erro.", 'error');
        } finally {
            setPassLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Configurações</h2>
            <div className="flex space-x-4 border-b">
                <button onClick={() => setActiveTab('profile')} className={`pb-2 px-1 text-sm ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500'}`}>Perfil</button>
                {isAdmin && <button onClick={() => setActiveTab('permissions')} className={`pb-2 px-1 text-sm ${activeTab === 'permissions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500'}`}>Permissões</button>}
                {isAdmin && <button onClick={() => setActiveTab('branding')} className={`pb-2 px-1 text-sm ${activeTab === 'branding' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500'}`}>Marca</button>}
            </div>

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border">
                        <div className="flex items-center mb-6">
                            <div className="relative mr-4">
                                <img src={currentUser.avatarUrl} className="w-20 h-20 rounded-full border object-cover" alt="" />
                                <label className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer"><Edit2 className="w-3 h-3" /><input type="file" className="hidden" onChange={handleAvatarChange} /></label>
                            </div>
                            <div><h3 className="text-lg font-bold">{currentUser.name}</h3><p className="text-sm text-slate-500">{currentUser.email}</p></div>
                        </div>
                        <div className="space-y-6">
                            <div className="pt-4 border-t">
                                <h4 className="flex items-center gap-2 font-bold text-sm mb-3"><Lock className="w-4 h-4" /> Segurança</h4>
                                {!isChangingPassword ? <button onClick={() => setIsChangingPassword(true)} className="text-sm text-blue-600 font-medium">Alterar senha</button> : (
                                    <form onSubmit={handleChangePassword} className="space-y-3 bg-slate-50 p-4 rounded-xl">
                                        <input type="password" required placeholder="Atual" className="w-full p-2 border rounded-lg text-sm" value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })} />
                                        <div className="grid grid-cols-2 gap-2"><input type="password" required placeholder="Nova" className="w-full p-2 border rounded-lg text-sm" value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })} /><input type="password" required placeholder="Confirmar" className="w-full p-2 border rounded-lg text-sm" value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })} /></div>
                                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsChangingPassword(false)}>Cancelar</button><button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Salvar</button></div>
                                    </form>
                                )}
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="flex items-center gap-2 font-bold text-sm mb-3"><Bell className="w-4 h-4" /> Notificações</h4>
                                <label className="flex justify-between items-center cursor-pointer"><span className="text-sm">Classificados</span><input type="checkbox" checked={currentUser.marketplaceNotifications ?? true} onChange={e => updateUser({ marketplaceNotifications: e.target.checked })} /></label>
                            </div>
                            <div className="pt-4 border-t space-y-2">
                                <h4 className="font-bold text-sm mb-3">Ajuda</h4>
                                <button onClick={() => setTourOpen(true)} className="w-full flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm"><span>Reiniciar Tour</span><MapPin className="w-4 h-4" /></button>
                                <button onClick={() => setSupportChatOpen(true)} className="w-full flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm"><span>Falar com Suporte</span><Headphones className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'permissions' && isAdmin && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold">Permissões</h3><button onClick={savePermissions} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">Salvar</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {Object.values(UserRole).map(role => (
                            <div key={role} className="border rounded-xl p-4">
                                <h4 className="font-bold text-xs uppercase mb-3 border-b pb-2">{role}</h4>
                                <div className="space-y-2">
                                    {APP_MODULES.map(m => (
                                        <label key={m.id} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={tempPermissions[role]?.includes(m.id) || false} onChange={() => handlePermissionChange(role, m.id)} disabled={role === UserRole.SUPER_ADMIN} /><span className="text-sm">{m.label}</span></label>
                                    ))}
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={tempPermissions[role]?.includes('chat') || false} onChange={() => handlePermissionChange(role, 'chat')} disabled={role === UserRole.SUPER_ADMIN} /><span className="text-sm">Chat</span></label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'branding' && isAdmin && <BrandSettings />}
        </div>
    );
};

export default SettingsView;
