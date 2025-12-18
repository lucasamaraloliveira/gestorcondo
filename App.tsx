import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import { useDataStore } from './store/useDataStore';
import { TOUR_STEPS } from './constants';

// Layout & Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/ChatWidget';
import GuidedTour from './components/GuidedTour';
import { ToastContainer } from './components/Toast';
import SupportChatModal from './components/SupportChatModal';

// Views
import LoginScreen from './components/LoginScreen';
import DashboardModule from './components/DashboardModule';
import SupportModule from './components/SupportModule';
import AgendaModule from './components/AgendaModule';
import ResourcesModule from './components/ResourcesModule';
import DocumentsModule from './components/DocumentsModule';
import CondoModule from './components/CondoModule';
import FinancialModule from './components/FinancialModule';
import SettingsView from './components/SettingsView';
import UsersView from './components/UsersView';
import { AccessControlView } from './components/AccessControlView';
import { AssemblyView } from './components/AssemblyView';
import { MarketplaceView } from './components/MarketplaceView';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuthStore();
    const { toasts, removeToast, isTourOpen, setTourOpen, isSupportChatOpen, setSupportChatOpen } = useUIStore();
    const { condos, rolePermissions, fetchInitialData } = useDataStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchInitialData(currentUser);
        }
    }, [currentUser, fetchInitialData]);

    if (!currentUser) return <Navigate to="/login" />;

    const currentCondoData = condos.find(c => c.id === currentUser.condominiumId);
    const userHasChatPermission = rolePermissions[currentUser.role]?.includes('chat');
    const condoHasChatEnabled = currentCondoData ? (currentCondoData.features?.isChatEnabled ?? true) : true;
    const showChatWidget = currentUser.role !== 'SUPPORT' && userHasChatPermission && condoHasChatEnabled;

    return (
        <div className="flex h-[100dvh] bg-slate-100 dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
            <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0">
                    {children}
                </div>
            </main>

            {showChatWidget && <ChatWidget />}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <GuidedTour steps={TOUR_STEPS} />
            <SupportChatModal />
        </div>
    );
};

const App: React.FC = () => {
    const { isAuthenticated } = useAuthStore();

    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <LoginScreen onRegister={() => { }} /> : <Navigate to="/dashboard" />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Layout><DashboardModule /></Layout>} />
                <Route path="/users" element={<Layout><UsersView /></Layout>} />
                <Route path="/condos" element={<Layout><CondoModule /></Layout>} />
                <Route path="/financial" element={<Layout><FinancialModule /></Layout>} />
                <Route path="/agenda" element={<Layout><AgendaModule /></Layout>} />
                <Route path="/resources" element={<Layout><ResourcesModule /></Layout>} />
                <Route path="/documents" element={<Layout><DocumentsModule /></Layout>} />
                <Route path="/support-desk" element={<Layout><SupportModule /></Layout>} />
                <Route path="/access-control" element={<Layout><AccessControlView /></Layout>} />
                <Route path="/virtual-assembly" element={<Layout><AssemblyView /></Layout>} />
                <Route path="/marketplace" element={<Layout><MarketplaceView /></Layout>} />
                <Route path="/settings" element={<Layout><SettingsView /></Layout>} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

export default App;