import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseKPIs } from '../components/ExpenseKPIs';
import { ExpenseDrawer } from '../components/ExpenseDrawer';
import { ExpenseImportModal } from '../components/ExpenseImportModal';
import { ExpensePaymentModal } from '../components/ExpensePaymentModal';
import type { ExpenseRecord } from '../types';
import { expensesApi } from '../api';
import { incomeApi } from '../../income/api';
import { accountsApi } from '../../accounts/api';

import { useRegion } from '../../../core/contexts/RegionContext';
import { useNotifications } from '../../../core/contexts/NotificationContext';
import { useAuth } from '../../../core/contexts/AuthContext';

export function ExpensesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { region } = useRegion();
  const { checkSystemAlerts, addNotification } = useNotifications();
  const { user } = useAuth();
  const [data, setData] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<ExpenseRecord | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<ExpenseRecord | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);

  const [totalIncome, setTotalIncome] = useState(0);
  const [kpiFilter, setKpiFilter] = useState<'all' | 'pending' | 'overdue'>('all');
  const [kpiCurrencyFilter, setKpiCurrencyFilter] = useState<'all' | 'USD' | 'SAR' | 'TRY' | 'EUR'>('all');
  const [kpiData, setKpiData] = useState<ExpenseRecord[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    let expenses = await expensesApi.getAll();
    let incomes = await incomeApi.getAll();
    
    if (region !== 'all') {
      expenses = expenses.filter(exp => exp.region === region);
      incomes = incomes.filter(inc => inc.region === region);
    }
    setData(expenses);
    setKpiData(expenses);
    setTotalIncome(incomes.reduce((sum, item) => sum + (item.amount || 0), 0));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [region]);

  const handleSaveExpense = async (newRecord: Partial<ExpenseRecord>) => {
    if (editingRecord) {
      const updated = await expensesApi.update(editingRecord.id, newRecord);
      if (updated) {
        setData(prev => prev.map(item => item.id === editingRecord.id ? updated : item));
        setIsDrawerOpen(false);
        setEditingRecord(null);
      }
    } else {
      const catStr = (newRecord.category || '').toLowerCase();
      if ((catStr.includes('avans') || catStr.includes('personel ödemesi')) && newRecord.date && newRecord.companyId) {
        const targetMonthStr = String(new Date(newRecord.date).getMonth() + 1).padStart(2, '0');
        const targetYear = new Date(newRecord.date).getFullYear();
        const startOfMonth = `${targetYear}-${targetMonthStr}-01`;
        const endOfMonthDate = new Date(targetYear, new Date(newRecord.date).getMonth() + 1, 0);
        const endOfMonth = `${targetYear}-${targetMonthStr}-${String(endOfMonthDate.getDate()).padStart(2, '0')}`;
        
        const existingAccrual = data.find(exp => 
          exp.companyId === newRecord.companyId && 
          (exp.category || '').toLowerCase().includes('maaş') &&
          exp.date >= startOfMonth && exp.date <= endOfMonth
        );

        if (existingAccrual) {
          const newPayment = {
            id: Date.now().toString(),
            amount: newRecord.amount || 0,
            date: newRecord.date,
            method: 'cash',
            notes: newRecord.description || t('expenses.personnelAdvancePayment', 'Personel Avans / Ödeme')
          };
          
          const newHistory = [...(existingAccrual.paymentHistory || []), newPayment];
          const newPaidAmount = (existingAccrual.paidAmount || 0) + newPayment.amount;
          const newStatus = newPaidAmount >= (existingAccrual.amount || 0) ? 'completed' : 'pending';

          const updated = await expensesApi.update(existingAccrual.id, {
            paymentHistory: newHistory,
            paidAmount: newPaidAmount,
            status: newStatus
          });

          if (updated) {
            // Apply account integration if an account was selected for the advance
            if (newRecord.accountId && newPayment.amount > 0) {
              const accs = await accountsApi.getAll();
              const acc = accs.find(a => a.id === newRecord.accountId);
              if (acc) {
                await accountsApi.update(acc.id, { balance: acc.balance - newPayment.amount });
              }
            }
            setData(prev => prev.map(item => item.id === existingAccrual.id ? updated : item));
            setIsDrawerOpen(false);
            return;
          }
        }
      }

      const created = await expensesApi.create(newRecord);
      if (created) {
        // Kasa entegrasyonu (yeni kayıtta peşin ödeme varsa)
        if (newRecord.paidAmount && newRecord.paidAmount > 0 && newRecord.accountId) {
          const accs = await accountsApi.getAll();
          const acc = accs.find(a => a.id === newRecord.accountId);
          if (acc) {
            await accountsApi.update(acc.id, { balance: acc.balance - newRecord.paidAmount });
          }
        }
        setData(prev => [created, ...prev]);
        setIsDrawerOpen(false);
        checkSystemAlerts();
        
        if (user?.role === 'editor') {
          addNotification({
            title: t('expenses.newInvoiceAdded', 'Yeni Fatura Eklendi'),
            message: `${user.name} ${t('expenses.newInvoiceMessage', 'sisteme bir gider faturası ekledi.')}${created.invoiceNo ? ` (${t('common.document', 'Belge')}: ${created.invoiceNo})` : ''}`,
            type: 'info',
            link: '/expenses',
            related_id: created.id
          });
        }
      }
    }
  };

  const handleDeleteExpense = async (item: ExpenseRecord) => {
    if (window.confirm(t('expenses.deleteConfirm', '{{supplier}} isimli tedarikçiye ait bu gider kaydını silmek istediğinize emin misiniz?\n\nUyarı: Eğer bu faturaya daha önce ödeme eklenmiş ve Kasa/Banka bakiyesi düşülmüşse, faturayı sildiğinizde Kasa bakiyesi GERİ ALINMAZ. Kasa bakiyesini manuel olarak düzeltmeniz gerekir.', { supplier: item.supplierName }))) {
      const success = await expensesApi.delete(item.id);
      if (success) {
        setData(prev => prev.filter(r => r.id !== item.id));
      }
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    const success = await expensesApi.deleteMultiple(ids);
    if (success) {
      setData(prev => prev.filter(r => !ids.includes(r.id)));
    }
  };

  const handleMoveToIncome = async (item: ExpenseRecord) => {
    if (window.confirm(t('expenses.moveToIncomeConfirm', '{{payee}} isimli bu gider kaydını GELİR olarak değiştirmek istediğinize emin misiniz?', { payee: item.payee }))) {
      const incomeData = {
        date: item.date,
        dueDate: item.dueDate,
        companyName: item.payee,
        category: item.category,
        amount: item.amount,
        paidAmount: item.paidAmount,
        currency: item.currency,
        status: item.status,
        description: item.description,
        invoiceNo: item.invoiceNo,
        systemNo: item.systemNo,
        region: item.region,
        accountId: item.accountId
      };
      
      const created = await incomeApi.create(incomeData as any);
      if (created) {
        await expensesApi.delete(item.id);
        setData(prev => prev.filter(r => r.id !== item.id));
        checkSystemAlerts();
      }
    }
  };

  const handleImportSuccess = async (records: Partial<ExpenseRecord>[]) => {
    const accs = await accountsApi.getAll();

    for (const rec of records) {
      if (rec.account && !rec.accountId) {
        const foundAcc = accs.find(a => a.name.toLowerCase() === rec.account?.toLowerCase());
        if (foundAcc) {
          rec.accountId = foundAcc.id;
        }
      }
      
      rec.createdBy = user?.name ? `${user.name} (${t('common.excel', 'Excel')})` : `${t('common.system', 'Sistem')} (${t('common.excel', 'Excel')})`;

      const created = await expensesApi.create(rec);
      if (created) {
        if (rec.paidAmount && rec.paidAmount > 0 && rec.accountId) {
          const acc = accs.find(a => a.id === rec.accountId);
          if (acc) {
            await accountsApi.update(acc.id, { balance: acc.balance - rec.paidAmount });
            acc.balance -= rec.paidAmount;
          }
        }
      }
    }
    loadData();
    setIsImportModalOpen(false);
  };

  const handleSavePayment = async (recordId: string, addedAmount: number, method: string, date: string, notes: string, accountId?: string, exchangeRate?: number, payer?: string, payee?: string) => {
    const record = data.find(r => r.id === recordId);
    if (!record) return;

    const newPaidAmount = (record.paidAmount || 0) + addedAmount;
    const isFullyPaid = newPaidAmount >= record.amount;
    const newStatus = isFullyPaid ? 'completed' : record.status;

    const newHistoryEntry = { amount: addedAmount, method: method as any, date, notes, accountId };
    const newPaymentHistory = [...(record.paymentHistory || []), newHistoryEntry];

    const updated = await expensesApi.update(recordId, { 
      paidAmount: newPaidAmount, 
      status: newStatus as any,
      paymentHistory: newPaymentHistory,
      ...(accountId ? { accountId } : {}),
      ...(payer ? { payer } : {}),
      ...(payee ? { payee } : {})
    });

    if (updated) {
      if (accountId) {
        const accs = await accountsApi.getAll();
        const acc = accs.find(a => a.id === accountId);
        if (acc) {
          const finalAmount = exchangeRate ? addedAmount * exchangeRate : addedAmount;
          await accountsApi.update(accountId, { balance: acc.balance - finalAmount });
        }
      }

      setData(prev => prev.map(item => item.id === recordId ? updated : item));
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord(updated);
      }
      setIsPaymentModalOpen(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>{t('expenses.title', 'Giderler')}</h1>
          <p className="text-muted">{t('expenses.description', 'Şirket giderlerini, tedarikçi borçlarını ve personelleri takip edin.')}</p>
        </div>
      </div>

      <ExpenseKPIs 
        data={kpiData} 
        totalIncome={totalIncome} 
        activeFilter={kpiFilter}
        activeCurrencyFilter={kpiCurrencyFilter}
        onFilterClick={(f, c) => {
          setKpiFilter(f);
          if (c) setKpiCurrencyFilter(c);
        }}
      />

      <div style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading', 'Yükleniyor...')}</div>
        ) : (
          <ExpenseTable 
            data={data} 
            kpiFilter={kpiFilter}
            kpiCurrencyFilter={kpiCurrencyFilter}
            onDataFiltered={setKpiData}
            onAddNew={() => { setEditingRecord(null); setIsDrawerOpen(true); }}
            onImportClick={() => setIsImportModalOpen(true)}
            onRowClick={(item) => navigate(`/expenses/${item.id}`)}
            onPaymentClick={(item) => { setPaymentRecord(item); setIsPaymentModalOpen(true); }}
            onEditClick={(item) => { setEditingRecord(item); setIsDrawerOpen(true); }}
            onDeleteClick={handleDeleteExpense}
            onMoveClick={handleMoveToIncome}
            onDeleteMultiple={handleDeleteMultiple}
          />
        )}
      </div>

      <ExpenseDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => { setIsDrawerOpen(false); setEditingRecord(null); }}
        onSave={handleSaveExpense}
        initialData={editingRecord}
      />

      <ExpenseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSuccess}
      />

      <ExpensePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        record={paymentRecord}
        onSavePayment={handleSavePayment}
      />
    </div>
  );
}
