import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info, Undo2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onUndo?: () => void;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return createPortal(
    <div className="fixed top-6 right-6 z-[120] flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>,
    document.body
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const styles = {
    success: {
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: <CheckCircle2 className="w-6 h-6" />
    },
    error: {
      border: 'border-l-red-500',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: <AlertCircle className="w-6 h-6" />
    },
    info: {
      border: 'border-l-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      icon: <Info className="w-6 h-6" />
    }
  };

  const currentStyle = styles[toast.type];

  return (
    <div className={`pointer-events-auto flex items-start p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-l-4 ${currentStyle.border} border-t border-r border-b border-slate-100 dark:border-slate-700 animate-in slide-in-from-right-full fade-in duration-300`}>
      <div className={`flex-shrink-0 p-2 rounded-full ${currentStyle.iconBg} ${currentStyle.iconColor} mr-3`}>
        {currentStyle.icon}
      </div>
      
      <div className="flex-1 pt-1 mr-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
          {toast.type === 'success' ? 'Sucesso!' : toast.type === 'error' ? 'Atenção' : 'Informação'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {toast.message}
        </p>
        
        {toast.onUndo && (
            <button
            onClick={() => {
                toast.onUndo?.();
                removeToast(toast.id);
            }}
            className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center bg-blue-50 dark:bg-slate-700 px-2 py-1 rounded w-fit transition-colors"
            >
            <Undo2 className="w-3 h-3 mr-1" />
            Desfazer ação
            </button>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};