import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Plus, X, Search, Filter, Tag, Image as ImageIcon, Phone, Trash2, ExternalLink, Building2 } from 'lucide-react';
import { MarketplaceItem, User, Condominium, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';
import { api } from '../services/api';

interface MarketplaceViewProps {
    currentUser: User;
    currentCondo: Condominium | undefined;
    allCondos?: Condominium[]; // Optional to support existing calls, but will be used for selector
    addToast: (message: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => void;
}

const CATEGORIES = {
    'FURNITURE': 'Móveis',
    'ELECTRONICS': 'Eletrônicos',
    'SERVICES': 'Serviços',
    'DONATION': 'Doação',
    'OTHER': 'Outros'
};

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ currentUser, currentCondo, allCondos = [], addToast }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

    // Determines accessible condos for selector
    const accessibleCondos = useMemo(() => {
        if (currentUser.role === UserRole.SUPER_ADMIN) return allCondos;
        if (currentUser.role === UserRole.SYNDIC && currentUser.managedCondoIds) {
            return allCondos.filter(c => currentUser.managedCondoIds?.includes(c.id));
        }
        return currentCondo ? [currentCondo] : [];
    }, [currentUser, allCondos, currentCondo]);

    // Local selected condo state, defaulting to passed currentCondo
    const [selectedCondoId, setSelectedCondoId] = useState<string>(currentCondo?.id || '');

    // Resolve the actual active condo object
    const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId) || currentCondo;

    // React to changes in accessibleCondos or currentCondo to ensure valid selection
    React.useEffect(() => {
        if (!selectedCondoId && accessibleCondos.length > 0) {
            setSelectedCondoId(accessibleCondos[0].id);
        } else if (currentCondo && !selectedCondoId) {
            setSelectedCondoId(currentCondo.id);
        }
    }, [accessibleCondos, currentCondo, selectedCondoId]);


    // Marketplace items state
    const [items, setItems] = useState<MarketplaceItem[]>([]);

    // Load marketplace items when active condo changes
    useEffect(() => {
        if (activeCondo?.id) {
            loadMarketplaceItems(activeCondo.id);
        }
    }, [activeCondo?.id]);

    const loadMarketplaceItems = async (condoId: string) => {
        try {
            const data = await api.getMarketplaceItems(condoId);
            setItems(data);
        } catch (error) {
            console.error(error);
            addToast('Erro ao carregar classificados.', 'error');
        }
    };

    // Form State
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        price: '',
        category: 'FURNITURE',
        contact: '',
        image: ''
    });

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCondo) return;
        try {
            const newItemData = await api.createMarketplaceItem({
                condominiumId: activeCondo.id,
                userId: currentUser.id,
                userName: `${currentUser.name} - ${currentUser.unitId || ''} ${currentUser.block || ''}`.trim(),
                userContact: newItem.contact,
                title: newItem.title,
                description: newItem.description,
                price: Number(newItem.price) || 0,
                category: newItem.category as any,
                images: newItem.image ? [newItem.image] : []
            });
            setItems(prev => [newItemData, ...prev]);
            addToast('Anúncio publicado com sucesso!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Erro ao criar anúncio.', 'error');
        } finally {
            setIsCreateModalOpen(false);
            setNewItem({ title: '', description: '', price: '', category: 'FURNITURE', contact: '', image: '' });
        }
    };

    const handleDelete = async () => {
        if (!deleteItemId) return;
        const id = deleteItemId;
        const itemToDelete = items.find(i => i.id === id);
        setDeleteItemId(null);
        // Optimistic UI update
        setItems(prev => prev.filter(i => i.id !== id));
        try {
            await api.deleteMarketplaceItem(id);
            addToast('Anúncio removido.', 'info');
        } catch (error) {
            console.error(error);
            if (itemToDelete) setItems(prev => [itemToDelete, ...prev]);
            addToast('Erro ao excluir anúncio.', 'error');
        }
    };

    const filteredItems = items
        .filter(item => item.condominiumId === activeCondo?.id) // Filter by Active Condo
        .filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

    if (!activeCondo && accessibleCondos.length === 0) {
        return <div className="p-8 text-center text-slate-500">Selecione um condomínio para visualizar os classificados.</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
                        <ShoppingBag className="w-8 h-8 mr-2 text-blue-600" />
                        Classificados
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Compre, venda ou troque itens com seus vizinhos.</p>

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
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Anunciar
                </button>
            </header>

            {!activeCondo && accessibleCondos.length > 0 && (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">Por favor, selecione um condomínio acima para visualizar os anúncios.</p>
                </div>
            )}

            {activeCondo && (
                <> {/* Wrap content depending on activeCondo */}

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar itens..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                            <button
                                onClick={() => setSelectedCategory('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                Todos
                            </button>
                            {Object.entries(CATEGORIES).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCategory(key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                <div className="relative h-48 bg-slate-100 dark:bg-slate-900">
                                    {item.images[0] ? (
                                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg uppercase">
                                        {CATEGORIES[item.category as keyof typeof CATEGORIES]}
                                    </div>

                                    {(currentUser.id === item.userId || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SYNDIC') && (
                                        <button
                                            onClick={() => setDeleteItemId(item.id)}
                                            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{item.title}</h3>
                                        <span className="font-bold text-blue-600">
                                            {item.price > 0 ? `R$ ${item.price}` : 'Grátis'}
                                        </span>
                                    </div>

                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 h-10">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                {item.userName.charAt(0)}
                                            </div>
                                            <span className="truncate max-w-[100px]">{item.userName}</span>
                                        </div>
                                        <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {item.userContact && (
                                        <a
                                            href={`https://wa.me/55${item.userContact.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Contatar Vendedor
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum item encontrado</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Tente buscar por outro termo ou categoria.</p>
                        </div>
                    )}

                    {/* Create Modal */}
                    {isCreateModalOpen && createPortal(
                        <div className="fixed inset-0 z-[60] overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen px-4">
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />

                                <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Novo Anúncio</h3>
                                        <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateItem} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Anúncio</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Ex: Mesa de Jantar 4 Cadeiras"
                                                value={newItem.title}
                                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preço (R$)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="0,00"
                                                    value={newItem.price}
                                                    onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                                                <select
                                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newItem.category}
                                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                                >
                                                    {Object.entries(CATEGORIES).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                                            <textarea
                                                required
                                                rows={3}
                                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                placeholder="Descreva o estado do item, tempo de uso, etc."
                                                value={newItem.description}
                                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contato (WhatsApp)</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="(00) 00000-0000"
                                                    value={newItem.contact}
                                                    onChange={e => setNewItem({ ...newItem, contact: e.target.value })}
                                                />
                                                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL da Imagem (Opcional)</label>
                                            <div className="relative">
                                                <input
                                                    type="url"
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="https://..."
                                                    value={newItem.image}
                                                    onChange={e => setNewItem({ ...newItem, image: e.target.value })}
                                                />
                                                <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Para teste, deixe em branco ou cole uma URL externa.</p>
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
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20"
                                            >
                                                Publicar Anúncio
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    <ConfirmModal
                        isOpen={!!deleteItemId}
                        onClose={() => setDeleteItemId(null)}
                        onConfirm={handleDelete}
                        title="Excluir Anúncio"
                        description="Tem certeza que deseja remover este item dos classificados?"
                        confirmText="Excluir Item"
                        isDestructive={true}
                    />
                </>
            )}
        </div>
    );
};
