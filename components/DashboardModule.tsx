import React, { useState, useEffect, useMemo } from 'react';
import { User, Condominium, UserRole, Bill, CalendarEvent, EventType } from '../types';
import { api } from '../services/api';
import { UserCircle, Building2, AlertTriangle, AlertCircle, FileText, Calendar, Clock, MapPin, BarChart3, ChevronDown, Check, Copy } from 'lucide-react';

interface DashboardModuleProps {
  currentUser: User;
  users: User[];
  condos: Condominium[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 dark:border-slate-700 flex items-center hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl mr-4 ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
    </div>
  </div>
);

// --- VISÃO ADMIN / SÍNDICO ---
const AdminDashboard = ({ users, condos, currentUser }: { users: User[], condos: Condominium[], currentUser: User }) => {
  const [recentEvents, setRecentEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<'day' | 'week' | 'month'>('month');

  // Determinar quais usuários são inadimplentes
  const overdueUsers = useMemo(() => {
     // Se for síndico, filtrar apenas usuários dos condominios que ele gerencia
     const targetUsers = currentUser.role === UserRole.SYNDIC 
        ? users.filter(u => currentUser.managedCondoIds?.includes(u.condominiumId || ''))
        : users;
     return targetUsers.filter(u => u.financialStatus === 'OVERDUE');
  }, [users, currentUser]);

  useEffect(() => {
    // Carregar eventos para estatísticas de ocupação
    // Em um app real, buscaria com range de datas. Aqui vamos filtrar o que já temos.
    // Para simplificar a demo, pegamos do primeiro condomínio ou do do síndico
    const targetCondoId = currentUser.role === UserRole.SYNDIC && currentUser.managedCondoIds ? currentUser.managedCondoIds[0] : condos[0]?.id;
    
    if (targetCondoId) {
        api.getEvents(targetCondoId).then(evs => {
            setRecentEvents(evs);
        });
    }
  }, [condos, currentUser]);

  const filteredEvents = useMemo(() => {
      const now = new Date();
      return recentEvents.filter(e => {
          const evDate = new Date(e.date);
          if (filter === 'day') {
              return evDate.toDateString() === now.toDateString();
          } else if (filter === 'week') {
              const nextWeek = new Date();
              nextWeek.setDate(now.getDate() + 7);
              return evDate >= now && evDate <= nextWeek;
          } else {
              return evDate.getMonth() === now.getMonth() && evDate.getFullYear() === now.getFullYear();
          }
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [recentEvents, filter]);

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Usuários" value={users.length.toString()} icon={UserCircle} color="bg-blue-500" />
        <StatCard title="Condomínios Ativos" value={condos.length.toString()} icon={Building2} color="bg-indigo-500" />
        <StatCard title="Inadimplentes" value={overdueUsers.length.toString()} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Reservas (Mês)" value={recentEvents.filter(e => e.type === 'BOOKING').length.toString()} icon={Calendar} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Inadimplência */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                 <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                 Inadimplência Recente
              </h3>
              <span className="text-xs font-semibold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full">
                 {overdueUsers.length} Pendentes
              </span>
           </div>
           
           <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {overdueUsers.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-4">Nenhum registro de inadimplência.</p>
              ) : (
                 overdueUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border-l-4 border-red-400">
                       <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold mr-3">
                             {user.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                             <p className="text-xs text-slate-500">{user.unitId ? `Unidade ${user.unitId}` : user.email}</p>
                          </div>
                       </div>
                       <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          Ver Detalhes
                       </button>
                    </div>
                 ))
              )}
           </div>
        </div>

        {/* Ocupação e Reservas */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                 <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
                 Ocupação das Áreas
              </h3>
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                 <button onClick={() => setFilter('day')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'day' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}>Dia</button>
                 <button onClick={() => setFilter('week')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'week' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}>Semana</button>
                 <button onClick={() => setFilter('month')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'month' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}>Mês</button>
              </div>
           </div>

           <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredEvents.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-4">Nenhuma reserva para este período.</p>
              ) : (
                 filteredEvents.filter(e => e.type === 'BOOKING').map(ev => (
                    <div key={ev.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                       <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{ev.resource}</p>
                          <p className="text-xs text-slate-500 flex items-center mt-1">
                             <Calendar className="w-3 h-3 mr-1" />
                             {new Date(ev.date).toLocaleDateString()} • {ev.startTime} - {ev.endTime}
                          </p>
                       </div>
                       <span className="text-xs font-medium px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                          Reservado
                       </span>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};


// --- VISÃO MORADOR ---
const ResidentDashboard = ({ currentUser, addToast }: { currentUser: User, addToast: (msg: string, type: 'success' | 'error' | 'info') => void }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [condoEvents, setCondoEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // Buscar faturas se estiver inadimplente ou apenas pendente
    api.getUserBills(currentUser.id).then(setBills);

    // Buscar eventos
    if (currentUser.condominiumId) {
        api.getEvents(currentUser.condominiumId).then(events => {
            const myEvs = events.filter(e => e.userId === currentUser.id && e.type === 'BOOKING');
            const condoEvs = events.filter(e => e.type === 'MEETING' || e.type === 'MAINTENANCE');
            setMyEvents(myEvs);
            setCondoEvents(condoEvs);
        });
    }
  }, [currentUser]);

  const handleCopyBarcode = (code: string) => {
      navigator.clipboard.writeText(code).then(() => {
          addToast('Código de barras copiado para a área de transferência!', 'success');
      }).catch(() => {
          addToast('Erro ao copiar código. Tente selecionar manualmente.', 'error');
      });
  };

  const isOverdue = currentUser.financialStatus === 'OVERDUE';

  return (
    <div className="space-y-6">
       
       {/* Alerta de Inadimplência */}
       {isOverdue && (
         <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm animate-in slide-in-from-top-5 duration-500">
            <div className="flex items-start">
               <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mr-4 flex-shrink-0" />
               <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Atenção: Pendências Financeiras</h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                     Identificamos boletos em aberto no seu cadastro. Algumas funcionalidades podem estar limitadas até a regularização.
                  </p>
                  
                  <div className="mt-4 space-y-3">
                     {bills.map(bill => (
                        <div key={bill.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-200 dark:border-red-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                           <div className="mb-2 sm:mb-0">
                              <p className="font-semibold text-slate-800 dark:text-white text-sm">{bill.description}</p>
                              <p className="text-xs text-red-500 font-medium">Vencimento: {new Date(bill.dueDate).toLocaleDateString()}</p>
                           </div>
                           <div className="flex items-center gap-3 w-full sm:w-auto">
                              <span className="font-bold text-slate-700 dark:text-slate-200">R$ {bill.value.toFixed(2)}</span>
                              <button 
                                onClick={() => handleCopyBarcode(bill.barCode)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center active:scale-95"
                              >
                                 <Copy className="w-3 h-3 mr-1.5" />
                                 Copiar Código
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Minhas Reservas */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-6">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Minhas Próximas Reservas
             </h3>
             
             <div className="space-y-3">
                {myEvents.length === 0 ? (
                   <p className="text-sm text-slate-500 italic">Você não possui reservas agendadas.</p>
                ) : (
                   myEvents.map(ev => (
                      <div key={ev.id} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                         <div className="flex justify-between mb-1">
                            <span className="font-bold text-blue-800 dark:text-blue-300 text-sm">{ev.resource}</span>
                            <span className="text-xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">Confirmado</span>
                         </div>
                         <div className="flex items-center text-xs text-blue-700 dark:text-blue-400 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(ev.date).toLocaleDateString()} às {ev.startTime}
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>

          {/* Mural de Avisos / Eventos */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-6">
                <Building2 className="w-5 h-5 mr-2 text-indigo-500" />
                Mural do Condomínio
             </h3>

             <div className="space-y-4">
                {condoEvents.length === 0 ? (
                   <p className="text-sm text-slate-500 italic">Nenhum evento ou aviso recente.</p>
                ) : (
                   condoEvents.map(ev => (
                      <div key={ev.id} className="flex gap-3 items-start">
                         <div className="bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-600">
                            <span className="text-xs uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-lg leading-none">{new Date(ev.date).getDate()}</span>
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{ev.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded uppercase font-semibold">
                               {ev.type === 'MEETING' ? 'Assembléia' : 'Manutenção'}
                            </span>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

const DashboardModule: React.FC<DashboardModuleProps> = ({ currentUser, users, condos, addToast }) => {
  // Logic: Super Admin and Syndic see Admin View. Resident sees Resident View.
  const isAdminOrSyndic = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;

  return (
    <div className="max-w-full mx-auto">
       <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
             {isAdminOrSyndic ? 'Visão Geral' : `Olá, ${currentUser.name.split(' ')[0]}`}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
             {isAdminOrSyndic 
               ? 'Acompanhe os principais indicadores do sistema.' 
               : 'Bem-vindo ao seu portal do morador.'}
          </p>
       </div>

       {isAdminOrSyndic ? (
          <AdminDashboard users={users} condos={condos} currentUser={currentUser} />
       ) : (
          <ResidentDashboard currentUser={currentUser} addToast={addToast} />
       )}
    </div>
  );
};

export default DashboardModule;