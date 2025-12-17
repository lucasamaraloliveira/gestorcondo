import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Plus, MapPin, ChevronLeft, ChevronRight, Building2, X, Trash2, User as UserIcon, AlertTriangle, DollarSign, FileText, CheckCircle2, Lock } from 'lucide-react';
import { User, UserRole, CalendarEvent, Condominium, EventType } from '../types';
import { api } from '../services/api';

// Mock Rules and Fees
const RESOURCE_INFO: Record<string, { price: number, rules: string[] }> = {
  'Churrasqueira': {
    price: 80.00,
    rules: [
      'Limpeza deve ser feita após o uso.',
      'Horário máximo até 22:00.',
      'Proibido som alto.'
    ]
  },
  'Salão de Festas': {
    price: 250.00,
    rules: [
      'Entregar chaves na portaria.',
      'Lista de convidados obrigatória.',
      'Multa por danos ao patrimônio.'
    ]
  },
  'Piscina': {
    price: 0,
    rules: ['Apenas moradores e convidados cadastrados.', 'Proibido vidro na área da piscina.']
  },
  'Academia': {
    price: 0,
    rules: ['Uso obrigatório de toalha.', 'Limpar equipamentos após uso.']
  }
};

interface AgendaModuleProps {
  currentUser: User;
  currentCondo: Condominium | undefined; // Condomínio selecionado no perfil global
  allCondos: Condominium[]; // Lista completa para Admin/Síndico alternar
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AgendaModule: React.FC<AgendaModuleProps> = ({ currentUser, currentCondo, allCondos, addToast }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals State
  const [showModal, setShowModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<CalendarEvent | null>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<EventType>('BOOKING');
  const [resource, setResource] = useState('');

  // Determine accessible condos based on Role
  const accessibleCondos = useMemo(() => {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return allCondos;
    }
    if (currentUser.role === UserRole.SYNDIC) {
      // Síndico vê os que gerencia e o próprio (caso more em um e gerencie outros)
      const managedIds = currentUser.managedCondoIds || [];
      return allCondos.filter(c => managedIds.includes(c.id) || c.id === currentUser.condominiumId);
    }
    // Resident vê apenas o atual
    return currentCondo ? [currentCondo] : [];
  }, [currentUser, allCondos, currentCondo]);

  // State for the currently viewed condo within the module
  const [selectedCondoId, setSelectedCondoId] = useState<string>(currentCondo?.id || '');

  // Update selected condo if props change or on init
  useEffect(() => {
    if (!selectedCondoId && accessibleCondos.length > 0) {
      setSelectedCondoId(accessibleCondos[0].id);
    }
  }, [accessibleCondos, selectedCondoId]);

  // Get full object of selected condo
  const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId) || currentCondo;

  useEffect(() => {
    if (activeCondo?.id) {
      loadEvents(activeCondo.id);
    }
  }, [activeCondo?.id]);

  const loadEvents = async (condoId: string) => {
    setLoading(true);
    try {
      const data = await api.getEvents(condoId);
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    // Pre-fill date in form
    setDate(clickedDate.toISOString().split('T')[0]);
  };

  const getEventsForDay = (day: number) => {
    const targetDateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return events.filter(e => e.date === targetDateStr);
  };

  // Filtered list based on selection
  const filteredEvents = selectedDate
    ? events.filter(e => e.date === selectedDate.toISOString().split('T')[0])
    : events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCondo) return;

