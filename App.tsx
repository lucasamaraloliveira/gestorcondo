import React, { useState, useEffect, useMemo, useContext } from 'react';
import * as Icons from 'lucide-react';
import { BrandContext } from './BrandContext';
import { Plus, Search, Filter, MoreVertical, Building2, UserCircle, LogIn, Lock, Menu, Calendar, Clock, AlertCircle, CheckCircle2, MessageSquare, Shield, CheckSquare, Square, Bell, X, Edit2, Trash2, Headphones, ArrowLeft, Mail, MapPin, XCircle, Map, Sun, Moon, LogOut, Settings, KeyRound, FolderOpen, Users } from 'lucide-react';
import { User, UserRole, Condominium, RolePermissions, Notification } from './types';
import { APP_MODULES, DEFAULT_PERMISSIONS, TOUR_STEPS } from './constants';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import UserModal from './components/UserModal';
import SupportChatModal from './components/SupportChatModal';
import FinancialModule from './components/FinancialModule';
import AgendaModule from './components/AgendaModule';
import CondoModule from './components/CondoModule';
import ResourcesModule from './components/ResourcesModule';
import DashboardModule from './components/DashboardModule';
import SupportModule from './components/SupportModule';
import DocumentsModule from './components/DocumentsModule'; // Import Documents Module
import { AccessControlView } from './components/AccessControlView';
import { AssemblyView } from './components/AssemblyView';
import { MarketplaceView } from './components/MarketplaceView';
import ChatWidget from './components/ChatWidget';
import GuidedTour from './components/GuidedTour';
import { ToastContainer, ToastMessage } from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { BrandSettings } from './components/BrandSettings';


// --- Helper Components ---

// --- Brand Configuration (White Label Prep) ---


