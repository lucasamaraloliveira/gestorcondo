import React, { useState, useEffect } from 'react';
import {
    MessageSquare, CheckCircle, Clock, Search, Send, MapPin, Tag, Archive,
    Inbox, UserCheck, PhoneCall, Paperclip, ChevronLeft,
    Building2, PlayCircle, CheckSquare, MoreHorizontal
} from 'lucide-react';
import { SupportTicket, TicketStatus } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const SupportModule: React.FC = () => {
    const { currentUser } = useAuthStore();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [activeTab, setActiveTab] = useState<'open' | 'waiting' | 'closed'>('open');

    useEffect(() => {
        loadTickets();
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

        const newMessage = {
            id: Date.now().toString(),
            sender: 'agent' as const,
            text: messageInput,
            timestamp: new Date().toISOString()
        };

        setTickets(prev => prev.map(t =>
            t.id === selectedTicketId ? { ...t, messages: [...t.messages, newMessage] } : t
        ));

        const textToSend = messageInput;
        setMessageInput('');
        await api.sendTicketMessage(selectedTicketId, textToSend, 'agent');
    };

    const handleStatusChange = async (newStatus: TicketStatus) => {
        if (!selectedTicketId) return;
        setTickets(prev => prev.map(t => t.id === selectedTicketId ? { ...t, status: newStatus } : t));
        await api.updateTicketStatus(selectedTicketId, newStatus);
    };

    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

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
        switch (status) {
            case 'OPEN': return 'bg-green-500';
            case 'IN_PROGRESS': return 'bg-blue-500';
            case 'WAITING': return 'bg-yellow-500';
            case 'CLOSED': return 'bg-slate-500';
            default: return 'bg-slate-300';
        }
    };

    const getPriorityBadge = (priority: string) => {
        const colors = { LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-blue-100 text-blue-600', HIGH: 'bg-red-100 text-red-600' };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[priority as keyof typeof colors]}`}>{priority}</span>;
    };

    if (!currentUser) return null;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="w-full md:w-20 bg-slate-900 flex flex-row md:flex-col items-center py-4 gap-4 flex-shrink-0">
                <button onClick={() => setActiveTab('open')} className={`p-3 rounded-xl ${activeTab === 'open' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}><Inbox /></button>
                <button onClick={() => setActiveTab('waiting')} className={`p-3 rounded-xl ${activeTab === 'waiting' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}><Clock /></button>
                <button onClick={() => setActiveTab('closed')} className={`p-3 rounded-xl ${activeTab === 'closed' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}><CheckCircle /></button>
            </div>

            <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r bg-slate-50 dark:bg-slate-900/50`}>
                <div className="p-4 border-b">
                    <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredTickets.map(ticket => (
                        <div key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className={`p-4 border-b cursor-pointer ${selectedTicketId === ticket.id ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm truncate">{ticket.userName}</span>
                                <span className="text-[10px] text-slate-500">{new Date(ticket.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{ticket.subject}</p>
                            {getPriorityBadge(ticket.priority)}
                        </div>
                    ))}
                </div>
            </div>

            <div className={`flex-1 flex flex-col ${!selectedTicket ? 'hidden md:flex' : 'flex'} bg-slate-100 dark:bg-slate-900`}>
                {!selectedTicket ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><MessageSquare className="w-16 h-16 mb-4 opacity-20" /><p>Selecione um ticket</p></div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-slate-800 border-b p-4 flex justify-between items-center">
                            <div className="flex items-center">
                                <button onClick={() => setSelectedTicketId(null)} className="md:hidden mr-3"><ChevronLeft /></button>
                                <div><h3 className="font-bold flex items-center gap-2">{selectedTicket.userName}<span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selectedTicket.status)}`}></span></h3><p className="text-xs text-slate-500">{selectedTicket.unitInfo} • {selectedTicket.condoName}</p></div>
                            </div>
                            <button onClick={() => handleStatusChange(selectedTicket.status === 'CLOSED' ? 'IN_PROGRESS' : 'CLOSED')} className="px-3 py-1.5 rounded-lg text-xs font-bold border">{selectedTicket.status === 'CLOSED' ? 'Reabrir' : 'Finalizar'}</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedTicket.messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender === 'agent' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border'}`}><p className="text-sm">{msg.text}</p></div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t flex gap-2">
                            <input type="text" className="flex-1 border rounded-xl px-4 py-2 text-sm" placeholder="Resposta..." value={messageInput} onChange={e => setMessageInput(e.target.value)} />
                            <button type="submit" disabled={!messageInput.trim()} className="bg-blue-600 text-white p-2 rounded-xl"><Send className="w-5 h-5" /></button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default SupportModule;