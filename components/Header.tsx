import React, { useState } from 'react';
import { Menu, Sun, Moon, Bell, X, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import { APP_MODULES } from '../constants';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
    onOpenMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
    const { currentUser, logout } = useAuthStore();
    const { theme, toggleTheme } = useUIStore();
    const { notifications } = useDataStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    if (!currentUser) return null;

    const activePageId = location.pathname.split('/')[1] || 'dashboard';
    const activePageLabel = APP_MODULES.find(m => m.id === activePageId)?.label || activePageId;
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-white/50 dark:border-slate-800 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm mx-4 mt-4 rounded-2xl md:mx-0 md:mt-0 md:rounded-none md:bg-transparent md:border-b-0 md:shadow-none md:py-6 md:px-8 transition-colors">
            <div className="flex items-center md:hidden">
                <button
                    onClick={onOpenMobileMenu}
                    className="mr-3 p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg"
                >
                    <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">GestorCondo</h2>
            </div>

            <h2 className="hidden md:block text-2xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
                {activePageLabel}
            </h2>

            <div className="flex items-center space-x-2 md:space-x-4">
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

                    {showNotifications && (
                        <div className="fixed inset-x-4 top-20 z-50 md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 origin-top-right">
                            <div className="p-4 border-b border-slate-100/50 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                                    Notificações
                                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{unreadCount}</span>
                                </h4>
                                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full transition-colors">
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                        <Bell className="w-8 h-8 text-slate-300 mb-2" />
                                        <p className="text-sm">Nenhuma notificação.</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-slate-50/50 dark:border-slate-700/30 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                <div className="flex items-center gap-2 md:gap-4 pl-2">
                    <div className="relative">
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{currentUser.name}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wide">{currentUser.role}</p>
                            </div>
                            <img
                                src={currentUser.avatarUrl || 'https://via.placeholder.com/40'}
                                alt="Profile"
                                className="w-9 h-9 rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm"
                            />
                        </div>

                        {showUserMenu && (
                            <div className="absolute right-0 top-full mt-4 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50">
                                <button
                                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    Configurações
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
