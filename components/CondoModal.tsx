import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Building2, MapPin, Layers, Edit, MessageSquare } from 'lucide-react';
import { Condominium } from '../types';

interface CondoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (condo: Omit<Condominium, 'id'>) => Promise<void>;
  initialData?: Condominium | null;
}

const CondoModal: React.FC<CondoModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [unitsCount, setUnitsCount] = useState('');
  const [resourcesInput, setResourcesInput] = useState('');
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setName(initialData.name);
            setAddress(initialData.address);
            setUnitsCount(initialData.unitsCount.toString());
            setResourcesInput(initialData.resources.join(', '));
            setIsChatEnabled(initialData.features?.isChatEnabled ?? true);
        } else {
            setName('');
            setAddress('');
            setUnitsCount('');
            setResourcesInput('');
            setIsChatEnabled(true);
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert comma-separated string to array
      const resources = resourcesInput
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      await onSave({
        name,
        address,
        unitsCount: parseInt(unitsCount) || 0,
        resources,
        features: {
            isChatEnabled
        }
      });
      
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData;

  // Use createPortal to ensure the modal is rendered at the top level of the DOM,
  // avoiding z-index conflicts with Sidebar or Header components.
  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                {isEditing ? <Edit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              {isEditing ? 'Editar Condomínio' : 'Novo Condomínio'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Condomínio</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                placeholder="Ex: Residencial Flores"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço Completo</label>
              <div className="relative">
                 <input
                    type="text"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    placeholder="Rua, Número, Bairro"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                 />
                 <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qtd. Unidades</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    placeholder="Ex: 50"
                    value={unitsCount}
                    onChange={e => setUnitsCount(e.target.value)}
                  />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recursos / Áreas Comuns</label>
               <div className="relative">
                 <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    placeholder="Separe por vírgula. Ex: Churrasqueira, Piscina"
                    value={resourcesInput}
                    onChange={e => setResourcesInput(e.target.value)}
                 />
                 <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
               </div>
               <p className="text-xs text-slate-500 mt-1">Estes itens ficarão disponíveis para agendamento.</p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={isChatEnabled}
                            onChange={(e) => setIsChatEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2 text-slate-500" />
                            Habilitar Chat de Suporte
                        </span>
                        <span className="text-xs text-slate-500">Permite que moradores abram chamados via chat.</span>
                    </div>
                </label>
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
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
                    {isEditing ? 'Atualizar' : 'Salvar Condomínio'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CondoModal;