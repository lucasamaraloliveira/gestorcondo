import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, User, Building, Hash, Minimize2, Headset } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../services/api';

interface ChatWidgetProps {
  currentUser: UserType | null;
}

interface ChatIdentity {
  name: string;
  block: string;
  unit: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'identify' | 'chat'>('identify');
  const [identity, setIdentity] = useState<ChatIdentity>({ name: '', block: '', unit: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [traceKey, setTraceKey] = useState('');

  // Status do Agente
  const [isAgentOnline, setIsAgentOnline] = useState(false);

  // Check agent status periodically when chat is open
  useEffect(() => {
    if (isOpen) {
      const checkStatus = async () => {
        const online = await api.checkSupportOnline();
        setIsAgentOnline(online);
      };
      checkStatus();
      const interval = setInterval(checkStatus, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Pre-fill data if user is logged in
  useEffect(() => {
    if (isOpen && currentUser && step === 'identify') {
      setIdentity(prev => ({
        ...prev,
        name: currentUser.name || '',
        block: currentUser.block || '',
        unit: currentUser.unitId || ''
      }));
    }
  }, [isOpen, currentUser, step]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.name || !identity.block || !identity.unit) return;

    const key = `KEY-${identity.block}-${identity.unit}-${Date.now().toString().slice(-4)}`;
    setTraceKey(key);

    setStep('chat');

    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: `Olá ${identity.name.split(' ')[0]}! Bem-vindo ao suporte do condomínio. Sua chave de atendimento é ${key}.`,
          sender: 'system',
          timestamp: new Date()
        },
        {
          id: '2',
          text: isAgentOnline
            ? "Um de nossos atendentes está online e irá te responder em breve. Como podemos ajudar?"
            : "Nossos atendentes estão offline no momento, mas deixe sua mensagem que responderemos assim que possível.",
          sender: 'agent',
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate Agent Response if "Online" (Mock behavior for frontend demo)
    if (isAgentOnline) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "Recebemos sua mensagem. Estou verificando seu cadastro...",
          sender: 'agent',
          timestamp: new Date()
        }]);
      }, 2000);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        id="floating-chat-btn"
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 z-50 group"
      >
        <MessageCircle className="w-7 h-7" />
        {/* Status Indicator on collapsed button */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
          <span className={`w-2.5 h-2.5 rounded-full ${isAgentOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
        </span>
        <span className="absolute right-full mr-3 bg-slate-900 dark:bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
          Falar com Suporte
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-[360px] md:w-96 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 flex justify-between items-center text-white shadow-md">
        <div className="flex items-center">
          <div className="relative mr-2">
            <Headset className="w-5 h-5" />
            <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-2 border-blue-600 rounded-full ${isAgentOnline ? 'bg-green-400' : 'bg-slate-300'}`}></span>
          </div>
          <div>
            <h3 className="font-bold text-sm">Atendimento</h3>
            <p className="text-[10px] opacity-90 font-medium">
              {isAgentOnline ? '🟢 Agente Online' : '⚪ Aguardando...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {step === 'identify' ? (
        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 dark:text-blue-400">
              <User className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white">Identificação</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Confirme seus dados para iniciar.</p>
          </div>

          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">Nome Completo</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  placeholder="Seu nome"
                  value={identity.name}
                  onChange={e => setIdentity({ ...identity, name: e.target.value })}
                />
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">Bloco</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    placeholder="Ex: A"
                    value={identity.block}
                    onChange={e => setIdentity({ ...identity, block: e.target.value })}
                  />
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">Apto/Unid.</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    placeholder="Ex: 101"
                    value={identity.unit}
                    onChange={e => setIdentity({ ...identity, unit: e.target.value })}
                  />
                  <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all mt-2">
              Iniciar Conversa
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Chat Info Strip */}
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 px-4 py-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Bl {identity.block} - Apt {identity.unit}</span>
            <span className="font-mono bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1 rounded">{traceKey.split('-').slice(0, 2).join('-')}...</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[300px] bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-bl-none'
                  }`}>
                  <p>{msg.text}</p>
                  <span className={`text-[10px] block mt-1 opacity-70 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              placeholder="Digite sua mensagem..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-2 rounded-full shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatWidget;