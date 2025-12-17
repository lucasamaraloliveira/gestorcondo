import React, { useState, useEffect, useMemo } from 'react';
import { Armchair, Plus, Building2, Trash2, X, Save, Edit2 } from 'lucide-react';
import { User, UserRole, Condominium } from '../types';
import { createPortal } from 'react-dom';
import ConfirmModal from './ConfirmModal';

interface ResourcesModuleProps {
  currentUser: User;
  allCondos: Condominium[];
  onUpdateCondo: (condoId: string, resources: string[]) => Promise<void>;
  addToast: (msg: string, type: 'success' | 'error' | 'info', onUndo?: () => void) => void;
}

const ResourcesModule: React.FC<ResourcesModuleProps> = ({ currentUser, allCondos, onUpdateCondo, addToast }) => {
  // Logic to determine accessible condos (similar to AgendaModule)
  const accessibleCondos = useMemo(() => {
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
  
  // Edit State
  const [editingResource, setEditingResource] = useState<string | null>(null);

  // Delete State
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
          // Editing existing
          updatedResources = activeCondo.resources.map(r => r === editingResource ? newResourceName.trim() : r);
          action = 'editado';
      } else {
          // Creating new
          updatedResources = [...activeCondo.resources, newResourceName.trim()];
      }

      await onUpdateCondo(activeCondo.id, updatedResources);
      addToast(`Recurso ${action} com sucesso!`, 'success');
      
      closeModal();
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar recurso.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!activeCondo || !deleteResourceName) return;

    setLoading(true);
    try {
      const originalResources = [...activeCondo.resources];
      const updatedResources = activeCondo.resources.filter(r => r !== deleteResourceName);
      
      await onUpdateCondo(activeCondo.id, updatedResources);
      
      addToast(`Recurso "${deleteResourceName}" removido.`, 'success', async () => {
          // Undo Action
          await onUpdateCondo(activeCondo.id, originalResources);
          addToast('Ação desfeita! Recurso restaurado.', 'info');
      });

    } catch (err) {
      console.error(err);
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

  if (accessibleCondos.length === 0) {
    return <div className="p-8 text-center text-slate-500">Você não tem permissão para gerenciar recursos.</div>;
  }

  if (!activeCondo) {
     return <div className="p-8 text-center text-slate-500">Selecione um condomínio.</div>;
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
            <Armchair className="w-6 h-6 mr-2 text-indigo-600" />
            Recursos / Áreas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie os espaços comuns disponíveis para reserva.</p>

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
        
        <button 
          onClick={() => { setEditingResource(null); setNewResourceName(''); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Recurso
        </button>
      </div>

      {/* Grid of Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeCondo.resources.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-400 italic bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                Nenhum recurso cadastrado para este condomínio.
            </div>
        ) : (
            activeCondo.resources.map((res, index) => (
                <div key={`${res}-${index}`} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 mb-3">
                            <Armchair className="w-6 h-6" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => openEdit(res)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setDeleteResourceName(res)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Excluir"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{res}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Disponível para reservas na agenda.</p>
                </div>
            ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={closeModal}></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                        {editingResource ? <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                   {editingResource ? 'Editar Recurso' : 'Novo Recurso'}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveResource} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Recurso / Área</label>
                   <input
                      type="text"
                      required
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ex: Sala de Jogos"
                      value={newResourceName}
                      onChange={e => setNewResourceName(e.target.value)}
                   />
                   <p className="text-xs text-slate-500 mt-1">Este nome aparecerá para os moradores na hora de agendar.</p>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            {editingResource ? 'Atualizar' : 'Salvar'}
                        </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal 
        isOpen={!!deleteResourceName}
        onClose={() => setDeleteResourceName(null)}
        onConfirm={confirmDelete}
        title="Excluir Recurso"
        description={`Tem certeza que deseja excluir o recurso "${deleteResourceName}"?`}
        confirmText="Excluir"
        isDestructive={true}
      />
    </div>
  );
};

export default ResourcesModule;