    try {
      await api.createEvent({
        condominiumId: activeCondo.id,
        userId: currentUser.id,
        userName: currentUser.name,
        title,
        description,
        date,
        startTime,
        endTime,
        type,
        resource: type === 'BOOKING' ? resource : undefined,
        status: 'CONFIRMED'
      });

      // Automatic Billing Logic
      if (type === 'BOOKING' && resource && RESOURCE_INFO[resource]?.price > 0) {
        await api.createBill({
          userId: currentUser.id,
          type: 'RESERVATION',
          description: `Reserva - ${resource} (${new Date(date).toLocaleDateString()})`,
          value: RESOURCE_INFO[resource].price,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], // 5 days from now
          barCode: '12345.67890 12345.67890 12345.67890 1 1234567890', // Mock
        });
        addToast(`Reserva realizada! Boleto de R$ ${RESOURCE_INFO[resource].price.toFixed(2)} gerado automaticamente.`, 'success');
      } else {
        addToast(type === 'BOOKING' ? "Reserva realizada com sucesso!" : "Evento criado com sucesso!", "success");
      }

      setShowModal(false);
      resetForm();
      loadEvents(activeCondo.id);
    } catch (error: any) {
      const msg = error.message || 'Erro ao criar agendamento';
      addToast(msg, 'error');
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventDetails(event);
    setViewModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventDetails) return;

    const confirm = window.confirm("Tem certeza que deseja excluir este agendamento?");
    if (!confirm) return;

    try {
      await api.deleteEvent(selectedEventDetails.id);
      addToast("Evento removido com sucesso.", "success");
      setViewModalOpen(false);
      setSelectedEventDetails(null);
      if (activeCondo) loadEvents(activeCondo.id);
    } catch (e) {
      addToast("Erro ao remover evento.", "error");
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    // Ensure date is synced with selected calendar date if available
    if (selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
    } else {
      setDate('');
    }
    setStartTime('');
    setEndTime('');
    setType('BOOKING');
    setResource('');
  };

  const isResident = currentUser.role === UserRole.RESIDENT;
  // Check if resident is overdue
  const isOverdue = isResident && currentUser.financialStatus === 'OVERDUE';
  const canDelete = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;

  // Get rules/fees for currently selected resource
  const currentResourceInfo = resource ? RESOURCE_INFO[resource] : null;

  if (!activeCondo) {
    return <div className="p-8 text-center text-slate-500">Nenhum condomínio disponível para visualizar a agenda.</div>;
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Agenda & Reservas
          </h2>

          {/* Condo Selector Logic */}
          {accessibleCondos.length > 1 ? (
            <div className="flex items-center mt-2">
              <Building2 className="w-4 h-4 text-slate-400 mr-2" />
              <select
                value={selectedCondoId}
                onChange={(e) => setSelectedCondoId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none min-w-[250px]"
              >
                {accessibleCondos.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center mt-1">
              <Building2 className="w-4 h-4 mr-1.5" />
              {activeCondo.name}
            </p>
          )}
        </div>

        {/* Reservation Button - Disabled if Overdue */}
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 rounded-xl font-medium transition-colors shadow-lg active:scale-95 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
          title="Nova Reserva"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </button>
      </div>

      {/* Warning message removed as per user request */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex space-x-2">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[5rem] sm:min-h-[8rem] bg-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[6rem] sm:min-h-[8rem] h-auto p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col relative group overflow-hidden
                    ${isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-500'
                    }`}
                >
                  <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mb-1
                    ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                    {day}
                  </span>

                  <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                        className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 transition-opacity
                          ${ev.type === 'BOOKING'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}
                      >
                        <span className="hidden sm:inline">{ev.startTime} </span>
                        {ev.type === 'BOOKING' ? 'Reserva' : 'Evento'}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] sm:text-[10px] text-slate-400 pl-1">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Info & Resources */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 sticky top-0 bg-white dark:bg-slate-800 pb-2">
              {selectedDate
                ? `Eventos de ${selectedDate.toLocaleDateString()}`
                : `Próximos Eventos (${currentDate.toLocaleDateString('pt-BR', { month: 'long' })})`}
            </h3>

            <div className="space-y-3">
              {loading ? (
                <p className="text-slate-500 text-center py-4">Carregando...</p>
              ) : filteredEvents.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">Nenhum evento para este período.</p>
              ) : (
                filteredEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{event.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                             ${event.type === 'BOOKING' ? 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30' : 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30'}`}>
                        {event.type === 'BOOKING' ? 'Reserva' : 'Aviso'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{event.description || 'Sem descrição.'}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.startTime} - {event.endTime}
                      </div>
                      {event.resource && (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {event.resource}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recursos Disponíveis</h3>
            <div className="space-y-3">
              {activeCondo.resources?.length ? (
                activeCondo.resources.map(res => (
                  <div key={res} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{res}</span>
                    <button
                      onClick={() => {
                        resetForm();
                        setType('BOOKING');
                        setResource(res);
                        setShowModal(true);
                      }}
                      className="text-xs font-medium hover:underline text-blue-600 dark:text-blue-400"
                    >
                      Reservar
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">Nenhum recurso cadastrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal View Event Details - Unchanged */}
      {viewModalOpen && selectedEventDetails && createPortal(
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={() => setViewModalOpen(false)}></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase mb-2
                                ${selectedEventDetails.type === 'BOOKING'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                    {selectedEventDetails.type === 'BOOKING' ? 'Reserva' : 'Evento'}
                  </span>
                  <h3 className="text-xl font-bold leading-6 text-slate-900 dark:text-white">
                    {selectedEventDetails.title}
                  </h3>
                </div>
                <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  <Calendar className="w-5 h-5 mr-3 text-slate-400" />
                  <span>{new Date(selectedEventDetails.date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  <Clock className="w-5 h-5 mr-3 text-slate-400" />
                  <span>{selectedEventDetails.startTime} - {selectedEventDetails.endTime}</span>
                </div>

                {selectedEventDetails.resource && (
                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <MapPin className="w-5 h-5 mr-3 text-slate-400" />
                    <span>{selectedEventDetails.resource}</span>
                  </div>
                )}

                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  <UserIcon className="w-5 h-5 mr-3 text-slate-400" />
                  <span>Agendado por: <strong>{selectedEventDetails.userName}</strong></span>
                </div>

                {selectedEventDetails.description && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                    {selectedEventDetails.description}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                {canDelete && (
                  <button
                    onClick={handleDeleteEvent}
                    className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 mr-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </button>
                )}
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Create Event */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={() => setShowModal(false)}></div>

            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white">
                  {type === 'BOOKING'
                    ? (resource ? `Novo Agendamento de ${resource}` : 'Novo Agendamento')
                    : `Novo Evento - ${activeCondo.name}`}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                {/* Type Selection - Only for Admin/Syndic */}
                {!isResident && (
                  <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg mb-4">
                    <button
                      type="button"
                      onClick={() => setType('BOOKING')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'BOOKING' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                    >
                      Reserva
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('MEETING')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'MEETING' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                    >
                      Assembléia/Aviso
                    </button>
                  </div>
                )}

                {/* Resource Info Alert (Rules & Fee) */}
                {type === 'BOOKING' && currentResourceInfo && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300">Regras de Uso</h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 list-disc ml-4 space-y-1">
                          {currentResourceInfo.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                        </ul>
                        {currentResourceInfo.price > 0 ? (
                          <div className="mt-2 font-bold text-sm text-blue-900 dark:text-white flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Taxa de Reserva: R$ {currentResourceInfo.price.toFixed(2)}
                            <span className="text-xs font-normal ml-2 opacity-70">(Cobrada no próximo boleto)</span>
                          </div>
                        ) : (
                          <div className="mt-2 font-bold text-xs text-green-600 dark:text-green-400 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Isento de Taxa
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={type === 'BOOKING' ? "Ex: Aniversário do João" : "Ex: Reunião de Condomínio"}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                {type === 'BOOKING' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recurso / Local</label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={resource}
                      onChange={e => setResource(e.target.value)}
                    >
                      <option value="">Selecione um local...</option>
                      {activeCondo.resources?.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Início</label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fim</label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição (Opcional)</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AgendaModule;