const LoginScreen = ({ onLogin, onRegister }: { onLogin: (email: string) => void, onRegister: (user: User) => void }) => {
    const { config } = useContext(BrandContext);
    const LogoIcon = Icons[config.logo as keyof typeof Icons] as any;

    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('admin@gestor.com');
    const [loading, setLoading] = useState(false);
    // Registration State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regCondo, setRegCondo] = useState('');
    const [regBlock, setRegBlock] = useState('');
    const [regUnit, setRegUnit] = useState('');
    const [availableCondos, setAvailableCondos] = useState<Condominium[]>([]);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (isRegistering) {
            setLoading(true);
            api.getCondos().then(data => { setAvailableCondos(data); setLoading(false); });
        }
    }, [isRegistering]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onLogin(email);
        setLoading(false);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.register({
                name: regName, email: regEmail, password: regPassword, condominiumId: regCondo, block: regBlock, unitId: regUnit
            });
            setLoading(false);
            setRegistrationStatus('success');
        } catch (error) {
            setLoading(false);
            setRegistrationStatus('error');
        }
    };

    const handleSuccessRedirect = () => {
        setEmail(regEmail);
        setRegName(''); setRegEmail(''); setRegPassword(''); setRegCondo(''); setRegBlock(''); setRegUnit('');
        setRegistrationStatus('idle'); setIsRegistering(false);
    };

    const selectedCondoData = availableCondos.find(c => c.id === regCondo);

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-900 flex flex-col relative overflow-x-hidden transition-all">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl"></div>
            </div>

            <div className="flex-grow flex items-center justify-center p-4 md:p-6 w-full z-10">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* Left Side - Login Card */}
                    <div className="w-full max-w-[400px] mx-auto">
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-6 md:p-8 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-left duration-500">

                            {/* Header */}
                            <div className="mb-8 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                                        <LogoIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">{config.name}</span>
                                </div>

                                {!isRegistering ? (
                                    <>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo(a)</h1>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Acesse sua conta para continuar.</p>
                                    </>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Criar Conta</h1>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Comece a gerenciar seu condomínio.</p>
                                    </>
                                )}
                            </div>

                            {/* Success/Error Modal Overlay for Registration */}
                            {registrationStatus !== 'idle' && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-[2rem] p-8 animate-in fade-in">
                                    <div className="text-center w-full">
                                        {registrationStatus === 'success' ? (
                                            <>
                                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sucesso!</h3>
                                                <button onClick={handleSuccessRedirect} className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold text-sm">Ir para Login</button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro</h3>
                                                <button onClick={() => setRegistrationStatus('idle')} className="w-full mt-4 bg-slate-200 text-slate-800 py-3 rounded-xl font-bold text-sm">Tentar Novamente</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!isRegistering ? (
                                <form onSubmit={handleLoginSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">E-mail</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Senha</label>
                                            <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Esqueci a senha</a>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                                                placeholder="••••••"
                                                defaultValue="123456"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 hover:translate-y-[-1px] active:translate-y-[1px]"
                                    >
                                        {loading ? 'Entrando...' : 'Entrar'}
                                        {!loading && <ArrowLeft className="w-4 h-4 rotate-180" />}
                                    </button>

                                    <div className="pt-4 text-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Não tem conta?{' '}
                                            <button type="button" onClick={() => setIsRegistering(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                                Crie agora
                                            </button>
                                        </p>
                                    </div>

                                    {/* Demo Users Quick Access */}
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-center text-slate-400 mb-2 uppercase tracking-wider font-semibold">Acesso Demo</p>
                                        <div className="flex gap-2 justify-center flex-wrap">
                                            <button onClick={() => setEmail('ana@email.com')} type="button" className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">Morador</button>
                                            <button onClick={() => setEmail('roberto@jardins.com')} type="button" className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">Síndico</button>
                                            <button onClick={() => setEmail('admin@gestor.com')} type="button" className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">Admin</button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                // Registration Form
                                <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-in slide-in-from-right duration-300">
                                    <button type="button" onClick={() => setIsRegistering(false)} className="flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors">
                                        <ArrowLeft className="w-3 h-3 mr-1" />
                                        Voltar
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Nome</label>
                                            <input required type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regName} onChange={e => setRegName(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Email</label>
                                            <input required type="email" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Senha</label>
                                        <input required type="password" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Condomínio</label>
                                        <select required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regCondo} onChange={e => setRegCondo(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {availableCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {regCondo && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Bloco</label>
                                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" placeholder="Ex: A" value={regBlock} onChange={e => setRegBlock(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Unidade</label>
                                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" placeholder="Ex: 101" value={regUnit} onChange={e => setRegUnit(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg text-sm">
                                        {loading ? 'Cadastrando...' : 'Confirmar Cadastro'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Features / Branding */}
                    <div className="hidden lg:flex flex-col justify-center animate-in slide-in-from-right duration-700 relative pl-8">
                        <div className="relative z-10">
                            <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                                Simplifique a <br />
                                <span className="text-blue-600">Gestão do seu Condomínio</span>
                            </h2>
                            <p className="text-base text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                                Uma plataforma completa para síndicos e moradores.
                                Transparência financeira, reservas, assembleias online e muito mais.
                            </p>

                            <div className="space-y-4">
                                {config.features.map((feature, index) => {
                                    const FeatureIcon = Icons[feature.icon as keyof typeof Icons] as any;
                                    return (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                                                <FeatureIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-base">{feature.title}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Relative now, stays at bottom naturally or pushed down */}
            <div className="w-full text-center py-6 mt-auto z-10">
                <p className="text-[10px] text-slate-400 font-medium opacity-70">© 2024 {config.name}  •  Termos de Uso  •  Privacidade</p>
            </div>
        </div>
    );
};


// ... SettingsView removed for brevity, stays the same ...
// Re-adding SettingsView since I'm replacing the whole file and it's needed
const SettingsView = ({
    user,
    condos,
    onUpdateCondo,
    onUpdateUser,
    onOpenSupport,
    rolePermissions,
    onUpdatePermissions,
    onStartTour
}: {
    user: User,
    condos: Condominium[],
    onUpdateCondo: (id: string) => void,
    onUpdateUser: (data: Partial<User>) => Promise<void>,
    onOpenSupport: () => void,
    rolePermissions: RolePermissions,
    onUpdatePermissions: (p: RolePermissions) => void,
    onStartTour: () => void
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'branding'>('profile');
    const isAdmin = user.role === UserRole.SUPER_ADMIN;

    // For permissions editing
    const [tempPermissions, setTempPermissions] = useState<RolePermissions>(rolePermissions);

    // For Password Change
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        setTempPermissions(rolePermissions);
    }, [rolePermissions]);

    const handlePermissionChange = (role: UserRole, moduleId: string) => {
        setTempPermissions(prev => {
            const currentModules = prev[role] || [];
            const newModules = currentModules.includes(moduleId)
                ? currentModules.filter(m => m !== moduleId)
                : [...currentModules, moduleId];
            return { ...prev, [role]: newModules };
        });
    };

    const savePermissions = () => {
        onUpdatePermissions(tempPermissions);
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateUser({ avatarUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        if (window.confirm("Remover foto de perfil?")) {
            // Set to a default placeholder or empty string
            onUpdateUser({ avatarUrl: `https://ui-avatars.com/api/?name=${user.name}&background=random` });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.new !== passData.confirm) {
            alert("As senhas não conferem.");
            return;
        }
        setPassLoading(true);
        try {
            await api.changePassword(user.id, passData.current, passData.new);
            alert("Senha alterada com sucesso!");
            setIsChangingPassword(false);
            setPassData({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            alert(err.message || "Erro ao alterar senha.");
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h2>

            <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Meu Perfil
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'permissions' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Permissões de Acesso
                    </button>
                )}
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('branding')}
                        className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'branding' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Personalização
                    </button>
                )}
            </div>

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Info Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center mb-6">
                            <div className="relative group mr-4">
                                <img src={user.avatarUrl} alt="" className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-slate-600 object-cover" />

                                {/* Avatar Actions Overlay */}
                                <div className="absolute -bottom-1 -right-1 flex gap-1">
                                    <label className="p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-transform hover:scale-105" title="Alterar Foto">
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                    <button
                                        onClick={handleRemoveAvatar}
                                        className="p-1.5 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800 shadow-md transition-transform hover:scale-105"
                                        title="Remover Foto"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{user.name}</h3>
                                <p className="text-sm text-slate-500">{user.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full font-semibold">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Condo Selection for Multi-Condo Users */}
                            {(user.role === UserRole.SUPER_ADMIN || (user.role === UserRole.SYNDIC && user.managedCondoIds && user.managedCondoIds.length > 1)) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Condomínio Ativo</label>
                                    <select
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        value={user.condominiumId || ''}
                                        onChange={(e) => onUpdateCondo(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {condos.filter(c => user.role === UserRole.SUPER_ADMIN || user.managedCondoIds?.includes(c.id)).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">Alterne entre condomínios para visualizar dados específicos.</p>
                                </div>
                            )}

                            {/* Password Change Section */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                    <Lock className="w-4 h-4 mr-2 text-slate-400" />
                                    Segurança
                                </h4>

                                {!isChangingPassword ? (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium"
                                    >
                                        Alterar minha senha
                                    </button>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2">
                                        <div>
                                            <input
                                                type="password"
                                                required
                                                placeholder="Senha Atual"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                value={passData.current}
                                                onChange={e => setPassData({ ...passData, current: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="password"
                                                required
                                                placeholder="Nova Senha"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                value={passData.new}
                                                onChange={e => setPassData({ ...passData, new: e.target.value })}
                                            />
                                            <input
                                                type="password"
                                                required
                                                placeholder="Confirmar"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                value={passData.confirm}
                                                onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setIsChangingPassword(false)}
                                                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={passLoading}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {passLoading ? 'Salvando...' : 'Salvar Senha'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                            {/* Notifications Settings */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                    <Bell className="w-4 h-4 mr-2 text-slate-400" />
                                    Notificações
                                </h4>

                                <label className="flex items-center justify-between cursor-pointer group px-1">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                        Notificações de Classificados
                                    </span>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={user.marketplaceNotifications ?? true} // Default true
                                            onChange={(e) => onUpdateUser({ marketplaceNotifications: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </label>
                            </div>

                            {/* Help / Tour (Already exists below) - Ensuring smooth closing */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Ajuda & Suporte</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={onStartTour}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                    >
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Reiniciar Tour Guiado</span>
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </button>

                                    <button
                                        onClick={onOpenSupport}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                    >
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Falar com Suporte</span>
                                        <Headphones className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {
                activeTab === 'permissions' && isAdmin && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Gerenciar Permissões por Perfil</h3>
                            <button
                                onClick={savePermissions}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Salvar Alterações
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.values(UserRole).map(role => (
                                <div key={role} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-700 pb-2">
                                        {role === UserRole.SUPER_ADMIN ? 'Super Admin' :
                                            role === UserRole.SYNDIC ? 'Síndico' :
                                                role === UserRole.RESIDENT ? 'Morador' : 'Suporte'}
                                    </h4>
                                    <div className="space-y-2">
                                        {/* Include APP_MODULES */}
                                        {APP_MODULES.map(module => (
                                            <label key={module.id} className="flex items-center space-x-2 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={tempPermissions[role]?.includes(module.id) || false}
                                                        onChange={() => handlePermissionChange(role, module.id)}
                                                        disabled={role === UserRole.SUPER_ADMIN} // Admin always has full access
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                                    {module.label}
                                                </span>
                                            </label>
                                        ))}
                                        {/* Explicitly add 'chat' permission since it's not in APP_MODULES (it's a widget) */}
                                        <label key="chat-widget" className="flex items-center space-x-2 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={tempPermissions[role]?.includes('chat') || false}
                                                    onChange={() => handlePermissionChange(role, 'chat')}
                                                    disabled={role === UserRole.SUPER_ADMIN}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                                Chat de Suporte (Widget)
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'branding' && isAdmin && (
                    <BrandSettings />
                )
            }
        </div >
    );
};

const App: React.FC = () => {
    const { config } = useContext(BrandContext);
    const LogoIcon = Icons[config.logo as keyof typeof Icons] as any;

    // ... [Original state and logic, unchanged until the render part where we add the new module] ...
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activePage, setActivePage] = useState('users');
    const [users, setUsers] = useState<User[]>([]);
    const [condos, setCondos] = useState<Condominium[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [justRegistered, setJustRegistered] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

    const addToast = (message: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type, onUndo }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (currentUser) {
            setLoading(true);
            Promise.all([api.getUsers(), api.getCondos(), api.getPermissions()])
                .then(([usersData, condosData, permissionsData]) => {
                    setUsers(usersData);
                    setCondos(condosData);
                    setRolePermissions(permissionsData);
                })
                .finally(() => setLoading(false));
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            const targetCondoIds = (currentUser.role === UserRole.SUPER_ADMIN)
                ? condos.map(c => c.id)
                : (currentUser.role === UserRole.SYNDIC && currentUser.managedCondoIds)
                    ? currentUser.managedCondoIds
                    : currentUser.condominiumId ? [currentUser.condominiumId] : [];

            if (targetCondoIds.length > 0) {
                api.getNotifications(targetCondoIds, currentUser.id).then(setNotifications);
            }

            if (justRegistered || (currentUser && !currentUser.hasSeenTour)) {
                const timer = setTimeout(() => {
                    setIsTourOpen(true);
                    setJustRegistered(false);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [currentUser, condos, justRegistered]);

    const handleTourComplete = async () => {
        setIsTourOpen(false);
        if (currentUser) {
            await api.completeTour(currentUser.id);
            setCurrentUser(prev => prev ? ({ ...prev, hasSeenTour: true }) : null);
        }
    };

    const filteredTourSteps = useMemo(() => {
        if (!currentUser) return [];
        const userPermissions = rolePermissions[currentUser.role] || [];
        return TOUR_STEPS.filter(step => {
            if (step.targetId.startsWith('nav-')) {
                const moduleId = step.targetId.replace('nav-', '');
                return userPermissions.includes(moduleId);
            }
            return true;
        });
    }, [currentUser, rolePermissions]);

    const handleLogin = async (email: string) => {
        const user = await api.login(email);
        setCurrentUser(user);
        if (user.role === UserRole.RESIDENT) {
            setActivePage('dashboard');
        } else if (user.role === UserRole.SUPPORT) {
            setActivePage('support-desk');
        } else {
            setActivePage('dashboard');
        }
    };

    const handleRegistration = (user: User) => {
        setJustRegistered(true);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActivePage('dashboard');
    };

    const handleSaveUser = async (userData: Partial<User>) => {
        if (editingUser) {
            const updated = await api.updateUser(editingUser.id, userData);
            setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
            addToast('Usuário editado com sucesso!', 'success');
            setEditingUser(null);
        } else {
            const newUser = await api.createUser(userData as any);
            setUsers(prev => [newUser, ...prev]);
            addToast('Usuário adicionado com sucesso!', 'success');
        }
    };

    const handleConfirmDeleteUser = async () => {
        if (deleteUserId) {
            const userToDelete = users.find(u => u.id === deleteUserId);
            await api.deleteUser(deleteUserId);
            setUsers(prev => prev.filter(u => u.id !== deleteUserId));

            addToast('Usuário removido.', 'success', async () => {
                if (userToDelete) {
                    await api.restoreUser(userToDelete);
                    setUsers(prev => [userToDelete, ...prev]);
                    addToast('Usuário restaurado!', 'info');
                }
            });
            setDeleteUserId(null);
        }
    };



    const handleUpdateCurrentUser = async (userData: Partial<User>) => {
        if (!currentUser) return;
        const updated = await api.updateUser(currentUser.id, userData);
        setCurrentUser(updated);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
        addToast('Perfil atualizado com sucesso!', 'success');
    };

    const handleUpdateCondo = async (newCondoId: string) => {
        if (!currentUser) return;
        await api.updateUserCondo(currentUser.id, newCondoId);
        setCurrentUser({ ...currentUser, condominiumId: newCondoId });
        addToast('Condomínio alterado com sucesso', 'success');
    };

    const handleSendSupport = async (msg: string) => {
        if (!currentUser) return;
        await api.sendSupportMessage(currentUser.id, msg, 'CONDO_CHANGE_REQUEST');
        addToast('Mensagem enviada!', 'success');
    };

    const handleUpdatePermissions = async (newPermissions: RolePermissions) => {
        await api.updatePermissions(newPermissions);
        setRolePermissions(newPermissions);
        addToast('Permissões atualizadas.', 'success');
    }

    const handleMarkNotification = (id: string) => {
        api.markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleAddCondo = async (condoData: Omit<Condominium, 'id'>) => {
        const newCondo = await api.createCondo(condoData);
        setCondos(prev => [...prev, newCondo]);
        addToast('Condomínio adicionado com sucesso!', 'success');
    };

    const handleEditCondo = async (id: string, condoData: Partial<Condominium>) => {
        const updated = await api.updateCondo(id, condoData);
        setCondos(prev => prev.map(c => c.id === id ? updated : c));
        addToast('Condomínio editado com sucesso!', 'success');
    };

    const handleDeleteCondo = async (id: string) => {
        const condoToDelete = condos.find(c => c.id === id);
        await api.deleteCondo(id);
        setCondos(prev => prev.filter(c => c.id !== id));

        addToast('Condomínio removido.', 'success', async () => {
            if (condoToDelete) {
                await api.restoreCondo(condoToDelete);
                setCondos(prev => [...prev, condoToDelete]);
                addToast('Condomínio restaurado!', 'info');
            }
        });
    };

    const handleUpdateResources = async (condoId: string, resources: string[]) => {
        const updatedCondo = await api.updateCondoResources(condoId, resources);
        setCondos(prev => prev.map(c => c.id === condoId ? updatedCondo : c));
    };

    const handleNavigate = (page: string) => {
        setActivePage(page);
        setIsMobileMenuOpen(false);
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} onRegister={handleRegistration} />;
    }

    const getCondoName = (id?: string) => {
        if (!id) return 'N/A';
        return condos.find(c => c.id === id)?.name || 'Desconhecido';
    };

    const isPageAllowed = rolePermissions[currentUser.role]?.includes(activePage);
    const currentCondoData = condos.find(c => c.id === currentUser.condominiumId);
    const unreadCount = notifications.filter(n => !n.read).length;
    const userHasChatPermission = rolePermissions[currentUser.role]?.includes('chat');
    const condoHasChatEnabled = currentCondoData ? (currentCondoData.features?.isChatEnabled ?? true) : true;
    const showChatWidget = currentUser.role !== UserRole.SUPPORT && userHasChatPermission && condoHasChatEnabled;

    return (
        <div className="flex h-[100dvh] bg-gradient-to-br from-slate-200 via-slate-100 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden relative transition-colors duration-300">
            <Sidebar
                currentUser={currentUser}
                activePage={activePage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                theme={theme}
                toggleTheme={toggleTheme}
                rolePermissions={rolePermissions}
                isMobileOpen={isMobileMenuOpen}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-white/50 dark:border-slate-800 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm mx-4 mt-4 rounded-2xl md:mx-0 md:mt-0 md:rounded-none md:bg-transparent md:border-b-0 md:shadow-none md:py-6 md:px-8 transition-colors">
                    {/* Header Content... (Kept concise for brevity, assumes identical to original) */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="mr-3 p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg"
                        >
                            <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">GestorCondo</h2>
                    </div>

                    <h2 className="hidden md:block text-2xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
                        {APP_MODULES.find(m => m.id === activePage)?.label || activePage}
                    </h2>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-yellow-500 transition-colors"
                            title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>



                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800 transition-colors relative"
                            >
                                <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                                )}
                            </button>
                            {/* Notification Dropdown (Responsive: Modal on mobile, Dropdown on desktop) */}
                            {showNotifications && (
                                <div className="fixed inset-x-4 top-20 z-50 md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 origin-top-right">
                                    {/* Content same as original */}
                                    <div className="p-4 border-b border-slate-100/50 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                                            Notificações
                                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{unreadCount}</span>
                                        </h4>
                                        <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                                <Bell className="w-8 h-8 text-slate-300 mb-2" />
                                                <p className="text-sm">Nenhuma notificação.</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className={`p-4 border-b border-slate-50/50 dark:border-slate-700/30 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`} onClick={() => handleMarkNotification(n.id)}>
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-blue-500 shadow-glow-blue' : 'bg-slate-300'}`}></div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.title}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className="text-[10px] text-slate-400 font-medium">{new Date(n.date).toLocaleDateString()} • {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Separator */}
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                        <div className="flex items-center gap-2 md:gap-4 pl-2">
                            <div className="relative">
                                <div
                                    className="flex items-center gap-3 cursor-pointer group"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    id="header-user-profile"
                                >
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none group-hover:text-blue-600 transition-colors">{currentUser.name}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wide">
                                            {currentUser.role === UserRole.SUPER_ADMIN ? 'Super Admin' : currentUser.role === UserRole.SYNDIC ? 'Síndico' : 'Morador'}
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <img
                                            src={currentUser.avatarUrl || 'https://via.placeholder.com/40'}
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm group-hover:border-blue-100 transition-all"
                                        />
                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-slate-50 dark:border-slate-900 rounded-full ${currentUser.role === UserRole.SUPER_ADMIN ? 'bg-purple-500' : currentUser.role === UserRole.SUPPORT ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                                    </div>
                                </div>

                                {/* Dropdown Menu */}
                                {showUserMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                                        <div className="absolute right-0 top-full mt-4 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 md:hidden">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{currentUser.role === UserRole.SUPER_ADMIN ? 'Super Admin' : currentUser.role === UserRole.SYNDIC ? 'Síndico' : 'Morador'}</p>
                                            </div>
                                            <button
                                                onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 font-medium transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-slate-400" />
                                                Configurações
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleLogout}
                                title="Sair"
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0">
                    {!isPageAllowed ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Shield className="w-16 h-16 text-red-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Acesso Negado</h3>
                            <p>Você não tem permissão para acessar este módulo.</p>
                        </div>
                    ) : (
                        <>
                            {activePage === 'dashboard' && (
                                <DashboardModule currentUser={currentUser} users={users} condos={condos} addToast={addToast} />
                            )}
                            {activePage === 'support-desk' && (
                                <SupportModule currentUser={currentUser} />
                            )}
                            {activePage === 'agenda' && (
                                <AgendaModule currentUser={currentUser} currentCondo={currentCondoData} allCondos={condos} addToast={addToast} />
                            )}
                            {activePage === 'resources' && (
                                <ResourcesModule currentUser={currentUser} allCondos={condos} onUpdateCondo={handleUpdateResources} addToast={addToast} />
                            )}
                            {/* NEW MODULE RENDER */}
                            {activePage === 'documents' && (
                                <DocumentsModule currentUser={currentUser} allCondos={condos} addToast={addToast} />
                            )}
                            {activePage === 'condos' && (
                                <CondoModule condos={condos} user={currentUser} onAddCondo={handleAddCondo} onEditCondo={handleEditCondo} onDeleteCondo={handleDeleteCondo} />
                            )}
                            {activePage === 'financial' && (
                                <FinancialModule users={users} currentUser={currentUser} />
                            )}
                            {activePage === 'settings' && (
                                <SettingsView
                                    user={currentUser}
                                    condos={condos}
                                    onUpdateCondo={handleUpdateCondo}
                                    onUpdateUser={handleUpdateCurrentUser}
                                    onOpenSupport={() => setIsSupportOpen(true)}
                                    rolePermissions={rolePermissions}
                                    onUpdatePermissions={handleUpdatePermissions}
                                    onStartTour={() => setIsTourOpen(true)}
                                />
                            )}
                            {activePage === 'access-control' && (
                                <AccessControlView currentUserRole={currentUser.role} currentUser={currentUser} currentCondo={currentCondoData} allCondos={condos} addToast={addToast} />
                            )}
                            {activePage === 'virtual-assembly' && currentUser && (
                                <AssemblyView currentUser={currentUser} addToast={addToast} />
                            )}
                            {activePage === 'marketplace' && currentUser && (
                                <MarketplaceView currentUser={currentUser} currentCondo={currentCondoData} allCondos={condos} addToast={addToast} />
                            )}
                            {activePage === 'users' && (
                                <div className="max-w-full mx-auto">
                                    {/* ... Users list component (reused from original) ... */}
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
                                                    {loading ? (
                                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Carregando dados...</td></tr>
                                                    ) : users.map((user) => (
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
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {showChatWidget && <ChatWidget currentUser={currentUser} />}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <GuidedTour steps={filteredTourSteps} isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} onComplete={handleTourComplete} onNavigate={handleNavigate} />
            <UserModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser(null); }} onSave={handleSaveUser} currentUser={currentUser} condos={condos} initialData={editingUser} />
            <SupportChatModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} onSend={handleSendSupport} currentUser={currentUser} />
            <ConfirmModal isOpen={!!deleteUserId} onClose={() => setDeleteUserId(null)} onConfirm={handleConfirmDeleteUser} title="Excluir Usuário" description="Tem certeza que deseja remover este usuário? Esta ação pode ser desfeita por um curto período." confirmText="Excluir" isDestructive={true} />
        </div>
    );
};

export default App;