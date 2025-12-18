import React, { useState } from 'react';
import { Building2, MapPin, Users, Plus, Layers, Edit2, Trash2 } from 'lucide-react';
import { Condominium, UserRole } from '../types';
import CondoModal from './CondoModal';
import ConfirmModal from './ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';

const CondoModule: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { condos, addCondo, updateCondo, deleteCondo } = useDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  const handleOpenEdit = (condo: Condominium) => {
    setEditingCondo(condo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCondo(null);
  };

  const handleSave = async (condoData: Omit<Condominium, 'id'>) => {
    if (editingCondo) {
      await updateCondo(editingCondo.id, condoData);
    } else {
      await addCondo(condoData);
    }
    handleCloseModal();
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteCondo(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/60 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-indigo-600" />
            Condomínios
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os condomínios cadastrados na plataforma.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Condomínio
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {condos.map(condo => (
          <div key={condo.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group relative">
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleOpenEdit(condo)}
                    className="p-1.5 bg-white dark:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(condo.id)}
                    className="p-1.5 bg-white dark:bg-slate-700 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-8 h-8" />
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                ID: {condo.id}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{condo.name}</h3>

            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{condo.address}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{condo.unitsCount} Unidades</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase mb-2 flex items-center">
                <Layers className="w-3 h-3 mr-1" />
                Áreas Comuns ({condo.resources.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {condo.resources.slice(0, 3).map(res => (
                  <span key={res} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md">
                    {res}
                  </span>
                ))}
                {condo.resources.length > 3 && (
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs rounded-md">
                    +{condo.resources.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CondoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={editingCondo}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Condomínio"
        description="Tem certeza que deseja excluir este condomínio?"
        confirmText="Excluir"
        isDestructive={true}
      />
    </div>
  );
};

export default CondoModule;