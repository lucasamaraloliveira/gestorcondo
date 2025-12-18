import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Upload, Filter, Search, FileBarChart, Book, Info, Building2, Edit2, Trash2 } from 'lucide-react';
import { UserRole, CondoDocument } from '../types';
import { api } from '../services/api';
import DocumentModal from './DocumentModal';
import ConfirmModal from './ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import Skeleton from './ui/Skeleton';

const DocumentsModule: React.FC = () => {
    const { currentUser } = useAuthStore();
    const { addToast } = useUIStore();
    const { condos: allCondos } = useDataStore();

    if (!currentUser) return null;

    const accessibleCondos = useMemo(() => {
        if (currentUser.role === UserRole.SUPER_ADMIN) {
            return allCondos;
        }
        if (currentUser.role === UserRole.SYNDIC) {
            const managedIds = currentUser.managedCondoIds || [];
            return allCondos.filter(c => managedIds.includes(c.id) || c.id === currentUser.condominiumId);
        }
        return allCondos.filter(c => c.id === currentUser.condominiumId);
    }, [currentUser, allCondos]);

    const [selectedCondoId, setSelectedCondoId] = useState<string>(currentUser.condominiumId || accessibleCondos[0]?.id || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'MINUTES' | 'FINANCIAL' | 'RULES' | 'OTHER'>('ALL');
    const [documents, setDocuments] = useState<CondoDocument[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, isLoading: false });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<CondoDocument | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId);

    useEffect(() => {
        if (selectedCondoId) {
            setDocuments([]);
            loadDocuments(selectedCondoId, 1);
        }
    }, [selectedCondoId]);

    const loadDocuments = async (condoId: string, page: number) => {
        setPagination(prev => ({ ...prev, isLoading: true }));
        try {
            const res = await api.getDocuments(condoId, page, 6);
            setDocuments(prev => page === 1 ? res.data : [...prev, ...res.data]);
            setPagination({
                page: res.page,
                totalPages: res.totalPages,
                isLoading: false
            });
        } catch (error) {
            addToast('Erro ao carregar.', 'error');
            setPagination(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleLoadMore = () => {
        if (selectedCondoId && pagination.page < pagination.totalPages) {
            loadDocuments(selectedCondoId, pagination.page + 1);
        }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || doc.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'MINUTES': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'FINANCIAL': return <FileBarChart className="w-5 h-5 text-green-500" />;
            case 'RULES': return <Book className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-slate-500" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'MINUTES': return 'Ata';
            case 'FINANCIAL': return 'Financeiro';
            case 'RULES': return 'Regimento';
            default: return 'Outros';
        }
    };

    const handleSaveDocument = async (docData: Partial<CondoDocument>, file?: File | null) => {
        try {
            const formatSize = (bytes: number) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            const payload: any = { ...docData, condominiumId: selectedCondoId };
            if (file) {
                payload.size = formatSize(file.size);
                payload.date = new Date().toISOString().split('T')[0];
                payload.url = '#';
            }

            if (editingDoc) {
                await api.updateDocument(editingDoc.id, payload);
                addToast('Documento atualizado!', 'success');
            } else {
                await api.createDocument(payload);
                addToast('Documento enviado!', 'success');
            }
            loadDocuments(selectedCondoId, 1);
        } catch (error) {
            addToast('Erro ao salvar.', 'error');
        }
    };

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await api.deleteDocument(deleteId);
                setDocuments(prev => prev.filter(d => d.id !== deleteId));
                addToast('Documento excluído.', 'info');
            } catch (error) {
                addToast('Erro ao excluir.', 'error');
            } finally {
                setDeleteId(null);
            }
        }
    };

    const canManage = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;

    if (!activeCondo) {
        return <div className="p-8 text-center text-slate-500">Selecione um condomínio.</div>;
    }

    return (
        <div className="max-w-full mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
                        <FileText className="w-6 h-6 mr-2 text-indigo-600" /> Mural de Documentos
                    </h2>
                    {accessibleCondos.length > 1 ? (
                        <select value={selectedCondoId} onChange={e => setSelectedCondoId(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 p-2 rounded-lg text-sm mt-3">
                            {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    ) : <p className="text-slate-500 text-sm flex items-center mt-1"><Building2 className="w-4 h-4 mr-1.5" />{activeCondo.name}</p>}
                </div>
                {canManage && <button onClick={() => { setEditingDoc(null); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"><Upload className="w-4 h-4 mr-2" />Enviar</button>}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 border rounded-xl dark:bg-slate-800 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'MINUTES', 'FINANCIAL', 'RULES'].map(cat => (
                        <button key={cat} onClick={() => setFilterCategory(cat as any)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${filterCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800'}`}>
                            {cat === 'ALL' ? 'Todos' : cat === 'MINUTES' ? 'Atas' : cat === 'FINANCIAL' ? 'Financeiro' : 'Regimentos'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagination.isLoading && documents.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
                            <Skeleton variant="circle" className="w-8 h-8 mb-3" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3 mb-4" />
                            <div className="flex justify-between border-t pt-3 mt-auto">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        </div>
                    ))
                ) : filteredDocs.length === 0 ? (
                    <p className="col-span-full py-12 text-center italic">Nenhum documento.</p>
                ) : (
                    filteredDocs.map(doc => (
                        <div key={doc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border group relative">
                            {canManage && (
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingDoc(doc); setIsModalOpen(true); }} className="p-1.5 border rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setDeleteId(doc.id)} className="p-1.5 border rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            )}
                            <div className="mb-3">{getCategoryIcon(doc.category)}</div>
                            <h3 className="font-bold text-sm min-h-[40px] mb-2">{doc.title}</h3>
                            <div className="flex justify-between items-center text-xs mt-4 pt-3 border-t">
                                <span>{new Date(doc.date).toLocaleDateString()} • {doc.size}</span>
                                <button className="text-indigo-600"><Download className="w-3 h-3 mr-1 inline" />Baixar</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {pagination.page < pagination.totalPages && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={handleLoadMore}
                        disabled={pagination.isLoading}
                        className="px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                    >
                        {pagination.isLoading ? 'Carregando...' : 'Carregar mais documentos'}
                    </button>
                </div>
            )}

            <DocumentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveDocument} initialData={editingDoc} />
            <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Excluir" description="Excluir?" />
        </div>
    );
};

export default DocumentsModule;