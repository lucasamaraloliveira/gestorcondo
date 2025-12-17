import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, CheckCircle, Clock, Search, Filter, 
    MoreHorizontal, Send, User, MapPin, Tag, Archive, 
    Inbox, UserCheck, PhoneCall, Paperclip, ChevronLeft,
    Building2, Activity, PlayCircle, CheckSquare
} from 'lucide-react';
import { SupportTicket, TicketStatus, User as UserType } from '../types';
import { api } from '../services/api';

interface SupportModuleProps {
    currentUser: UserType;
}

const SupportModule: React.FC<SupportModuleProps> = ({ currentUser }) => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<TicketStatus | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    // "Blip" Style View State
    const [activeTab, setActiveTab] = useState<'open' | 'waiting' | 'closed'>('open');

    useEffect(() => {
        loadTickets();
        // Polling para simular tempo real
        const interval = setInterval(loadTickets, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadTickets = async () => {
        const data = await api.getSupportTickets();
        setTickets(data);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedTicketId) return;

        const ticket = tickets.find(t => t.id === selectedTicketId);
        if (!ticket) return;

        // Otimistic UI update
        const newMessage = {
            id: Date.now().toString(),
            sender: 'agent' as const,
            text: messageInput,
            timestamp: new Date().toISOString()
        };
        
        setTickets(prev => prev.map(t => 
            t.id === selectedTicketId 
            ? { ...t, messages: [...t.messages, newMessage] } 
            : t
        ));
        
        const textToSend = messageInput;
        setMessageInput('');

        await api.sendTicketMessage(selectedTicketId, textToSend, 'agent');
    };

    const handleStatusChange = async (newStatus: TicketStatus) => {
        if (!selectedTicketId) return;
        
        setTickets(prev => prev.map(t => 
            t.id === selectedTicketId ? { ...t, status: newStatus } : t
        ));
        
        await api.updateTicketStatus(selectedTicketId, newStatus);
    };

    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    // Filtering Logic
    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              t.subject.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTab = true;
        if (activeTab === 'open') matchesTab = t.status === 'OPEN' || t.status === 'IN_PROGRESS';
        if (activeTab === 'waiting') matchesTab = t.status === 'WAITING';
        if (activeTab === 'closed') matchesTab = t.status === 'CLOSED';

        return matchesSearch && matchesTab;
    });

    const getStatusColor = (status: TicketStatus) => {
        switch(status) {
            case 'OPEN': return 'bg-green-500';
            case 'IN_PROGRESS': return 'bg-blue-500';
            case 'WAITING': return 'bg-yellow-500';
            case 'CLOSED': return 'bg-slate-500';
            default: return 'bg-slate-300';
        }
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            LOW: 'bg-slate-100 text-slate-600',
            MEDIUM: 'bg-blue-100 text-blue-600',
            HIGH: 'bg-red-100 text-red-600'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[priority as keyof typeof colors]}`}>
                {priority === 'LOW' ? 'Baixa' : priority === 'MEDIUM' ? 'Média' : 'Alta'}
            </span>
        );
    };

    // Render Status Stepper
    const renderStatusStepper = (status: TicketStatus) => {
        const steps = [
            { id: 'OPEN', label: 'Aberto', icon: Inbox },
            { id: 'IN_PROGRESS', label: 'Em Andamento', icon: PlayCircle },
            { id: 'CLOSED', label: 'Resolvido', icon: CheckSquare },
        ];
        
        let currentIdx = steps.findIndex(s => s.id === status);
        if (currentIdx === -1 && status === 'WAITING') currentIdx = 1; // Map waiting to progress visual

        return (
            <div className="w-full flex items-center justify-between px-8 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                {steps.map((step, idx) => {
                    const isActive = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                <step.icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] font-bold mt-1 uppercase ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>{step.label}</span>
                        </div>
                    );
                })}
                {/* Connector Line */}
                <div className="absolute left-0 right-0 top-[28px] h-0.5 bg-slate-200 dark:bg-slate-700 z-0 mx-12">
                     <div 
                       className="h-full bg-blue-600 transition-all duration-500" 
                       style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                     ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            
            {/* LEFT SIDEBAR - NAVIGATION */}
            <div className="w-full md:w-20 bg-slate-900 flex flex-row md:flex-col items-center py-4 gap-4 flex-shrink-0">
                <button 
                    onClick={() => setActiveTab('open')}
                    className={`p-3 rounded-xl transition-all relative group ${activeTab === 'open' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10'}`}
                >
                    <Inbox className="w-6 h-6" />
                    <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none hidden md:block">Em Aberto</span>
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
                </button>
                <button 
                    onClick={() => setActiveTab('waiting')}
                    className={`p-3 rounded-xl transition-all relative group ${activeTab === 'waiting' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10'}`}
                >
                    <Clock className="w-6 h-6" />
                    <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none hidden md:block">Aguardando</span>
                </button>
                <button 
                    onClick={() => setActiveTab('closed')}
                    className={`p-3 rounded-xl transition-all relative group ${activeTab === 'closed' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10'}`}
                >
                    <CheckCircle className="w-6 h-6" />
                    <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none hidden md:block">Resolvidos</span>
                </button>
                <div className="flex-1"></div>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white mb-2" title="Você está Online">
                    ON
                </div>
            </div>

            {/* MIDDLE COLUMN - TICKET LIST */}
            <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                        {activeTab === 'open' ? 'Fila de Atendimento' : activeTab === 'waiting' ? 'Aguardando Resposta' : 'Histórico'}
                    </h2>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar ticket ou morador..." 
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredTickets.map(ticket => (
                        <div 
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors relative ${selectedTicketId === ticket.id ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[140px]">{ticket.userName}</span>
                                <span className="text-[10px] text-slate-500">{new Date(ticket.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{ticket.subject}</p>
                            
                            <div className="flex items-center gap-2">
                                {getPriorityBadge(ticket.priority)}
                                <span className="flex items-center text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {ticket.id}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filteredTickets.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            <Archive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Nenhum ticket encontrado.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN - CHAT AREA */}
            <div className={`flex-1 flex flex-col ${!selectedTicket ? 'hidden md:flex' : 'flex'} bg-slate-100 dark:bg-slate-900 relative`}>
                {!selectedTicket ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Selecione um ticket para iniciar o atendimento</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center shadow-sm">
                            <div className="flex items-center">
                                <button onClick={() => setSelectedTicketId(null)} className="md:hidden mr-3 text-slate-500">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <img src={selectedTicket.userAvatar} className="w-10 h-10 rounded-full mr-3 border border-slate-200 dark:border-slate-600" alt="" />
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        {selectedTicket.userName}
                                        <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selectedTicket.status)}`}></span>
                                    </h3>
                                    <div className="flex items-center text-xs text-slate-500 gap-2">
                                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {selectedTicket.unitInfo}</span>
                                        <span>•</span>
                                        <span className="flex items-center"><Building2 className="w-3 h-3 mr-1" /> {selectedTicket.condoName}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {selectedTicket.status !== 'CLOSED' ? (
                                    <button 
                                        onClick={() => handleStatusChange('CLOSED')}
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center"
                                    >
                                        <CheckCircle className="w-3 h-3 mr-1.5" />
                                        Finalizar
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleStatusChange('IN_PROGRESS')}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center"
                                    >
                                        <Archive className="w-3 h-3 mr-1.5" />
                                        Reabrir
                                    </button>
                                )}
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Visual Status Stepper */}
                        {renderStatusStepper(selectedTicket.status)}

                        {/* Tags Strip */}
                        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex gap-2 items-center overflow-x-auto">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {selectedTicket.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded-full uppercase font-semibold">
                                    #{tag}
                                </span>
                            ))}
                            <button className="text-[10px] text-blue-600 hover:underline">+ Adicionar</button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {selectedTicket.messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                                        msg.sender === 'agent' 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                    }`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <span className={`text-[10px] block mt-1 text-right opacity-70 ${msg.sender === 'agent' ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        {selectedTicket.status !== 'CLOSED' ? (
                            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex gap-2">
                                    <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input 
                                        type="text" 
                                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                                        placeholder="Digite uma resposta..."
                                        value={messageInput}
                                        onChange={e => setMessageInput(e.target.value)}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!messageInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                             <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500">
                                Este atendimento foi finalizado. Reabra para enviar mensagens.
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Context Sidebar (Right) - Desktop Only */}
            {selectedTicket && (
                <div className="hidden xl:block w-72 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-6 flex-shrink-0">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Informações do Contato</h4>
                    <div className="text-center mb-6">
                        <img src={selectedTicket.userAvatar} className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-slate-50 dark:border-slate-700" alt="" />
                        <h3 className="font-bold text-slate-800 dark:text-white">{selectedTicket.userName}</h3>
                        <p className="text-sm text-slate-500">Morador • {selectedTicket.unitInfo}</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <Building2 className="w-4 h-4 mr-3 text-slate-400" />
                            <span className="truncate">{selectedTicket.condoName}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <UserCheck className="w-4 h-4 mr-3 text-slate-400" />
                            <span>Adimplente</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <PhoneCall className="w-4 h-4 mr-3 text-slate-400" />
                            <span>(11) 99999-8888</span>
                        </div>
                    </div>

                    <hr className="my-6 border-slate-100 dark:border-slate-700" />

                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ações Rápidas</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="px-3 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">
                            Ver Boletos
                        </button>
                        <button className="px-3 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">
                            Reservas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportModule;