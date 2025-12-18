import React, { useState, useEffect, useMemo } from 'react';
import { Armchair, Plus, Building2, Trash2, X, Save, Edit2 } from 'lucide-react';
import { UserRole } from '../types';
import { createPortal } from 'react-dom';
import ConfirmModal from './ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';

const ResourcesModule: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const { condos: allCondos, updateCondo } = useDataStore();

  const accessibleCondos = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return allCondos;
    }
    if (currentUser.role === UserRole.SYNDIC) {
      const managedIds = currentUser.managedCondoIds || [];
      return allCondos.filter(c => managedIds.includes(c.id) || c.id === currentUser.condominiumId);
    }
    return [];
  }, [currentUser, allCondos]);

  const [selectedCondoId, setSelectedCondoId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newResourceName, setNewResourceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [deleteResourceName, setDeleteResourceName] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCondoId && accessibleCondos.length > 0) {
      setSelectedCondoId(accessibleCondos[0].id);
    }
  }, [accessibleCondos, selectedCondoId]);

  const activeCondo = accessibleCondos.find(c => c.id === selectedCondoId);

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCondo || !newResourceName.trim()) return;

    setLoading(true);
    try {
      let updatedResources: string[];
      let action = 'adicionado';

      if (editingResource) {
        updatedResources = activeCondo.resources.map(r => r === editingResource ? newResourceName.trim() : r);
        action = 'editado';
      } else {
        updatedResources = [...activeCondo.resources, newResourceName.trim()];
      }

      await updateCondo(activeCondo.id, { resources: updatedResources });
      addToast(`Recurso ${action} com sucesso!`, 'success');
      closeModal();
    } catch (err) {
      addToast('Erro ao salvar recurso.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!activeCondo || !deleteResourceName) return;

    setLoading(true);
    try {
      const updatedResources = activeCondo.resources.filter(r => r !== deleteResourceName);
      await updateCondo(activeCondo.id, { resources: updatedResources });
      addToast(`Recurso "${deleteResourceName}" removido.`, 'success');
    } catch (err) {
      addToast('Erro ao remover recurso.', 'error');
    } finally {
      setLoading(false);
      setDeleteResourceName(null);
    }
  };

  const openEdit = (res: string) => {
    setEditingResource(res);
    setNewResourceName(res);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
    setNewResourceName('');
  };

  if (!currentUser || accessibleCondos.length === 0) {
    return <div className="p-8 text-center text-slate-500">Sem permissão para gerenciar recursos.</div>;
  }

  if (!activeCondo) {
    return <div className="p-8 text-center text-slate-500">Selecione um condomínio.</div>;
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
            <Armchair className="w-6 h-6 mr-2 text-indigo-600" /> Recursos / Áreas
          </h2>
          {accessibleCondos.length > 1 ? (
            <select value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 p-2 rounded-lg text-sm mt-2">
              {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : <p className="text-slate-500 text-sm flex items-center mt-1"><Building2 className="w-4 h-4 mr-1.5" />{activeCondo.name}</p>}
        </div>
        <button onClick={() => { setEditingResource(null); setNewResourceName(''); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"><Plus className="w-4 h-4 mr-2" />Novo Recurso</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeCondo.resources.length === 0 ? <p className="col-span-full py-10 text-center italic">Nenhum recurso cadastrado.</p> : activeCondo.resources.map((res, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 group relative">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{res}</h3>
            <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(res)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => setDeleteResourceName(res)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/75" onClick={closeModal}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl relative z-[61]">
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">{editingResource ? 'Editar Recurso' : 'Novo Recurso'}</h3>
            <form onSubmit={handleSaveResource} className="space-y-4">
              <input type="text" required autoFocus className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:text-white" placeholder="Nome" value={newResourceName} onChange={e => setNewResourceName(e.target.value)} />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal isOpen={!!deleteResourceName} onClose={() => setDeleteResourceName(null)} onConfirm={confirmDelete} title="Excluir" description={`Excluir "${deleteResourceName}"?`} />
    </div>
  );
};

export default ResourcesModule;