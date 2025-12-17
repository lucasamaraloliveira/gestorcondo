import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, DollarSign, Calendar, FileText, UploadCloud, User as UserIcon } from 'lucide-react';
import { User, Bill } from '../types';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (bill: Omit<Bill, 'id' | 'status'>) => Promise<void>;
  users: User[];
}

const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, onSend, users }) => {
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<'CONDO' | 'FINANCING'>('CONDO');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [barCode, setBarCode] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Filter only RESIDENTS
  const residents = users.filter(u => u.role === 'RESIDENT');

  const handleBarCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é dígito e limita a 47 caracteres (padrão linha digitável boleto)
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 47);
    let formattedValue = rawValue;

    // Aplica a máscara: 00000.00000 00000.000000 00000.000000 0 00000000000000
    if (rawValue.length > 33) {
      formattedValue = `${rawValue.slice(0, 5)}.${rawValue.slice(5, 10)} ${rawValue.slice(10, 15)}.${rawValue.slice(15, 21)} ${rawValue.slice(21, 26)}.${rawValue.slice(26, 32)} ${rawValue.slice(32, 33)} ${rawValue.slice(33)}`;
    } else if (rawValue.length > 32) {
      formattedValue = `${rawValue.slice(0, 5)}.${rawValue.slice(5, 10)} ${rawValue.slice(10, 15)}.${rawValue.slice(15, 21)} ${rawValue.slice(21, 26)}.${rawValue.slice(26, 32)} ${rawValue.slice(32)}`;
    } else if (rawValue.length > 26) {
      formattedValue = `${rawValue.slice(0, 5)}.${rawValue.slice(5, 10)} ${rawValue.slice(10, 15)}.${rawValue.slice(15, 21)} ${rawValue.slice(21, 26)}.${rawValue.slice(26)}`;
    } else if (rawValue.length > 21) {
      formattedValue = `${rawValue.slice(0, 5)}.${rawValue.slice(5, 10)} ${rawValue.slice(10, 15)}.${rawValue.slice(15, 21)} ${rawValue.slice(21)}`;
    } else if (rawValue.length > 15) {
      formattedValue = `${rawValue.slice(0, 5)}.${rawValue.slice(5, 10)} ${rawValue.slice(10, 15)}.${rawValue.slice(15)}`;
    } else if (rawValue.length > 10) {
      formattedValue = `${rawValue.slice(0, 5)}.${rawValue.slice(5, 10)} ${rawValue.slice(10)}`;
    } else if (rawValue.length > 5) {
      formattedValue = `${rawValue.slice(0, 5)}.${rawValue.slice(5)}`;
    }

    setBarCode(formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSend({
        userId,
        type,
        description,
        value: parseFloat(value),
        dueDate,
        barCode,
        fileName
      });
      onClose();
      // Reset
      setUserId('');
      setValue('');
      setDueDate('');
      setBarCode('');
      setFileName('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl sm:my-8 sm:align-middle border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Nova Cobrança
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* User Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Morador / Pagador</label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white appearance-none"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                >
                  <option value="">Selecione um morador...</option>
                  {residents.map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.unitId ? `Apt ${u.unitId}` : ''}</option>
                  ))}
                </select>
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Type Toggle */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Boleto</label>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setType('CONDO')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'CONDO' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                    >
                        Condomínio
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('FINANCING')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'FINANCING' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                    >
                        Financiamento
                    </button>
                </div>
            </div>

            {/* Description & Value */}
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                    placeholder="Ex: Mensalidade Maio/2024"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                    placeholder="0,00"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimento</label>
                  <div className="relative">
                    <input
                        type="date"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                    />
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
               </div>
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código de Barras / Linha Digitável</label>
              <div className="relative">
                 <input
                    type="text"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono text-xs"
                    placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                    value={barCode}
                    onChange={handleBarCodeChange}
                 />
                 <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Mock File Upload */}
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arquivo PDF (Simulado)</label>
               <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                  />
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                     {fileName ? <span className="text-emerald-600 font-bold">{fileName}</span> : "Clique para anexar o boleto (PDF)"}
                  </p>
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
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Boleto
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

export default BillModal;