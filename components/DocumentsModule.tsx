import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Upload, Filter, Search, FileBarChart, Book, Info, Building2, Edit2, Trash2 } from 'lucide-react';
import { User, Condominium, UserRole, CondoDocument } from '../types';
import { api } from '../services/api';
import DocumentModal from './DocumentModal';
import ConfirmModal from './ConfirmModal';

interface DocumentsModuleProps {
    currentUser: User;
    allCondos: Condominium[];
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const DocumentsModule: React.FC<DocumentsModuleProps> = ({ currentUser, allCondos, addToast }) => {
    // Determine accessible condos
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
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<CondoDocument | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId);

    useEffect(() => {
        if (selectedCondoId) {
            loadDocuments();
        }
    }, [selectedCondoId]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const docs = await api.getDocuments(selectedCondoId);
            setDocuments(docs);
        } finally {
            setLoading(false);
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
            // Helper to format file size
            const formatSize = (bytes: number) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            const payload: any = {
                ...docData,
                condominiumId: selectedCondoId,
            };

            // If a file is uploaded, mock the metadata
            if (file) {
                payload.size = formatSize(file.size);
                payload.date = new Date().toISOString().split('T')[0];
                payload.url = '#'; // Mock URL
            }

            if (editingDoc) {
                await api.updateDocument(editingDoc.id, payload);
                addToast('Documento atualizado com sucesso!', 'success');
            } else {
                await api.createDocument(payload);
                addToast('Documento enviado com sucesso!', 'success');
            }

            loadDocuments();
        } catch (error) {
            addToast('Erro ao salvar documento.', 'error');
        }
    };

    const handleDelete = async () => {
        if (deleteId) {
            const docToDelete = documents.find(d => d.id === deleteId);
            if (!docToDelete) {
                setDeleteId(null);
                return;
            }

            try {
                // Optimistic UI update
                setDocuments(prev => prev.filter(d => d.id !== deleteId));
                await api.deleteDocument(deleteId); // Assume API supports this

                addToast(
                    'Documento excluído.',
                    'info',
                    async () => {
                        // Undo Logic
                        try {
                            // Re-create or restore via API (mocking simply by reloading or state revert)
                            // Ideally we would call api.restoreDocument(deleteId) or similar.
                            // For now we will just re-add to state and call create/restore if API allowed.
                            // Since our api is mock-ish, we simulate restore:
                            await api.createDocument(docToDelete); // Re-creating as "restore"
                            setDocuments(prev => [...prev, docToDelete]);
                            addToast('Ação desfeita.', 'success');
                        } catch (e) {
                            addToast('Erro ao desfazer.', 'error');
                        }
                    }
                );
            } catch (error) {
                addToast('Erro ao excluir documento.', 'error');
                loadDocuments(); // Revert optimistic update on error
            } finally {
                setDeleteId(null);
            }
        }
    };

    const canManage = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;

    if (!activeCondo) {
        return <div className="p-8 text-center text-slate-500">Selecione um condomínio para ver os documentos.</div>;
    }

    return (
        <div className="max-w-full mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
                        <FileText className="w-6 h-6 mr-2 text-indigo-600" />
                        Mural de Documentos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Acesse atas, balancetes e regulamentos do condomínio.
                    </p>

                    {/* Condo Selector */}
                    {accessibleCondos.length > 1 ? (
                        <div className="flex items-center mt-3">
                            <Building2 className="w-4 h-4 text-slate-400 mr-2" />
                            <select
                                value={selectedCondoId}
                                onChange={(e) => setSelectedCondoId(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none min-w-[250px]"
                            >
                                {accessibleCondos.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center mt-1 font-medium">
                            <Building2 className="w-4 h-4 mr-1.5" />
                            {activeCondo.name}
                        </p>
                    )}
                </div>

                {canManage && (
                    <button
                        onClick={() => { setEditingDoc(null); setIsModalOpen(true); }}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar Documento
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar documento..."
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'MINUTES', 'FINANCIAL', 'RULES'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat as any)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-colors border ${filterCategory === cat
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {cat === 'ALL' ? 'Todos' : cat === 'MINUTES' ? 'Atas' : cat === 'FINANCIAL' ? 'Financeiro' : 'Regimentos'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents List */}
            {loading ? (
                <div className="py-12 text-center text-slate-500">Carregando documentos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocs.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400 italic bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            Nenhum documento encontrado.
                        </div>
                    ) : (
                        filteredDocs.map(doc => (
                            <div key={doc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group relative">
                                {canManage && (
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingDoc(doc); setIsModalOpen(true); }}
                                            className="p-1.5 bg-white dark:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(doc.id)}
                                            className="p-1.5 bg-white dark:bg-slate-700 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                        {getCategoryIcon(doc.category)}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full uppercase">
                                        {getCategoryLabel(doc.category)}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 min-h-[40px] mb-2" title={doc.title}>
                                    {doc.title}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <span>{new Date(doc.date).toLocaleDateString()} • {doc.size}</span>
                                    <button
                                        onClick={() => addToast('Download iniciado...', 'info')}
                                        className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                    >
                                        <Download className="w-3 h-3 mr-1" />
                                        Baixar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <DocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveDocument}
                initialData={editingDoc}
            />

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Documento"
                description="Tem certeza que deseja excluir este documento permanentemente?"
                confirmText="Excluir"
                isDestructive={true}
            />
        </div>
    );
};

export default DocumentsModule;