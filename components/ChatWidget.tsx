import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, User, Building, Hash, Minimize2, Headset } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export const ChatWidget: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'identify' | 'chat'>('identify');
  const [identity, setIdentity] = useState({ name: '', block: '', unit: '' });
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAgentOnline, setIsAgentOnline] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.checkSupportOnline().then(setIsAgentOnline);
      if (currentUser && step === 'identify') {
        setIdentity({ name: currentUser.name || '', block: currentUser.block || '', unit: currentUser.unitId || '' });
      }
    }
  }, [isOpen, currentUser]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('chat');
    if (messages.length === 0) {
      setMessages([{ id: '1', text: `Olá ${identity.name.split(' ')[0]}! Como podemos ajudar?`, sender: 'agent' }]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, sender: 'user' }]);
    setInputText('');
    if (isAgentOnline) setTimeout(() => setMessages(prev => [...prev, { id: Date.now().toString(), text: "Verificando...", sender: 'agent' }]), 1500);
  };

  if (!isOpen) return <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50"><MessageCircle /><span className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isAgentOnline ? 'bg-green-500' : 'bg-slate-400'}`}></span></button>;

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-800 border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="bg-blue-600 p-4 flex justify-between items-center text-white"><div className="flex items-center gap-2 relative"><Headset className="w-5 h-5" /><div className="flex flex-col"><span className="text-xs font-bold">Suporte</span><span className="text-[10px]">{isAgentOnline ? 'Online' : 'Offline'}</span></div><span className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-blue-600 ${isAgentOnline ? 'bg-green-400' : 'bg-slate-300'}`}></span></div><button onClick={() => setIsOpen(false)}><Minimize2 className="w-4 h-4" /></button></div>
      {step === 'identify' ? (
        <form onSubmit={handleStartChat} className="p-6 space-y-4">
          <input required type="text" placeholder="Nome" className="w-full p-2 border rounded-lg text-sm" value={identity.name} onChange={e => setIdentity({ ...identity, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2"><input required type="text" placeholder="Bloco" className="w-full p-2 border rounded-lg text-sm" value={identity.block} onChange={e => setIdentity({ ...identity, block: e.target.value })} /><input required type="text" placeholder="Unid." className="w-full p-2 border rounded-lg text-sm" value={identity.unit} onChange={e => setIdentity({ ...identity, unit: e.target.value })} /></div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg">Iniciar</button>
        </form>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[300px] bg-slate-50 dark:bg-slate-900/50">
            {messages.map(m => <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'}`}>{m.text}</div></div>)}
          </div>
          <form onSubmit={handleSendMessage} className="p-2 border-t flex gap-2"><input type="text" className="flex-1 p-2 border rounded-full text-sm" placeholder="Mensagem..." value={inputText} onChange={e => setInputText(e.target.value)} /><button type="submit" className="bg-blue-600 text-white p-2 rounded-full"><Send className="w-4 h-4" /></button></form>
        </>
      )}
    </div>
  );
};

export default ChatWidget;