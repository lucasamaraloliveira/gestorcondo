import React, { useState } from 'react';
import { X, Send, MessageSquare, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  currentUser: User;
}

const SupportChatModal: React.FC<SupportChatModalProps> = ({ isOpen, onClose, onSend, currentUser }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await onSend(message);
      setSent(true);
      setTimeout(() => {
        onClose();
        setSent(false);
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-2xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Mensagem Enviada!</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">O administrador entrará em contato em breve.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                   <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                     <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white">Falar com Suporte</h3>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Solicitação de troca de condomínio</p>
                   </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-lg p-4 mb-4 flex items-start">
                 <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400 mr-2 flex-shrink-0 mt-0.5" />
                 <p className="text-sm text-orange-700 dark:text-orange-300">
                    Seu prazo de 30 dias para troca automática expirou. Por favor, explique o motivo da alteração para o Super Admin.
                 </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sua Mensagem</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none text-slate-900 dark:text-white"
                    placeholder="Olá, preciso alterar meu condomínio pois..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportChatModal;