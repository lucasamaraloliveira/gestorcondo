import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Bill } from '../types';
import { DollarSign, CheckCircle2, AlertCircle, Clock, Building, Plus, FileText, User as UserIcon, Calendar, Search, Eye, Download, X, Wallet } from 'lucide-react';
import BillModal from './BillModal';
import { api } from '../services/api';
import { createPortal } from 'react-dom';

interface FinancialModuleProps {
  users: User[];
  currentUser?: User; // Pass current user to check permissions
}

// PDF Viewer Mock Component
const PDFViewerModal = ({ bill, onClose }: { bill: Bill, onClose: () => void }) => {
    return createPortal(
        <div className="fixed inset-0 z-[80] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={onClose}></div>
                <div className="inline-block w-full max-w-2xl p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-sm sm:my-8 sm:align-middle relative animate-in zoom-in-95">
                    {/* Header Toolbar */}
                    <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                         <div className="flex items-center gap-2">
                             <FileText className="w-5 h-5" />
                             <span className="font-bold">Visualização da Fatura - {bill.description}</span>
                         </div>
                         <div className="flex gap-2">
                             <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center">
                                 <Download className="w-3 h-3 mr-1.5" /> Baixar PDF
                             </button>
                             <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded">
                                 <X className="w-5 h-5" />
                             </button>
                         </div>
                    </div>

                    {/* Paper Mockup */}
                    <div className="p-8 bg-white text-slate-800 h-[600px] overflow-y-auto">
                         <div className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
                             <div>
                                 <div className="flex items-center gap-2 mb-2">
                                     <Building className="w-8 h-8 text-slate-800" />
                                     <h1 className="text-2xl font-bold uppercase tracking-widest">GestorCondo</h1>
                                 </div>
                                 <p className="text-xs text-slate-500">CNPJ: 00.000.000/0001-99</p>
                                 <p className="text-xs text-slate-500">Rua Exemplo, 123 - Centro</p>
                             </div>
                             <div className="text-right">
                                 <h2 className="text-xl font-bold text-slate-800">FATURA #{bill.id.substring(1)}</h2>
                                 <p className="text-sm font-semibold mt-1">Vencimento: {new Date(bill.dueDate).toLocaleDateString()}</p>
                             </div>
                         </div>

                         <div className="mb-8 p-4 bg-slate-50 rounded border border-slate-200">
                             <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pagador</p>
                             <p className="font-bold text-lg">Unidade: {bill.userId === 'u3' ? '101 - Bloco A' : 'N/D'}</p>
                             <p className="text-sm text-slate-600">Referência: {bill.description}</p>
                         </div>

                         <table className="w-full mb-8">
                             <thead className="border-b border-slate-300">
                                 <tr>
                                     <th className="text-left py-2 text-sm font-bold text-slate-600">Descrição</th>
                                     <th className="text-right py-2 text-sm font-bold text-slate-600">Valor</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr>
                                     <td className="py-3 text-sm border-b border-slate-100">{bill.description}</td>
                                     <td className="py-3 text-sm border-b border-slate-100 text-right">R$ {bill.value.toFixed(2)}</td>
                                 </tr>
                                 <tr>
                                     <td className="py-3 text-sm border-b border-slate-100">Fundo de Reserva (5%)</td>
                                     <td className="py-3 text-sm border-b border-slate-100 text-right">R$ {(bill.value * 0.05).toFixed(2)}</td>
                                 </tr>
                                 <tr className="font-bold text-lg">
                                     <td className="py-4 text-right pr-4">TOTAL</td>
                                     <td className="py-4 text-right">R$ {(bill.value * 1.05).toFixed(2)}</td>
                                 </tr>
                             </tbody>
                         </table>

                         <div className="border-t-2 border-dashed border-slate-300 pt-6">
                             <p className="text-center text-xs text-slate-400 mb-2">Corte na linha pontilhada</p>
                             <div className="bg-slate-100 p-4 border border-slate-300 rounded">
                                 <div className="flex justify-between items-center mb-2">
                                     <span className="font-bold text-sm">Banco Gestor</span>
                                     <span className="font-mono text-sm">{bill.barCode}</span>
                                 </div>
                                 <div className="h-12 bg-slate-800 w-full mb-2">
                                     {/* Fake Barcode Visual */}
                                     <div className="w-full h-full flex justify-between px-2">
                                         {Array.from({length: 40}).map((_, i) => (
                                             <div key={i} className={`h-full ${Math.random() > 0.5 ? 'w-1 bg-white' : 'w-2 bg-white'}`}></div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const FinancialModule: React.FC<FinancialModuleProps> = ({ users, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [activeTab, setActiveTab] = useState<'residents' | 'bills'>('residents');
  const [searchTerm, setSearchTerm] = useState('');
  
  // PDF Viewer State
  const [selectedBillForPDF, setSelectedBillForPDF] = useState<Bill | null>(null);

  const isResident = currentUser?.role === UserRole.RESIDENT;
  const isAdminOrSyndic = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.SYNDIC;

  // Fetch bills based on role
  useEffect(() => {
      const fetchBills = async () => {
          const allBills = await api.getAllBills();
          if (isResident && currentUser) {
              // Moradores veem apenas seus boletos
              setBills(allBills.filter(b => b.userId === currentUser.id));
              setActiveTab('bills'); // Força aba de boletos
          } else {
              // Admin vê todos
              setBills(allBills);
          }
      };
      fetchBills();
  }, [currentUser, isResident]);

  // Only show residents in the financial list (User Filter)
  const residents = users.filter(u => u.role === UserRole.RESIDENT);

  // Calcula total pendente
  const totalPendingValue = useMemo(() => {
      // Como 'bills' já é filtrado pelo useEffect para moradores, o reduce funciona para ambos os casos
      return bills.reduce((acc, bill) => {
          if (bill.status !== 'PAID') return acc + bill.value;
          return acc;
      }, 0);
  }, [bills]);

  const handleSendBill = async (billData: Omit<Bill, 'id' | 'status'>) => {
      const newBill = await api.createBill(billData);
      // Add to list and switch view
      setBills(prev => [newBill, ...prev]);
      setActiveTab('bills');
      
      // Enviar notificação individual para o morador
      const targetUser = users.find(u => u.id === billData.userId);
      if (targetUser && targetUser.condominiumId) {
          await api.createNotification({
              condominiumId: targetUser.condominiumId,
              userId: targetUser.id,
              title: 'Novo Lançamento Financeiro',
              message: `Um novo boleto (${billData.description}) no valor de R$ ${billData.value.toFixed(2)} foi lançado para sua unidade.`,
              type: 'INFO'
          });
      }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Em Dia
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Aberto
          </span>
        );
    }
  };

  const getBillStatusBadge = (status: 'OPEN' | 'PAID' | 'LATE') => {
      switch (status) {
        case 'PAID':
            return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Pago</span>;
        case 'LATE':
            return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Atrasado</span>;
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Em Aberto</span>;
      }
  };

  const filteredBills = bills.filter(bill => {
      const user = users.find(u => u.id === bill.userId);
      const searchLower = searchTerm.toLowerCase();
      return (
          bill.description.toLowerCase().includes(searchLower) ||
          (user && user.name.toLowerCase().includes(searchLower)) ||
          bill.value.toString().includes(searchLower)
      );
  });

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/60 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            {isResident ? <Wallet className="w-6 h-6 mr-2 text-emerald-600" /> : <DollarSign className="w-6 h-6 mr-2 text-emerald-600" />}
            {isResident ? 'Meus Boletos' : 'Gestão Financeira'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isResident ? 'Acompanhe seus pagamentos e faturas em aberto.' : 'Controle de adimplência e emissão de cobranças.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
           {/* Card de Resumo (Diferente para Admin e Morador) */}
           <div className={`hidden md:block px-4 py-2 rounded-xl border ${totalPendingValue > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50'}`}>
              <p className={`text-xs font-bold uppercase ${totalPendingValue > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isResident ? 'Total a Pagar' : 'Inadimplência Total'}
              </p>
              <p className={`text-2xl font-bold ${totalPendingValue > 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  R$ {totalPendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
           </div>
           
           {isAdminOrSyndic && (
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 active:scale-95 whitespace-nowrap"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Nova Cobrança
               </button>
           )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Se for Admin/Síndico, mostra as abas. Se for Morador, não mostra (apenas busca). */}
          {isAdminOrSyndic ? (
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                  <button 
                    onClick={() => setActiveTab('residents')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'residents' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                  >
                      Visão Geral (Moradores)
                  </button>
                  <button 
                    onClick={() => setActiveTab('bills')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bills' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                  >
                      Lançamentos (Cobranças)
                  </button>
              </div>
          ) : (
              <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Histórico de Lançamentos</div>
          )}

          {activeTab === 'bills' && (
              <div className="relative w-full sm:w-64">
                  <input 
                    type="text" 
                    placeholder="Buscar cobrança..." 
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
          )}
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white/60 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'residents' && isAdminOrSyndic ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Morador</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unidade</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bloco</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Geral</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Último Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {residents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhum morador encontrado para este condomínio.</td>
                    </tr>
                  ) : residents.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xs mr-3">
                             {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.unitId || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{user.block || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.financialStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">
                        {user.financialStatus === 'PAID' ? '10/05/2023' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                    {!isResident && <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Morador / Pagador</th>}
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          {isResident ? 'Você não possui boletos registrados.' : 'Nenhuma cobrança encontrada.'}
                      </td>
                    </tr>
                  ) : filteredBills.map((bill) => {
                    const billUser = users.find(u => u.id === bill.userId);
                    return (
                        <tr key={bill.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors animate-in fade-in">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${bill.type === 'CONDO' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">{bill.description}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{bill.type === 'CONDO' ? 'Taxa Condominial' : bill.type === 'RESERVATION' ? 'Reserva' : 'Outros'}</div>
                                </div>
                            </div>
                          </td>
                          {!isResident && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {billUser ? (
                                        <>
                                            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 mr-2">
                                                {billUser.name.charAt(0)}
                                            </div>
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{billUser.name}</span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Usuário removido</span>
                                    )}
                                </div>
                              </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                {new Date(bill.dueDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                                R$ {bill.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-3">
                            {getBillStatusBadge(bill.status)}
                            <button 
                                onClick={() => setSelectedBillForPDF(bill)}
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                title="Visualizar Fatura"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
          )}
        </div>
      </div>

      <BillModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={handleSendBill}
        users={users}
      />

      {selectedBillForPDF && (
          <PDFViewerModal 
            bill={selectedBillForPDF}
            onClose={() => setSelectedBillForPDF(null)}
          />
      )}
    </div>
  );
};

export default FinancialModule;