import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, QrCode, Clock, Building2, Trash2, Edit2, X, KeyRound } from 'lucide-react';
import { Visitor, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import Skeleton from './ui/Skeleton';

export const AccessControlView: React.FC = () => {
    const { currentUser } = useAuthStore();
    const { addToast } = useUIStore();
    const { condos: allCondos } = useDataStore();

    if (!currentUser) return null;

    const [activeTab, setActiveTab] = useState<'scheduled' | 'active' | 'history'>('scheduled');
    const [showNewVisitorModal, setShowNewVisitorModal] = useState(false);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, isLoading: false });

    const accessibleCondos = useMemo(() => {
        if (currentUser.role === UserRole.SUPER_ADMIN) return allCondos;
        if (currentUser.role === UserRole.SYNDIC) {
            const managedIds = currentUser.managedCondoIds || [];
            return allCondos.filter(c => managedIds.includes(c.id) || c.id === currentUser.condominiumId);
        }
        return allCondos.filter(c => c.id === currentUser.condominiumId);
    }, [currentUser, allCondos]);

    const [selectedCondoId, setSelectedCondoId] = useState<string>(currentUser.condominiumId || accessibleCondos[0]?.id || '');
    const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId);

    useEffect(() => {
        if (selectedCondoId) {
            setVisitors([]);
            loadVisitors(selectedCondoId, 1);
        }
    }, [selectedCondoId]);

    const loadVisitors = async (condoId: string, page: number) => {
        setPagination(prev => ({ ...prev, isLoading: true }));
        try {
            const res = await api.getVisitors(condoId, page, 6);
            setVisitors(prev => page === 1 ? res.data : [...prev, ...res.data]);
            setPagination({
                page: res.page,
                totalPages: res.totalPages,
                isLoading: false
            });
        } catch (error) {
            addToast("Erro ao carregar lista.", "error");
            setPagination(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleLoadMore = () => {
        if (selectedCondoId && pagination.page < pagination.totalPages) {
            loadVisitors(selectedCondoId, pagination.page + 1);
        }
    };

    const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
    const [deleteVisitorId, setDeleteVisitorId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formCpf, setFormCpf] = useState('');
    const [formType, setFormType] = useState<'VISITOR' | 'DELIVERY' | 'SERVICE'>('VISITOR');
    const [formDate, setFormDate] = useState('');

    const openModal = (visitor?: Visitor) => {
        if (visitor) {
            setEditingVisitor(visitor);
            setFormName(visitor.name);
            setFormCpf(visitor.cpf);
            setFormType(visitor.type);
            setFormDate(visitor.entryDate);
        } else {
            setEditingVisitor(null);
            setFormName('');
            setFormCpf('');
            setFormType('VISITOR');
            setFormDate('');
        }
        setShowNewVisitorModal(true);
    };

    const handleSaveVisitor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingVisitor) {
                const updated = await api.updateVisitor(editingVisitor.id, {
                    name: formName, cpf: formCpf, type: formType, entryDate: formDate || editingVisitor.entryDate
                });
                setVisitors(prev => prev.map(v => v.id === updated.id ? updated : v));
                addToast('Atualizado!', 'success');
            } else {
                if (!activeCondo) return;
                const newVisitor = await api.createVisitor({
                    condominiumId: activeCondo.id,
                    name: formName,
                    cpf: formCpf,
                    type: formType,
                    hostUnit: 'Minha Unidade',
                    entryDate: formDate || new Date().toISOString(),
                    status: 'SCHEDULED',
                    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VISIT-${Date.now()}`
                });
                setVisitors(prev => [newVisitor, ...prev]);
                addToast('Criado!', 'success');
            }
            setShowNewVisitorModal(false);
        } catch (error) {
            addToast("Erro ao salvar.", "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteVisitorId) return;
        try {
            await api.deleteVisitor(deleteVisitorId);
            setVisitors(prev => prev.filter(v => v.id !== deleteVisitorId));
            addToast(`Removido.`, 'info');
        } catch (error) {
            addToast("Erro ao excluir.", "error");
        } finally {
            setDeleteVisitorId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
            case 'INSIDE': return 'bg-green-100 text-green-700';
            case 'EXITED': return 'bg-slate-100 text-slate-700';
            default: return 'bg-gray-100';
        }
    };

    if (!activeCondo) return <div className="p-8 text-center text-slate-500">Selecione um condomínio.</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center mb-1"><KeyRound className="w-8 h-8 mr-2 text-blue-600" /> Portaria</h1>
                    {accessibleCondos.length > 1 ? (
                        <select value={selectedCondoId} onChange={e => setSelectedCondoId(e.target.value)} className="bg-slate-50 border p-2 rounded-lg text-sm mt-2">
                            {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    ) : <p className="text-slate-500 text-sm mt-1">{activeCondo.name}</p>}
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus className="w-5 h-5" />Novo</button>
            </header>

            <div className="flex border-b">
                {['scheduled', 'active', 'history'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 text-sm font-medium border-b-2 capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>{tab}</button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagination.isLoading && visitors.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5 border">
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="h-5 w-16" />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-3/4 mb-1" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                            <div className="space-y-2 border-t pt-3 mt-3">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        </div>
                    ))
                ) : visitors.filter(v => {
                    if (activeTab === 'scheduled') return v.status === 'SCHEDULED';
                    if (activeTab === 'active') return v.status === 'INSIDE';
                    return v.status === 'EXITED';
                }).map(visitor => (
                    <div key={visitor.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border group relative">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(visitor.status)}`}>{visitor.status}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(visitor)} className="p-1 border rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeleteVisitorId(visitor.id)} className="p-1 border rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            {visitor.qrCodeUrl ? <img src={visitor.qrCodeUrl} className="w-16 h-16 border rounded-lg" alt="QR" /> : <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center"><QrCode className="text-slate-400" /></div>}
                            <div><h3 className="font-bold text-sm truncate">{visitor.name}</h3><p className="text-[10px] text-slate-500">{visitor.cpf}</p></div>
                        </div>
                        <div className="space-y-1 text-xs border-t pt-3 mt-3">
                            <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> {new Date(visitor.entryDate).toLocaleString()}</p>
                            <p className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {visitor.hostUnit}</p>
                        </div>
                    </div>
                ))}
            </div>

            {pagination.page < pagination.totalPages && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={handleLoadMore}
                        disabled={pagination.isLoading}
                        className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                    >
                        {pagination.isLoading ? 'Carregando...' : 'Carregar mais registros'}
                    </button>
                </div>
            )}

            {showNewVisitorModal && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/75" onClick={() => setShowNewVisitorModal(false)}></div>
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl relative z-[61]">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{editingVisitor ? 'Editar' : 'Novo'}</h2><button onClick={() => setShowNewVisitorModal(false)}><X /></button></div>
                        <form onSubmit={handleSaveVisitor} className="space-y-4">
                            <div><label className="text-sm font-medium mb-1 block">Nome</label><input type="text" required className="w-full p-2 border rounded-xl" value={formName} onChange={e => setFormName(e.target.value)} /></div>
                            <div><label className="text-sm font-medium mb-1 block">CPF</label><input type="text" required className="w-full p-2 border rounded-xl" value={formCpf} onChange={e => setFormCpf(e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium mb-1 block">Tipo</label><select className="w-full p-2 border rounded-xl" value={formType} onChange={e => setFormType(e.target.value as any)}><option value="VISITOR">Visita</option><option value="DELIVERY">Delivery</option><option value="SERVICE">Serviço</option></select></div>
                                <div><label className="text-sm font-medium mb-1 block">Data/Hora</label><input type="datetime-local" className="w-full p-2 border rounded-xl" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">{editingVisitor ? 'Salvar' : 'Gerar'}</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmModal isOpen={!!deleteVisitorId} onClose={() => setDeleteVisitorId(null)} onConfirm={handleConfirmDelete} title="Excluir" description="Remover autorização?" />
        </div>
    );
};
