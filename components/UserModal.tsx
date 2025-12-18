import React, { useState, useEffect } from 'react';
import { X, Save, Shield, User as UserIcon, Building, Edit, MapPin } from 'lucide-react';
import { User, UserRole, Condominium } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => Promise<void>;
  currentUser: User;
  condos: Condominium[];
  initialData?: User | null; // Added for edit mode
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, currentUser, condos, initialData }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: UserRole.RESIDENT,
    active: true,
    condominiumId: currentUser.role === UserRole.SYNDIC ? currentUser.condominiumId : '',
    unitId: '',
    block: '',
  });
  const [loading, setLoading] = useState(false);

  // Reset form when opening or changing initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({
          name: '',
          email: '',
          role: currentUser.role === UserRole.SUPER_ADMIN ? UserRole.SYNDIC : UserRole.RESIDENT,
          active: true,
          condominiumId: currentUser.role === UserRole.SYNDIC ? currentUser.condominiumId : (condos[0]?.id || ''),
          unitId: '',
          block: '',
          condoJoinDate: new Date().toISOString()
        });
      }
    }
  }, [isOpen, initialData, currentUser, condos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canEditCondo = currentUser.role === UserRole.SUPER_ADMIN;
  const isEditing = !!initialData;
  const isResident = formData.role === UserRole.RESIDENT;

  // Encontrar nome do condomínio selecionado para feedback visual
  const selectedCondoName = condos.find(c => c.id === formData.condominiumId)?.name;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={onClose}></div>

        {/* Modal Panel */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle sm:max-w-lg border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                {isEditing ? <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              </div>
              {isEditing ? 'Editar Usuário' : 'Novo Cadastro'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                placeholder="Ex: João da Silva"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email de Acesso</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                placeholder="Ex: joao@email.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perfil de Acesso</label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-slate-900 dark:text-white"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    {currentUser.role === UserRole.SUPER_ADMIN && (
                      <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                    )}
                    {currentUser.role === UserRole.SUPER_ADMIN && (
                      <option value={UserRole.SYNDIC}>Síndico (Gestor)</option>
                    )}
                    <option value={UserRole.RESIDENT}>Morador (Usuário)</option>
                    {currentUser.role === UserRole.SUPER_ADMIN && (
                      <option value={UserRole.SUPPORT}>Agente Suporte</option>
                    )}
                  </select>
                  <Shield className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white"
                  value={formData.active ? 'true' : 'false'}
                  onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Vinculação</h4>

              {/* Condominium Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Condomínio</label>
                <div className="relative">
                  <select
                    className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-slate-900 dark:text-white ${!canEditCondo ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900'}`}
                    value={formData.condominiumId}
                    disabled={!canEditCondo}
                    onChange={e => setFormData({ ...formData, condominiumId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {condos.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Building className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {/* Feedback Message about isolation */}
                {selectedCondoName && isResident && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Este usuário verá apenas informações do <strong>{selectedCondoName}</strong>.
                  </p>
                )}
              </div>

              {/* Unit/Apartment & Block */}
              {isResident && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bloco / Torre</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                        placeholder="Ex: Bloco A"
                        value={formData.block || ''}
                        onChange={e => setFormData({ ...formData, block: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade / Apto</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                        placeholder="Ex: 104"
                        value={formData.unitId || ''}
                        onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                      />
                      <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
              >
                {loading ? 'Salvando...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Atualizar' : 'Salvar Usuário'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;