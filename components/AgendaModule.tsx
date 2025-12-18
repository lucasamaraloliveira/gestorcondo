import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Plus, MapPin, ChevronLeft, ChevronRight, Building2, X, Trash2, User as UserIcon, AlertTriangle, DollarSign, FileText, CheckCircle2, Lock, Download } from 'lucide-react';
import { UserRole, CalendarEvent, EventType } from '../types';
import { api } from '../services/api';
import { pdfService } from '../services/pdfService';
import { BrandContext } from '../BrandContext';
import { useContext } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';

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

const AgendaModule: React.FC = () => {
  const { config } = useContext(BrandContext);
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const { condos: allCondos, addBill } = useDataStore();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<EventType>('BOOKING');
  const [resource, setResource] = useState('');

  if (!currentUser) return null;

  const accessibleCondos = useMemo(() => {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return allCondos;
    }
    if (currentUser.role === UserRole.SYNDIC) {
      const managedIds = currentUser.managedCondoIds || [];
      return allCondos.filter(c => managedIds.includes(c.id) || c.id === currentUser.condominiumId);
    }
    const currentCondo = allCondos.find(c => c.id === currentUser.condominiumId);
    return currentCondo ? [currentCondo] : [];
  }, [currentUser, allCondos]);

  const [selectedCondoId, setSelectedCondoId] = useState<string>('');

  useEffect(() => {
    if (!selectedCondoId && accessibleCondos.length > 0) {
      setSelectedCondoId(accessibleCondos[0].id);
    }
  }, [accessibleCondos, selectedCondoId]);

  const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId);

  useEffect(() => {
    if (selectedCondoId) {
      loadEvents(selectedCondoId);
    }
  }, [selectedCondoId]);

  const loadEvents = async (condoId: string) => {
    setLoading(true);
    try {
      const data = await api.getEvents(condoId);
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setDate(clickedDate.toISOString().split('T')[0]);
  };

  const getEventsForDay = (day: number) => {
    const targetDateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return events.filter(e => e.date === targetDateStr);
  };

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

      if (type === 'BOOKING' && resource && RESOURCE_INFO[resource]?.price > 0) {
        await addBill({
          userId: currentUser.id,
          type: 'RESERVATION',
          description: `Reserva - ${resource} (${new Date(date).toLocaleDateString()})`,
          value: RESOURCE_INFO[resource].price,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
          barCode: '12345.67890 12345.67890 12345.67890 1 1234567890',
        });
        addToast(`Reserva realizada! Boleto gerado.`, 'success');
      } else {
        addToast("Agendamento realizado com sucesso!", "success");
      }

      setShowModal(false);
      resetForm();
      loadEvents(activeCondo.id);
    } catch (error: any) {
      addToast(error.message || 'Erro ao criar agendamento', 'error');
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventDetails(event);
    setViewModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventDetails) return;
    if (window.confirm("Deseja excluir este agendamento?")) {
      try {
        await api.deleteEvent(selectedEventDetails.id);
        addToast("Evento removido com sucesso.", "success");
        setViewModalOpen(false);
        if (activeCondo) loadEvents(activeCondo.id);
      } catch (e) {
        addToast("Erro ao remover evento.", "error");
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(selectedDate ? selectedDate.toISOString().split('T')[0] : '');
    setStartTime('');
    setEndTime('');
    setType('BOOKING');
    setResource('');
  };

  const isResident = currentUser.role === UserRole.RESIDENT;
  const canDelete = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;
  const currentResourceInfo = resource ? RESOURCE_INFO[resource] : null;

  if (!activeCondo) {
    return <div className="p-8 text-center text-slate-500">Nenhum condomínio disponível.</div>;
  }

  // Pre-calculate calendar grid
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" /> Agenda & Reservas
          </h2>
          {accessibleCondos.length > 1 ? (
            <select value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-lg p-2 outline-none min-w-[250px]">
              {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : <p className="text-slate-500 text-sm flex items-center mt-1"><Building2 className="w-4 h-4 mr-1.5" />{activeCondo.name}</p>}
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95"><Plus className="w-4 h-4 mr-2" />Novo Agendamento</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex space-x-2">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-center text-xs font-semibold text-slate-400"> {day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="min-h-[5rem] sm:min-h-[8rem]" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
              return (
                <div key={day} onClick={() => handleDayClick(day)} className={`min-h-[6rem] sm:min-h-[8rem] p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col relative ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300'}`}>
                  <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }} className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate font-medium ${ev.type === 'BOOKING' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                        {ev.type === 'BOOKING' ? 'Reserva' : 'Evento'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 p-6 max-h-[500px] overflow-y-auto">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Eventos</h3>
            <div className="space-y-3">
              {loading ? <p className="text-slate-500 text-center">Carregando...</p> : filteredEvents.length === 0 ? <p className="text-sm text-slate-400 italic text-center">Nenhum evento.</p> : filteredEvents.map(event => (
                <div key={event.id} onClick={() => handleEventClick(event)} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">{event.title}</h4>
                  <p className="text-xs text-slate-500 mb-2">{event.startTime} - {event.endTime} {event.resource ? `| ${event.resource}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Áreas Comuns</h3>
            <div className="space-y-3">
              {activeCondo.resources?.map(res => (
                <div key={res} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{res}</span>
                  <button onClick={() => { resetForm(); setType('BOOKING'); setResource(res); setShowModal(true); }} className="text-xs text-blue-600 hover:underline">Reservar</button>
                </div>
              )) || <p className="text-sm text-slate-400 italic">Nada disponível.</p>}
            </div>
          </div>
        </div>
      </div>

      {viewModalOpen && selectedEventDetails && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/75" onClick={() => setViewModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl relative z-[71]">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{selectedEventDetails.title}</h3>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p><Calendar className="inline w-4 h-4 mr-2" />{new Date(selectedEventDetails.date).toLocaleDateString()}</p>
              <p><Clock className="inline w-4 h-4 mr-2" />{selectedEventDetails.startTime} - {selectedEventDetails.endTime}</p>
              {selectedEventDetails.resource && <p><MapPin className="inline w-4 h-4 mr-2" />{selectedEventDetails.resource}</p>}
              <p><UserIcon className="inline w-4 h-4 mr-2" />Agendado por: {selectedEventDetails.userName}</p>
            </div>
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              {canDelete && <button onClick={handleDeleteEvent} className="px-4 py-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 mr-auto"><Trash2 className="w-4 h-4" /></button>}
              <button onClick={() => setViewModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Fechar</button>
              {selectedEventDetails.type === 'BOOKING' && (
                <button onClick={() => pdfService.generateReservationPDF(selectedEventDetails, selectedEventDetails.resource ? RESOURCE_INFO[selectedEventDetails.resource]?.rules || [] : [], config)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg"><Download className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/75" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg p-6 rounded-2xl relative z-[61]">
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">{type === 'BOOKING' ? 'Nova Reserva' : 'Novo Evento'}</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              {!isResident && (
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                  <button type="button" onClick={() => setType('BOOKING')} className={`flex-1 py-1.5 text-sm font-medium rounded ${type === 'BOOKING' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Reserva</button>
                  <button type="button" onClick={() => setType('MEETING')} className={`flex-1 py-1.5 text-sm font-medium rounded ${type === 'MEETING' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Evento</button>
                </div>
              )}
              {type === 'BOOKING' && currentResourceInfo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 border-l-4 border-blue-500">
                  <p className="font-bold mb-1">Regras:</p>
                  <ul className="list-disc ml-4">{currentResourceInfo.rules.map((rule, i) => <li key={i}>{rule}</li>)}</ul>
                  {currentResourceInfo.price > 0 && <p className="mt-2 font-bold">Taxa: R$ {currentResourceInfo.price.toFixed(2)}</p>}
                </div>
              )}
              <input type="text" required placeholder="Título" className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} />
              {type === 'BOOKING' && (
                <select required className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white" value={resource} onChange={e => setResource(e.target.value)}>
                  <option value="">Selecione...</option>
                  {activeCondo.resources?.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="p-2 border rounded-lg dark:bg-slate-900 dark:text-white" value={date} onChange={e => setDate(e.target.value)} />
                <div className="flex gap-2">
                  <input type="time" required className="flex-1 p-2 border rounded-lg dark:bg-slate-900 dark:text-white" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  <input type="time" required className="flex-1 p-2 border rounded-lg dark:bg-slate-900 dark:text-white" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <textarea rows={2} placeholder="Descrição" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:text-white" value={description} onChange={e => setDescription(e.target.value)} />
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Confirmar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AgendaModule;