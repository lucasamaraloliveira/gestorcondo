import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Bill, CalendarEvent } from '../types';
import { api } from '../services/api';
import { UserCircle, Building2, AlertTriangle, AlertCircle, Calendar, Clock, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import Skeleton from './ui/Skeleton';

const StatCard = ({ title, value, icon: Icon, color, loading }: { title: string, value: string, icon: any, color: string, loading?: boolean }) => (
   <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 dark:border-slate-700 flex items-center hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl mr-4 ${color} bg-opacity-10 dark:bg-opacity-20`}>
         <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex-1">
         <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
         {loading ? (
            <Skeleton className="h-8 w-16 mt-1" />
         ) : (
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
         )}
      </div>
   </div>
);

// --- VISÃO ADMIN / SÍNDICO ---
const AdminDashboard = () => {
   const { currentUser } = useAuthStore();
   const { users, condos } = useDataStore();
   const [recentEvents, setRecentEvents] = useState<CalendarEvent[]>([]);
   const [filter, setFilter] = useState<'day' | 'week' | 'month'>('month');

   if (!currentUser) return null;

   // Determinar quais usuários são inadimplentes (amostra da página atual)
   const overdueUsers = useMemo(() => {
      const targetUsers = currentUser.role === UserRole.SYNDIC
         ? users.data.filter(u => currentUser.managedCondoIds?.includes(u.condominiumId || ''))
         : users.data;
      return targetUsers.filter(u => u.financialStatus === 'OVERDUE');
   }, [users.data, currentUser]);

   useEffect(() => {
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
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
   }, [recentEvents, filter]);

   return (
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total de Usuários" value={users.total.toString()} icon={UserCircle} color="bg-blue-500" loading={useDataStore().isLoading} />
            <StatCard title="Condomínios Ativos" value={condos.length.toString()} icon={Building2} color="bg-indigo-500" loading={useDataStore().isLoading} />
            <StatCard title="Inadimplentes (Pág 1)" value={overdueUsers.length.toString()} icon={AlertTriangle} color="bg-red-500" loading={useDataStore().isLoading} />
            <StatCard title="Reservas (Mês)" value={recentEvents.filter(e => e.type === 'BOOKING').length.toString()} icon={Calendar} color="bg-emerald-500" loading={useDataStore().isLoading} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {useDataStore().isLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                           <Skeleton variant="circle" className="w-8 h-8 mr-3" />
                           <div className="flex-1">
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                           </div>
                        </div>
                     ))
                  ) : overdueUsers.length === 0 ? (
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
                        </div>
                     ))
                  )}
               </div>
            </div>

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
                  {useDataStore().isLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                           <Skeleton className="h-4 w-32 mb-2" />
                           <Skeleton className="h-3 w-48" />
                        </div>
                     ))
                  ) : filteredEvents.length === 0 ? (
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
const ResidentDashboard = () => {
   const { currentUser } = useAuthStore();
   const { addToast } = useUIStore();
   const [bills, setBills] = useState<Bill[]>([]);
   const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
   const [condoEvents, setCondoEvents] = useState<CalendarEvent[]>([]);
   const [loading, setLoading] = useState(false);

   if (!currentUser) return null;

   useEffect(() => {
      setLoading(true);
      const fetchData = async () => {
         try {
            const billsPromise = api.getUserBills(currentUser.id);
            let eventsPromise = Promise.resolve([] as CalendarEvent[]);

            if (currentUser.condominiumId) {
               eventsPromise = api.getEvents(currentUser.condominiumId);
            }

            const [billsData, eventsData] = await Promise.all([billsPromise, eventsPromise]);

            setBills(billsData);
            const myEvs = eventsData.filter(e => e.userId === currentUser.id && e.type === 'BOOKING');
            const condoEvs = eventsData.filter(e => e.type === 'MEETING' || e.type === 'MAINTENANCE');
            setMyEvents(myEvs);
            setCondoEvents(condoEvs);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [currentUser]);

   const handleCopyBarcode = (code: string) => {
      navigator.clipboard.writeText(code).then(() => {
         addToast('Código de barras copiado!', 'success');
      });
   };

   const isOverdue = currentUser.financialStatus === 'OVERDUE';

   return (
      <div className="space-y-6">
         {isOverdue && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm">
               <div className="flex items-start">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Pendências Financeiras</h3>
                     <div className="mt-4 space-y-3">
                        {bills.map(bill => (
                           <div key={bill.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-200 dark:border-red-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                              <div className="mb-2 sm:mb-0">
                                 <p className="font-semibold text-slate-800 dark:text-white text-sm">{bill.description}</p>
                                 <p className="text-xs text-red-500">Vencimento: {new Date(bill.dueDate).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                 <span className="font-bold text-slate-700 dark:text-slate-200">R$ {bill.value.toFixed(2)}</span>
                                 <button onClick={() => handleCopyBarcode(bill.barCode)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded">Copiar Código</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-6">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  Minhas Próximas Reservas
               </h3>
               <div className="space-y-3">
                  {loading ? (
                     Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                           <Skeleton className="h-4 w-32 mb-2" />
                           <Skeleton className="h-3 w-40" />
                        </div>
                     ))
                  ) : myEvents.length === 0 ? (
                     <p className="text-sm text-slate-500 italic">Nenhuma reserva agendada.</p>
                  ) : (
                     myEvents.map(ev => (
                        <div key={ev.id} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                           <div className="flex justify-between mb-1">
                              <span className="font-bold text-blue-800 dark:text-blue-300 text-sm">{ev.resource}</span>
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

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-6">
                  <Building2 className="w-5 h-5 mr-2 text-indigo-500" />
                  Mural do Condomínio
               </h3>
               <div className="space-y-4">
                  {loading ? (
                     Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex gap-3 items-start">
                           <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                           <div className="flex-1">
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-full" />
                           </div>
                        </div>
                     ))
                  ) : condoEvents.length === 0 ? (
                     <p className="text-sm text-slate-500 italic">Nenhum evento recente.</p>
                  ) : (
                     condoEvents.map(ev => (
                        <div key={ev.id} className="flex gap-3 items-start">
                           <div className="bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-xs uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-lg leading-none">{new Date(ev.date).getDate()}</span>
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm">{ev.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ev.description}</p>
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

const DashboardModule: React.FC = () => {
   const { currentUser } = useAuthStore();
   if (!currentUser) return null;
   const isAdminOrSyndic = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;

   return (
      <div className="max-w-full mx-auto">
         <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
               {isAdminOrSyndic ? 'Visão Geral' : `Olá, ${currentUser.name.split(' ')[0]}`}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
               {isAdminOrSyndic ? 'Estatísticas e indicadores.' : 'Bem-vindo ao seu portal.'}
            </p>
         </div>

         {isAdminOrSyndic ? <AdminDashboard /> : <ResidentDashboard />}
      </div>
   );
};

export default DashboardModule;