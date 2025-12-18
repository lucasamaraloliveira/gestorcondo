import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Settings, LogOut, ShieldCheck, ChevronLeft, ChevronRight, DollarSign, Sun, Moon, Calendar, Armchair, Headphones, KeyRound, FolderOpen, Gavel, ShoppingBag } from 'lucide-react';
import { APP_MODULES } from '../constants';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';

interface SidebarProps {
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
}

// Map icon names to components
const iconMap: Record<string, any> = {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    DollarSign,
    Calendar,
    Armchair,
    Headphones,
    KeyRound,
    FolderOpen,
    Gavel,
    ShoppingBag
};

const Sidebar: React.FC<SidebarProps> = ({
    isMobileOpen = false,
    onCloseMobile
}) => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuthStore();
    const { theme, toggleTheme } = useUIStore();
    const { rolePermissions } = useDataStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!currentUser) return null;

    // Get allowed modules for current user role
    const allowedModules = rolePermissions[currentUser.role] || [];

    // Filter APP_MODULES based on permissions
    const filteredMenu = APP_MODULES.filter(module => allowedModules.includes(module.id) && module.id !== 'settings');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Determine sidebar content structure
    const sidebarContent = (
        <div className={`flex flex-col w-full h-full ${!isMobileOpen ? 'rounded-3xl border border-white/10 dark:border-slate-700 shadow-lg' : ''} bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl text-white overflow-hidden relative z-10`}>

            {/* Header */}
            <div className={`p-6 border-b border-white/10 dark:border-slate-700 flex items-center relative z-10 transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'justify-center flex-col gap-4 px-2' : 'justify-between'}`}>
                <div className={`flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center' : 'space-x-3'}`}>
                    <div className="bg-blue-600/20 p-2 rounded-lg shrink-0 transition-transform hover:scale-105">
                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className={`text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        GestorCondo
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 relative z-10 custom-scrollbar">
                {filteredMenu.map((item) => {
                    const Icon = iconMap[item.iconName] || LayoutDashboard;
                    const isCollapsedMode = isCollapsed && !isMobileOpen;

                    return (
                        <NavLink
                            key={item.id}
                            to={`/${item.id}`}
                            id={`nav-${item.id}`} // Added ID for Tour Targeting
                            title={isCollapsedMode ? item.label : ''}
                            onClick={onCloseMobile}
                            className={({ isActive }) => `flex w-full rounded-xl transition-all duration-300 group relative 
                                ${isActive
                                    ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white'
                                    : 'text-slate-400 hover:bg-white/10 hover:text-white'} 
                                ${isCollapsedMode
                                    ? 'flex-col items-center justify-center py-3 px-1 gap-1'
                                    : 'flex-row items-center py-3.5 px-4'}`}
                        >
                            <Icon className={`transition-all shrink-0 
                                ${isCollapsedMode
                                    ? 'w-6 h-6'
                                    : 'w-5 h-5 mr-3'} 
                                ${item.id === 'settings' ? 'group-hover:rotate-45' : ''} 
                            `}
                            />

                            <span className={`transition-all duration-300 transform origin-left
                                ${isCollapsedMode
                                    ? 'text-[10px] font-medium text-center leading-tight w-full opacity-100 scale-100 block'
                                    : 'text-base font-medium whitespace-nowrap w-auto opacity-100'}`}>
                                {isCollapsedMode ? (item.shortLabel || item.label) : item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>

        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`hidden md:flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'} h-[calc(100vh-1rem)] my-2 ml-2 relative`}>
                {/* Trigger Button - Floating Style outside the clipped container */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 z-50 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-slate-100 dark:border-slate-900 shadow-lg cursor-pointer hover:bg-blue-500 transition-all hover:scale-110"
                    title={isCollapsed ? "Expandir menu" : "Recolher menu"}
                >
                    {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
                </button>

                {sidebarContent}
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                        onClick={onCloseMobile}
                    ></div>

                    <div className="relative flex-1 flex flex-col max-w-xs w-full h-full bg-slate-900 animate-in slide-in-from-left duration-300">
                        {/* Reuse content without rounded corners for mobile drawer style */}
                        {sidebarContent}
                    </div>

                    <div className="flex-shrink-0 w-14" aria-hidden="true">
                        {/* Dummy element to force sidebar width */}
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;