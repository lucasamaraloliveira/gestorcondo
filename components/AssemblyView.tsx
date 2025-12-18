import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Gavel, Plus, X, CheckCircle2, AlertCircle, Clock, Users, Trash2, BarChart3, Calendar, Edit2, Lock, ArrowRight, DollarSign } from 'lucide-react';
import { Poll, PollOption, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';

export const AssemblyView: React.FC = () => {
    const { currentUser } = useAuthStore();
    const { addToast } = useUIStore();
    const { bills, payBill } = useDataStore();

    if (!currentUser) return null;

    const isOverdue = currentUser.financialStatus === 'OVERDUE';
    const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [deletePollId, setDeletePollId] = useState<string | null>(null);
    const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
    const [isPaying, setIsPaying] = useState<string | null>(null);

    // Mock Data (In a real app, this would come from a store or API)
    const [polls, setPolls] = useState<Poll[]>([
        {
            id: '1', condominiumId: '1', title: 'Reforma da Fachada', description: 'Votação para aprovar o orçamento da pintura.',
            options: [{ id: 'opt1', text: 'Aprovar Orçamento A', votes: 15 }, { id: 'opt2', text: 'Aprovar Orçamento B', votes: 8 }],
            startDate: '2023-12-15T00:00:00', endDate: '2023-12-25T23:59:59', status: 'OPEN', createdBy: 'admin', anonymous: false
        }
    ]);

    const [userVotes, setUserVotes] = useState<Record<string, string>>({});

    const [newPollTitle, setNewPollTitle] = useState('');
    const [newPollDesc, setNewPollDesc] = useState('');
    const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
    const [newPollEndDate, setNewPollEndDate] = useState('');

    const openCreateModal = () => {
        setEditingPoll(null);
        setNewPollTitle('');
        setNewPollDesc('');
        setNewPollOptions(['', '']);
        setNewPollEndDate('');
        setIsCreateModalOpen(true);
    };

    const handleSavePoll = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedOptions = newPollOptions.filter(opt => opt.trim() !== '').map((text, idx) => ({ id: `opt-${Date.now()}-${idx}`, text, votes: 0 }));

        if (editingPoll) {
            setPolls(prev => prev.map(p => p.id === editingPoll.id ? { ...p, title: newPollTitle, description: newPollDesc, options: updatedOptions, endDate: newPollEndDate || p.endDate } : p));
            addToast('Atualizada!', 'success');
        } else {
            const newPoll: Poll = {
                id: Date.now().toString(), condominiumId: '1', title: newPollTitle, description: newPollDesc, options: updatedOptions,
                startDate: new Date().toISOString(), endDate: newPollEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'OPEN', createdBy: currentUser.id, anonymous: false
            };
            setPolls([newPoll, ...polls]);
            addToast('Criada!', 'success');
        }
        setIsCreateModalOpen(false);
    };

    const handleVote = (pollId: string, optionId: string) => {
        setPolls(prev => prev.map(poll => poll.id === pollId ? { ...poll, options: poll.options.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt) } : poll));
        setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
        addToast('Voto registrado!', 'success');
        setIsVoteModalOpen(false);
    };

    const isManager = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Gavel className="w-8 h-8 text-indigo-600" /> Assembleia</h1></div>
                {isManager && <button onClick={openCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus className="w-5 h-5" />Nova Pauta</button>}
            </header>

            {isOverdue && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1">Status de Votação Suspenso</h4>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            Identificamos pendências financeiras em sua unidade. Conforme o regimento interno, a participação em votações requer que a unidade esteja adimplente.
                        </p>
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center hover:underline"
                        >
                            Regularizar no Financeiro <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex border-b">
                <button onClick={() => setActiveTab('open')} className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'open' ? 'border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Abertas</button>
                <button onClick={() => setActiveTab('closed')} className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'closed' ? 'border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Encerradas</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {polls.filter(p => activeTab === 'open' ? p.status === 'OPEN' : p.status === 'CLOSED').map(poll => (
                    <div key={poll.id} className="bg-white dark:bg-slate-800 rounded-2xl border p-6 group relative">
                        {isManager && (
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setDeletePollId(poll.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                        <h3 className="text-xl font-bold mb-2">{poll.title}</h3>
                        <p className="text-sm text-slate-600 mb-4">{poll.description}</p>
                        <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg mb-6">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(poll.endDate).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {poll.options.reduce((acc, c) => acc + c.votes, 0)} votos</span>
                        </div>
                        {poll.status === 'OPEN' && !userVotes[poll.id] ? (
                            <button
                                onClick={() => isOverdue ? addToast('Acesso restrito por inadimplência.', 'error') : setSelectedPoll(poll) || setIsVoteModalOpen(true)}
                                disabled={isOverdue}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isOverdue ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed border border-dashed border-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
                            >
                                {isOverdue && <Lock className="w-4 h-4" />}
                                {isOverdue ? 'Votação Restrita' : 'Participar da Votação'}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                {poll.options.map(opt => (
                                    <div key={opt.id} className="relative">
                                        <div className="flex justify-between text-sm mb-1"><span>{opt.text}</span><span className="font-bold">{opt.votes}</span></div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full" style={{ width: `${(opt.votes / Math.max(1, poll.options.reduce((a, b) => a + b.votes, 0))) * 100}%` }} /></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 relative">
                        <h3 className="text-xl font-bold mb-6">Nova Votação</h3>
                        <form onSubmit={handleSavePoll} className="space-y-4">
                            <input type="text" required placeholder="Título" className="w-full p-2 border rounded-xl" value={newPollTitle} onChange={e => setNewPollTitle(e.target.value)} />
                            <textarea rows={3} required placeholder="Descrição" className="w-full p-2 border rounded-xl" value={newPollDesc} onChange={e => setNewPollDesc(e.target.value)} />
                            <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button><button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Criar</button></div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {isVoteModalOpen && selectedPoll && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setIsVoteModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 relative">
                        <h3 className="text-lg font-bold mb-6">{selectedPoll.title}</h3>
                        <div className="space-y-3">
                            {selectedPoll.options.map(opt => <button key={opt.id} onClick={() => handleVote(selectedPoll.id, opt.id)} className="w-full p-4 border rounded-xl hover:bg-slate-50 text-left">{opt.text}</button>)}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmModal isOpen={!!deletePollId} onClose={() => setDeletePollId(null)} onConfirm={() => setPolls(polls.filter(p => p.id !== deletePollId)) || setDeletePollId(null)} title="Excluir" description="Remover pauta?" />

            {isPaymentModalOpen && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isPaying && setIsPaymentModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-green-500" />
                                Regularização Rápida
                            </h3>
                            <button onClick={() => !isPaying && setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            Seus boletos vencidos estão listados abaixo. O pagamento desbloqueia seu voto instantaneamente.
                        </p>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                            {bills.data
                                .filter(b => b.userId === currentUser.id && b.status === 'LATE')
                                .map(bill => (
                                    <div key={bill.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center group/item hover:border-indigo-200 transition-all">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{bill.description}</p>
                                            <p className="text-xs text-slate-500">Vencimento: {new Date(bill.dueDate).toLocaleDateString()}</p>
                                            <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1 text-lg">R$ {bill.value.toFixed(2)}</p>
                                        </div>
                                        <button
                                            disabled={!!isPaying}
                                            onClick={async () => {
                                                setIsPaying(bill.id);
                                                try {
                                                    await payBill(bill.id, currentUser.id);
                                                    addToast('Pagamento confirmado! Voto liberado.', 'success');

                                                    // Se não houver mais boletos pendentes, atualiza o status do usuário logado
                                                    const remaining = bills.data.filter(b => b.userId === currentUser.id && b.status === 'LATE').length;
                                                    if (remaining === 0) {
                                                        useAuthStore.getState().updateUser({ financialStatus: 'PAID' });
                                                        setTimeout(() => setIsPaymentModalOpen(false), 1200);
                                                    }
                                                } catch (err) {
                                                    addToast('Erro ao processar pagamento.', 'error');
                                                } finally {
                                                    setIsPaying(null);
                                                }
                                            }}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isPaying === bill.id ? 'bg-slate-200 text-slate-400' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200/50 hover:shadow-lg'}`}
                                        >
                                            {isPaying === bill.id ? 'Processando...' : 'Pagar Agora'}
                                        </button>
                                    </div>
                                ))}

                            {bills.data.filter(b => b.userId === currentUser.id && b.status === 'LATE').length === 0 && (
                                <div className="text-center py-8 animate-in fade-in zoom-in-95">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">Tudo em dia!</p>
                                    <p className="text-sm text-slate-500 mt-1">Sua participação na assembleia está liberada.</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="w-full py-3 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
                        >
                            Voltar para Assembleia
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
