import React, { useState, useMemo } from 'react';
import { User, UserRole, Bill } from '../types';
import { DollarSign, CheckCircle2, AlertCircle, Clock, Building, Plus, FileText, Calendar, Search, Eye, Download, X, Wallet } from 'lucide-react';
import BillModal from './BillModal';
import { api } from '../services/api';
import { createPortal } from 'react-dom';
import { pdfService } from '../services/pdfService';
import { BrandContext } from '../BrandContext';
import { useContext } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import Skeleton from './ui/Skeleton';

// PDF Viewer Mock Component
const PDFViewerModal = ({ bill, users, brandConfig, onClose }: { bill: Bill, users: User[], brandConfig: any, onClose: () => void }) => {
  return createPortal(
    <div className="fixed inset-0 z-[80] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block w-full max-w-2xl p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-sm sm:my-8 sm:align-middle relative animate-in zoom-in-95">
          <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-bold">Visualização da Fatura - {bill.description}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const user = users.find(u => u.id === bill.userId);
                  if (user) {
                    pdfService.generateBillPDF(bill, user, brandConfig);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center"
              >
                <Download className="w-3 h-3 mr-1.5" /> Baixar PDF
              </button>
              <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-8 bg-white text-slate-800 h-[600px] overflow-y-auto">
            <div className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-8 h-8 text-slate-800" />
                  <h1 className="text-2xl font-bold uppercase tracking-widest">GestorCondo</h1>
                </div>
                <p className="text-xs text-slate-500">CNPJ: 00.000.000/0001-99</p>
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
                <tr className="font-bold text-lg">
                  <td className="py-4 text-right pr-4">TOTAL</td>
                  <td className="py-4 text-right">R$ {bill.value.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const FinancialModule: React.FC = () => {
  const { config } = useContext(BrandContext);
  const { currentUser } = useAuthStore();
  const { users, bills, addBill, fetchMoreUsers, fetchMoreBills } = useDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'residents' | 'bills'>('residents');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBillForPDF, setSelectedBillForPDF] = useState<Bill | null>(null);

  if (!currentUser) return null;

  const isResident = currentUser.role === UserRole.RESIDENT;
  const isAdminOrSyndic = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SYNDIC;

  const userBillsList = useMemo(() => {
    if (isResident) {
      return bills.data.filter(b => b.userId === currentUser.id);
    }
    return bills.data;
  }, [bills.data, isResident, currentUser]);

  const residents = useMemo(() => users.data.filter(u => u.role === UserRole.RESIDENT), [users.data]);

  const totalPendingValue = useMemo(() => {
    return userBillsList.reduce((acc, bill) => {
      if (bill.status !== 'PAID') return acc + bill.value;
      return acc;
    }, 0);
  }, [userBillsList]);

  const handleSendBill = async (billData: Omit<Bill, 'id' | 'status'>) => {
    await addBill(billData);
    setActiveTab('bills');

    const targetUser = users.data.find(u => u.id === billData.userId);
    if (targetUser && targetUser.condominiumId) {
      await api.createNotification({
        condominiumId: targetUser.condominiumId,
        userId: targetUser.id,
        title: 'Novo Lançamento Financeiro',
        message: `Um novo boleto (${billData.description}) no valor de R$ ${billData.value.toFixed(2)} foi lançado.`,
        type: 'INFO'
      });
    }
    setIsModalOpen(false);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Em Dia
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Vencido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" /> Aberto
          </span>
        );
    }
  };

  const filteredBills = userBillsList.filter(bill => {
    const user = users.data.find(u => u.id === bill.userId);
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
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className={`px-4 py-2 rounded-xl border ${totalPendingValue > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100'}`}>
            <p className="text-xs font-bold uppercase">{isResident ? 'Total a Pagar' : 'Inadimplência Total'}</p>
            <p className="text-2xl font-bold">R$ {totalPendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          {isAdminOrSyndic && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Cobrança
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {isAdminOrSyndic ? (
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button onClick={() => setActiveTab('residents')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'residents' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'}`}>Moradores</button>
            <button onClick={() => setActiveTab('bills')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'bills' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'}`}>Cobranças</button>
          </div>
        ) : <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Histórico</div>}

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 dark:border-slate-700 overflow-hidden">
        {activeTab === 'residents' && isAdminOrSyndic ? (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Morador</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Unidade</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {useDataStore().isLoading && residents.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 flex items-center">
                        <Skeleton variant="circle" className="h-8 w-8 mr-3" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    </tr>
                  ))
                ) : residents.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-slate-200 mr-3 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.unitId || 'N/A'}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.financialStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.page < users.totalPages && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                <button onClick={fetchMoreUsers} disabled={users.isLoadingMore} className="text-blue-600 font-bold text-sm disabled:opacity-50">
                  {users.isLoadingMore ? 'Carregando...' : 'Carregar Mais Moradores'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {useDataStore().isLoading && filteredBills.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-4 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{bill.description}</div>
                      <div className="text-xs text-slate-500">{new Date(bill.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">R$ {bill.value.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedBillForPDF(bill)} className="text-slate-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bills.page < bills.totalPages && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                <button onClick={fetchMoreBills} disabled={bills.isLoadingMore} className="text-blue-600 font-bold text-sm disabled:opacity-50">
                  {bills.isLoadingMore ? 'Carregando...' : 'Carregar Mais Cobranças'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BillModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSend={handleSendBill} users={users.data} />
      {selectedBillForPDF && <PDFViewerModal bill={selectedBillForPDF} users={users.data} brandConfig={config} onClose={() => setSelectedBillForPDF(null)} />}
    </div>
  );
};


export default FinancialModule;