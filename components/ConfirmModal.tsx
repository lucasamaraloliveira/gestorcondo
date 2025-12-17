import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  isDestructive = true
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-sm p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <AlertTriangle className={`w-6 h-6 ${isDestructive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {description}
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition-all active:scale-95 ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;