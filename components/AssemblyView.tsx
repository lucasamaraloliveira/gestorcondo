import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Gavel, Plus, X, CheckCircle2, AlertCircle, Clock, Users, Trash2, BarChart3, Calendar, Edit2 } from 'lucide-react';
import { Poll, PollOption, Vote, User, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';

interface AssemblyViewProps {
    currentUser: User;
    addToast: (message: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => void;
}

export const AssemblyView: React.FC<AssemblyViewProps> = ({ currentUser, addToast }) => {
    const currentUserRole = currentUser.role;
    const currentUserId = currentUser.id;
    const isOverdue = currentUser.financialStatus === 'OVERDUE';
    const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    const [deletePollId, setDeletePollId] = useState<string | null>(null);

    // Editing State
    const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

    // Mock Data
    const [polls, setPolls] = useState<Poll[]>([
        {
            id: '1',
            condominiumId: '1',
            title: 'Aprovação da Reforma da Fachada',
            description: 'Votação para aprovar o orçamento da pintura e reparos da fachada do Bloco A.',
            options: [
                { id: 'opt1', text: 'Aprovar Orçamento A (R$ 50.000)', votes: 15 },
                { id: 'opt2', text: 'Aprovar Orçamento B (R$ 45.000)', votes: 8 },
                { id: 'opt3', text: 'Rejeitar Ambos', votes: 2 }
            ],
            startDate: '2023-12-15T00:00:00',
            endDate: '2023-12-25T23:59:59',
            status: 'OPEN',
            createdBy: 'admin',
            anonymous: false
        },
        {
            id: '2',
            condominiumId: '1',
            title: 'Eleição de Novo Síndico',
            description: 'Escolha do síndico para o mandato 2024-2025.',
            options: [
                { id: 'cand1', text: 'Carlos Oliveira (Ap 101)', votes: 42 },
                { id: 'cand2', text: 'Mariana Santos (Ap 304)', votes: 38 }
            ],
            startDate: '2023-11-01T00:00:00',
            endDate: '2023-11-10T23:59:59',
            status: 'CLOSED',
            createdBy: 'admin',
            anonymous: true
        }
    ]);

    // Mock Votes tracking (simplistic for UI demo)
    const [userVotes, setUserVotes] = useState<Record<string, string>>({}); // pollId -> optionId

    // Form State
    const [newPollTitle, setNewPollTitle] = useState('');
    const [newPollDesc, setNewPollDesc] = useState('');
    const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
    const [newPollEndDate, setNewPollEndDate] = useState('');

    const openCreateModal = () => {
        setEditingPoll(null);
        resetForm();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (poll: Poll) => {
        setEditingPoll(poll);
        setNewPollTitle(poll.title);
        setNewPollDesc(poll.description);
        setNewPollOptions(poll.options.map(o => o.text));
        setNewPollEndDate(poll.endDate.slice(0, 16)); // Format for datetime-local
        setIsCreateModalOpen(true);
    };

    const handleSavePoll = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert plain strings to PollOption objects
        // If editing, try to preserve IDs of existing options if text matches or position matches to avoid losing votes (simplified logic here)
        // For this demo, we might reset votes if options change heavily, but let's try to map by index if simple update.

        let updatedOptions: PollOption[] = [];

        if (editingPoll) {
            // Reuse existing options if possible
            updatedOptions = newPollOptions
                .filter(opt => opt.trim() !== '')
                .map((text, idx) => {
                    const existingOpt = editingPoll.options[idx];
                    if (existingOpt) {
                        return { ...existingOpt, text }; // Update text, keep votes
                    }
                    return { id: `opt-${Date.now()}-${idx}`, text, votes: 0 }; // New option
                });
        } else {
            updatedOptions = newPollOptions
                .filter(opt => opt.trim() !== '')
                .map((text, idx) => ({
                    id: `opt-${Date.now()}-${idx}`,
                    text,
                    votes: 0
                }));
        }

        if (editingPoll) {
            // Update
            const updatedPoll: Poll = {
                ...editingPoll,
                title: newPollTitle,
                description: newPollDesc,
                options: updatedOptions,
                endDate: newPollEndDate || editingPoll.endDate
            };
            setPolls(prev => prev.map(p => p.id === updatedPoll.id ? updatedPoll : p));
            addToast('Assembleia atualizada com sucesso!', 'success');
        } else {
            // Create
            const newPoll: Poll = {
                id: Date.now().toString(),
                condominiumId: '1',
                title: newPollTitle,
                description: newPollDesc,
                options: updatedOptions,
                startDate: new Date().toISOString(),
                endDate: newPollEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'OPEN',
                createdBy: currentUserId,
                anonymous: false
            };
            setPolls([newPoll, ...polls]);
            addToast('Assembleia criada com sucesso!', 'success');
        }

        setIsCreateModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewPollTitle('');
        setNewPollDesc('');
        setNewPollOptions(['', '']);
        setNewPollEndDate('');
    };

    const handleDeletePoll = () => {
        if (!deletePollId) return;
        const pollToDelete = polls.find(p => p.id === deletePollId);

        setPolls(prev => prev.filter(p => p.id !== deletePollId));
        setDeletePollId(null);

        if (pollToDelete) {
            addToast('Votação excluída.', 'info', () => {
                setPolls(prev => [pollToDelete, ...prev]);
            });
        }
    };

    const handleVote = (pollId: string, optionId: string) => {
        // Update local UI state for votes
        setPolls(prev => prev.map(poll => {
            if (poll.id !== pollId) return poll;
            return {
                ...poll,
                options: poll.options.map(opt => ({
                    ...opt,
                    votes: opt.id === optionId ? opt.votes + 1 : opt.votes
                }))
            };
        }));

        setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
        addToast('Voto registrado com sucesso!', 'success');
        setIsVoteModalOpen(false);
    };

    const calculatePercentage = (poll: Poll, optionVotes: number) => {
        const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
        if (totalVotes === 0) return 0;
        return Math.round((optionVotes / totalVotes) * 100);
    };

    const getTotalVotes = (poll: Poll) => {
        return poll.options.reduce((acc, curr) => acc + curr.votes, 0);
    };

    const openVoteModal = (poll: Poll) => {
        setSelectedPoll(poll);
        setIsVoteModalOpen(true);
    };

    const isManager = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SYNDIC';

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Gavel className="w-8 h-8 text-indigo-600" />
                        Assembleia Virtual
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Vote e participe das decisões do condomínio.</p>
                </div>
                {isManager && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Pauta
                    </button>
                )}
            </header>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('open')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'open' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Em Aberto / Votação
                </button>
                <button
                    onClick={() => setActiveTab('closed')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'closed' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Encerradas / Resultados
                </button>
            </div>

            {/* Polls List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {polls
                    .filter(p => activeTab === 'open' ? p.status === 'OPEN' : p.status === 'CLOSED')
                    .map(poll => (
                        <div key={poll.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow relative group">

                            {isManager && (
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(poll)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Editar Pauta"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeletePollId(poll.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Excluir Pauta"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-start pr-8">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{poll.title}</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">{poll.description}</p>

                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>Fim: {new Date(poll.endDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    <span>{getTotalVotes(poll)} votos</span>
                                </div>
                            </div>

                            {/* Rendering logic based on status and user vote */}
                            {poll.status === 'OPEN' && !userVotes[poll.id] ? (
                                <button
                                    onClick={() => {
                                        if (isOverdue) {
                                            addToast('Votação não permitida devido a pendências financeiras.', 'error');
                                            return;
                                        }
                                        openVoteModal(poll);
                                    }}
                                    disabled={isOverdue}
                                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
                                    ${isOverdue
                                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'}`}
                                    title={isOverdue ? "Bloqueado: Pendência Financeira" : "Votar"}
                                >
                                    {isOverdue ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                    {isOverdue ? 'Votação Indisponível (Financeiro)' : 'Participar da Votação'}
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        Resultados Parciais
                                    </h4>
                                    {poll.options.map(option => (
                                        <div key={option.id} className="relative group/opt">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-slate-700 dark:text-slate-200">{option.text}</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{calculatePercentage(poll, option.votes)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000"
                                                    style={{ width: `${calculatePercentage(poll, option.votes)}%` }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 text-right opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                                {option.votes} votos
                                            </div>
                                        </div>
                                    ))}
                                    {userVotes[poll.id] && (
                                        <p className="text-center text-xs text-green-600 dark:text-green-400 font-medium mt-3 bg-green-50 dark:bg-green-900/20 py-2 rounded-lg border border-green-100 dark:border-green-900/30">
                                            Seu voto foi registrado!
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
            </div>

            {/* Empty State */}
            {polls.filter(p => activeTab === 'open' ? p.status === 'OPEN' : p.status === 'CLOSED').length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Gavel className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma pauta encontrada</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Não há vottacões nesta categoria no momento.</p>
                </div>
            )}

            {/* Create/Edit Poll Modal */}
            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />

                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {editingPoll ? 'Editar Votação' : 'Nova Votação'}
                                </h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSavePoll} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título da Pauta</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: Reforma da Academia"
                                        value={newPollTitle}
                                        onChange={e => setNewPollTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição Detalhada</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Descreva o propósito da votação..."
                                        value={newPollDesc}
                                        onChange={e => setNewPollDesc(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Opções de Voto</label>
                                    <div className="space-y-2">
                                        {newPollOptions.map((opt, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                required
                                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                placeholder={`Opção ${idx + 1}`}
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...newPollOptions];
                                                    newOpts[idx] = e.target.value;
                                                    setNewPollOptions(newOpts);
                                                }}
                                            />
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setNewPollOptions([...newPollOptions, ''])}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                                        >
                                            <Plus className="w-3 h-3" /> Adicionar Opção
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Encerramento</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newPollEndDate}
                                        onChange={e => setNewPollEndDate(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20"
                                    >
                                        {editingPoll ? 'Salvar Alterações' : 'Criar Votação'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Vote Modal */}
            {isVoteModalOpen && selectedPoll && createPortal(
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsVoteModalOpen(false)} />

                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full uppercase mb-2 inline-block">Confirmar Voto</span>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{selectedPoll.title}</h3>
                                </div>
                                <button onClick={() => setIsVoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Selecione uma das opções abaixo para registrar seu voto. Esta ação não poderá ser desfeita.</p>

                            <div className="space-y-3">
                                {selectedPoll.options.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleVote(selectedPoll.id, option.id)}
                                        className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{option.text}</span>
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-600 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmModal
                isOpen={!!deletePollId}
                onClose={() => setDeletePollId(null)}
                onConfirm={handleDeletePoll}
                title="Excluir Votação"
                description="Tem certeza que deseja remover esta pauta? Todos os votos registrados serão perdidos."
                confirmText="Excluir Pauta"
                isDestructive={true}
            />
        </div>
    );
};
