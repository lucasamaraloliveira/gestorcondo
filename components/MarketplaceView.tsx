import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Plus, X, Search, Tag, Image as ImageIcon, Phone, Trash2, Building2 } from 'lucide-react';
import { MarketplaceItem, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import Skeleton from './ui/Skeleton';

const CATEGORIES = {
    'FURNITURE': 'Móveis',
    'ELECTRONICS': 'Eletrônicos',
    'SERVICES': 'Serviços',
    'DONATION': 'Doação',
    'OTHER': 'Outros'
};

export const MarketplaceView: React.FC = () => {
    const { currentUser } = useAuthStore();
    const { addToast } = useUIStore();
    const { condos: allCondos } = useDataStore();

    if (!currentUser) return null;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
    const [items, setItems] = useState<MarketplaceItem[]>([]);
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
            setItems([]);
            loadMarketplaceItems(selectedCondoId, 1);
        }
    }, [selectedCondoId]);

    const loadMarketplaceItems = async (condoId: string, page: number) => {
        setPagination(prev => ({ ...prev, isLoading: true }));
        try {
            const res = await api.getMarketplaceItems(condoId, page, 6);
            setItems(prev => page === 1 ? res.data : [...prev, ...res.data]);
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
            loadMarketplaceItems(selectedCondoId, pagination.page + 1);
        }
    };

    const [newItem, setNewItem] = useState({ title: '', description: '', price: '', category: 'FURNITURE', contact: '', image: '' });

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCondo) return;
        try {
            const data = await api.createMarketplaceItem({
                condominiumId: activeCondo.id,
                userId: currentUser.id,
                userName: currentUser.name,
                userContact: newItem.contact,
                title: newItem.title,
                description: newItem.description,
                price: Number(newItem.price) || 0,
                category: newItem.category as any,
                images: newItem.image ? [newItem.image] : []
            });
            setItems(prev => [data, ...prev]);
            addToast('Anunciado!', 'success');
            setIsCreateModalOpen(false);
            setNewItem({ title: '', description: '', price: '', category: 'FURNITURE', contact: '', image: '' });
        } catch (error) {
            addToast('Erro ao criar.', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteItemId) return;
        try {
            await api.deleteMarketplaceItem(deleteItemId);
            setItems(prev => prev.filter(i => i.id !== deleteItemId));
            addToast('Removido.', 'info');
        } catch (error) {
            addToast('Erro ao excluir.', 'error');
        } finally {
            setDeleteItemId(null);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (!activeCondo) return <div className="p-8 text-center text-slate-500">Selecione um condomínio.</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center mb-1"><ShoppingBag className="w-8 h-8 mr-2 text-blue-600" /> Classificados</h1>
                    {accessibleCondos.length > 1 ? (
                        <select value={selectedCondoId} onChange={e => setSelectedCondoId(e.target.value)} className="bg-slate-50 border p-2 rounded-lg text-sm mt-3">
                            {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    ) : <p className="text-slate-500 text-sm mt-1">{activeCondo.name}</p>}
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-600/20 active:scale-95"><Plus className="w-5 h-5" /> Anunciar</button>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div className="flex gap-2 overflow-x-auto"><button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Todos</button>{Object.entries(CATEGORIES).map(([key, label]) => (<button key={key} onClick={() => setSelectedCategory(key)} className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedCategory === key ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{label}</button>))}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagination.isLoading && items.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-sm">
                            <Skeleton className="h-48 w-full" />
                            <div className="p-5">
                                <div className="flex justify-between mb-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3 mb-4" />
                                <div className="flex justify-between border-t pt-4">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-sm group">
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-900">
                            {item.images[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-12 h-12" /></div>}
                            <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase">{CATEGORIES[item.category as keyof typeof CATEGORIES]}</div>
                            {(currentUser.id === item.userId || currentUser.role === UserRole.SUPER_ADMIN) && <button onClick={() => setDeleteItemId(item.id)} className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-lg hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2"><h3 className="text-lg font-bold truncate">{item.title}</h3><span className="font-bold text-blue-600">{item.price > 0 ? `R$ ${item.price}` : 'Grátis'}</span></div>
                            <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-4">{item.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 border-t pt-4"><span>{item.userName}</span><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
                            {item.userContact && <a href={`https://wa.me/55${item.userContact.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium"><Phone className="w-4 h-4" /> Contatar</a>}
                        </div>
                    </div>
                ))}
            </div>

            {pagination.page < pagination.totalPages && (
                <div className="flex justify-center py-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={pagination.isLoading}
                        className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-blue-600 text-blue-600 rounded-2xl font-bold hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                    >
                        {pagination.isLoading ? 'Carregando...' : 'Ver Mais Ofertas'}
                    </button>
                </div>
            )}

            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 relative">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Novo Anúncio</h3><button onClick={() => setIsCreateModalOpen(false)}><X /></button></div>
                        <form onSubmit={handleCreateItem} className="space-y-4">
                            <input type="text" required placeholder="Título" className="w-full p-2 border rounded-xl" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4"><input type="number" required placeholder="Preço" className="w-full p-2 border rounded-xl" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} /><select className="w-full p-2 border rounded-xl" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>{Object.entries(CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
                            <textarea rows={2} required placeholder="Descrição" className="w-full p-2 border rounded-xl" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                            <input type="text" required placeholder="WhatsApp" className="w-full p-2 border rounded-xl" value={newItem.contact} onChange={e => setNewItem({ ...newItem, contact: e.target.value })} />
                            <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Publicar</button></div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            <ConfirmModal isOpen={!!deleteItemId} onClose={() => setDeleteItemId(null)} onConfirm={handleDelete} title="Excluir" description="Remover item?" />
        </div>
    );
};

export default MarketplaceView;
