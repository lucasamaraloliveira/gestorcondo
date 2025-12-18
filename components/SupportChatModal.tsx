import React, { useState } from 'react';
import { X, Send, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const SupportChatModal: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { isSupportChatOpen: isOpen, setSupportChatOpen: onClose } = useUIStore();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      // Mock send
      await new Promise(r => setTimeout(r, 1000));
      setSent(true);
      setTimeout(() => {
        onClose(false);
        setSent(false);
        setMessage('');
      }, 2000);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/75" onClick={() => onClose(false)}></div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 relative z-[61] border">
        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Send className="text-green-600" /></div>
            <h3 className="text-xl font-bold">Enviado!</h3>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3"><MessageSquare className="text-orange-600" /><div><h3 className="text-lg font-bold">Suporte</h3><p className="text-xs text-slate-500">Troca de condomínio</p></div></div>
              <button onClick={() => onClose(false)}><X /></button>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg mb-4 flex gap-2"><AlertTriangle className="text-orange-500 w-5 h-5 flex-shrink-0" /><p className="text-sm text-orange-700">Explique o motivo da alteração para o administrador.</p></div>
            <form onSubmit={handleSubmit}>
              <textarea required rows={4} className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-orange-500 resize-none" placeholder="Motivo..." value={message} onChange={e => setMessage(e.target.value)} />
              <div className="flex justify-end gap-3"><button type="button" onClick={() => onClose(false)}>Cancelar</button><button type="submit" disabled={loading} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">{loading ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar</>}</button></div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SupportChatModal;