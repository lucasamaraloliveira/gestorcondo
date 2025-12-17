import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Filter, KeyRound, QrCode, Clock, CheckCircle2, XCircle, MoreVertical, Calendar, Building2, Trash2, Edit2, X } from 'lucide-react';
import { Visitor, AccessLog, Condominium, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';

interface AccessControlViewProps {
    currentUserRole: string; // Keep as string or update to UserRole enum if possible
    currentUser?: any; // To access managedCondoIds if needed, though role is passed separately. Ideally should be full user object.
    currentCondo: Condominium | undefined;
    allCondos?: Condominium[];
    addToast: (message: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => void;
}

import { api } from '../services/api';

// ... (existing imports)

export const AccessControlView: React.FC<AccessControlViewProps> = ({ currentUserRole, currentUser, currentCondo, allCondos = [], addToast }) => {
    const [activeTab, setActiveTab] = useState<'scheduled' | 'active' | 'history'>('scheduled');
    const [showNewVisitorModal, setShowNewVisitorModal] = useState(false);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(false);

    // ... (selector logic remains same)

    // Determines accessible condos for selector
    const accessibleCondos = useMemo(() => {
        if (currentUserRole === UserRole.SUPER_ADMIN) return allCondos;
        if (currentUserRole === UserRole.SYNDIC && currentUser?.managedCondoIds) {
            return allCondos.filter(c => currentUser.managedCondoIds?.includes(c.id));
        }
        return currentCondo ? [currentCondo] : [];
    }, [currentUserRole, currentUser, allCondos, currentCondo]);

    const [selectedCondoId, setSelectedCondoId] = useState<string>(currentCondo?.id || '');
    const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId) || currentCondo;

    useEffect(() => {
        if (!selectedCondoId && accessibleCondos.length > 0) {
            setSelectedCondoId(accessibleCondos[0].id);
        } else if (currentCondo && !selectedCondoId) {
            setSelectedCondoId(currentCondo.id);
        }
    }, [accessibleCondos, currentCondo, selectedCondoId]);

    // Load Data from API
    useEffect(() => {
        if (activeCondo?.id) {
            loadVisitors(activeCondo.id);
        }
    }, [activeCondo?.id]);

    const loadVisitors = async (condoId: string) => {
        setLoading(true);
        try {
            const data = await api.getVisitors(condoId);
            setVisitors(data);
        } catch (error) {
            console.error(error);
            addToast("Erro ao carregar lista de acesso.", "error");
        } finally {
            setLoading(false);
        }
    };


    // Editing State
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
        setShowNewVisitorModal(false); // Close immediately for better UX with optimistic update or just loading

        try {
            if (editingVisitor) {
                // Update
                const updated = await api.updateVisitor(editingVisitor.id, {
                    name: formName,
                    cpf: formCpf,
                    type: formType,
                    entryDate: formDate || editingVisitor.entryDate
                });
                setVisitors(prev => prev.map(v => v.id === updated.id ? updated : v));
                addToast('Autorização atualizada com sucesso!', 'success');
            } else {
                // Create
                if (!activeCondo) return;
                const newVisitor = await api.createVisitor({
                    condominiumId: activeCondo.id,
                    name: formName,
                    cpf: formCpf,
                    type: formType,
                    hostUnit: 'Minha Unidade', // In real app, derived from current user
                    entryDate: formDate || new Date().toISOString(),
                    status: 'SCHEDULED',
                    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VISIT-${Date.now()}`
                });
                setVisitors(prev => [newVisitor, ...prev]);
                addToast('Autorização criada! QR Code gerado.', 'success');
            }
        } catch (error) {
            console.error(error);
            addToast("Erro ao salvar.", "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteVisitorId) return;
        const id = deleteVisitorId;
        setDeleteVisitorId(null);

        const visitorToDelete = visitors.find(v => v.id === id);
        if (!visitorToDelete) return;

        // Optimistic Remove
        setVisitors(prev => prev.filter(v => v.id !== id));

        try {
            await api.deleteVisitor(id);
            // Toast with Undo? (Undo implementation would need API restore method, simplified here)
            addToast(`Autorização removida.`, 'info');
        } catch (error) {
            setVisitors(prev => [...prev, visitorToDelete]); // Rollback
            addToast("Erro ao excluir.", "error");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'INSIDE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'EXITED': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'Agendado';
            case 'INSIDE': return 'No Local';
            case 'EXITED': return 'Saiu';
            default: return status;
        }
    };

    if (!activeCondo && accessibleCondos.length === 0) {
        return <div className="p-8 text-center text-slate-500">Selecione um condomínio para visualizar o controle de acesso.</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
                        <KeyRound className="w-8 h-8 mr-2 text-blue-600" />
                        Portaria & Acesso
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Gerencie autorizações de entrada e visualize o histórico</p>

                    {/* Condo Selector Logic - Standardized */}
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
                    ) : activeCondo ? (
                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center mt-1">
                            <Building2 className="w-4 h-4 mr-1.5" />
                            {activeCondo.name}
                        </p>
                    ) : null}
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Nova Autorização
                </button>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'scheduled' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Agendados
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    No Local
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Histórico
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCondo && visitors
                    .filter(v => v.condominiumId === activeCondo.id) // Filter by Active Condo
                    .filter(v => {
                        if (activeTab === 'scheduled') return v.status === 'SCHEDULED';
                        if (activeTab === 'active') return v.status === 'INSIDE';
                        return v.status === 'EXITED';
                    })
                    .map(visitor => (
                        <div key={visitor.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(visitor.status)}`}>
                                    {getStatusLabel(visitor.status)}
                                </div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(visitor)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteVisitorId(visitor.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                {visitor.qrCodeUrl ? (
                                    <img src={visitor.qrCodeUrl} alt="QR Code" className="w-16 h-16 rounded-lg border border-slate-100 p-1 bg-white" />
                                ) : (
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <QrCode className="w-8 h-8 text-slate-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{visitor.name}</h3>
                                    <p className="text-xs text-slate-500">CPF: {visitor.cpf}</p>
                                    <p className="text-xs text-blue-600 font-medium mt-1">{visitor.type === 'VISITOR' ? 'Visita Social' : visitor.type === 'DELIVERY' ? 'Entregador' : 'Serviço'}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>{new Date(visitor.entryDate).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    <span>Destino: {visitor.hostUnit}</span>
                                </div>
                            </div>

                            {visitor.status === 'SCHEDULED' && (
                                <button className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                    <QrCode className="w-4 h-4" />
                                    Compartilhar QR Code
                                </button>
                            )}
                        </div>
                    ))}
            </div>

            {/* Modal using Portal */}
            {showNewVisitorModal && createPortal(
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75"
                            onClick={() => setShowNewVisitorModal(false)}
                        ></div>

                        {/* Modal Panel */}
                        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {editingVisitor ? 'Editar Autorização' : 'Nova Autorização'}
                                </h2>
                                <button onClick={() => setShowNewVisitorModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveVisitor} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF / Documento</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                        value={formCpf}
                                        onChange={e => setFormCpf(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                        <select
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                            value={formType}
                                            onChange={e => setFormType(e.target.value as any)}
                                        >
                                            <option value="VISITOR">Visita</option>
                                            <option value="DELIVERY">Delivery</option>
                                            <option value="SERVICE">Serviço</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data/Hora</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                            value={formDate}
                                            onChange={e => setFormDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-6 shadow-lg shadow-blue-600/20"
                                >
                                    {editingVisitor ? 'Salvar Alterações' : 'Gerar Acesso'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!deleteVisitorId}
                onClose={() => setDeleteVisitorId(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Autorização"
                description="Tem certeza que deseja remover esta autorização de visita?"
                confirmText="Excluir"
                isDestructive={true}
            />
        </div>
    );
};
