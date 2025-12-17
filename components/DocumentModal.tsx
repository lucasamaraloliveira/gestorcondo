import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Upload, FileText, FileBarChart, Book, Info } from 'lucide-react';
import { CondoDocument } from '../types';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: Partial<CondoDocument>, file?: File | null) => Promise<void>;
  initialData?: CondoDocument | null;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'MINUTES' | 'FINANCIAL' | 'RULES' | 'OTHER'>('OTHER');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setTitle(initialData.title);
            setCategory(initialData.category);
            setFile(null); // Reset file on edit, unless user uploads new one
        } else {
            setTitle('');
            setCategory('OTHER');
            setFile(null);
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    // On Create, file is required. On Edit, it's optional.
    if (!initialData && !file) return;

    setLoading(true);
    try {
      await onSave({
        title,
        category,
      }, file);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setFile(e.target.files[0]);
          // Auto-fill title if empty
          if (!title) {
              const name = e.target.files[0].name;
              setTitle(name.substring(0, name.lastIndexOf('.')) || name);
          }
      }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                {isEditing ? <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              {isEditing ? 'Editar Documento' : 'Enviar Novo Documento'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Documento</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                placeholder="Ex: Ata Assembléia Jan/24"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <div className="grid grid-cols-2 gap-2">
                  {[
                      { id: 'MINUTES', label: 'Atas', icon: FileText },
                      { id: 'FINANCIAL', label: 'Financeiro', icon: FileBarChart },
                      { id: 'RULES', label: 'Regimento', icon: Book },
                      { id: 'OTHER', label: 'Outros', icon: Info },
                  ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`flex items-center p-2 rounded-lg border text-sm transition-all ${
                            category === cat.id 
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                          <cat.icon className={`w-4 h-4 mr-2 ${category === cat.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                          {cat.label}
                      </button>
                  ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isEditing ? 'Substituir Arquivo (Opcional)' : 'Arquivo (PDF, Imagem, Doc)'}
                </label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <input 
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        required={!isEditing}
                    />
                    <div className="flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                        {file ? (
                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">
                                {file.name}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Clique ou arraste para enviar
                            </p>
                        )}
                        {file && <p className="text-[10px] text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                        
                        {isEditing && !file && (
                            <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-700 pt-2 w-full">
                                Arquivo atual: {initialData?.title} ({initialData?.size})
                            </p>
                        )}
                    </div>
                </div>
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
                disabled={loading || (!isEditing && !file)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
              >
                {loading ? 'Salvando...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Atualizar' : 'Salvar'}
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

export default DocumentModal;