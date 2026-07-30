import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IncomeKPIs } from '../components/IncomeKPIs';
import { IncomeTable } from '../components/IncomeTable';
import { IncomeDrawer } from '../components/IncomeDrawer';
import { IncomeImportModal } from '../components/IncomeImportModal';
import { IncomePaymentModal } from '../components/IncomePaymentModal';
import type { IncomeRecord } from '../types';
import { incomeApi } from '../api';
import { expensesApi } from '../../expenses/api';
import { accountsApi } from '../../accounts/api';

import { useRegion } from '../../../core/contexts/RegionContext';
import { useNotifications } from '../../../core/contexts/NotificationContext';
import { useAuth } from '../../../core/contexts/AuthContext';

export function IncomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { region } = useRegion();
  const { checkSystemAlerts, addNotification } = useNotifications();
  const { user } = useAuth();
  const [data, setData] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IncomeRecord | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<IncomeRecord | null>(null);

  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [kpiFilter, setKpiFilter] = useState<'all' | 'pending' | 'overdue'>('all');
  const [kpiCurrencyFilter, setKpiCurrencyFilter] = useState<'all' | 'USD' | 'SAR' | 'TRY' | 'EUR'>('all');

  const [kpiData, setKpiData] = useState<IncomeRecord[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    let incomes = await incomeApi.getAll();
    let expenses = await expensesApi.getAll();
    
    if (region !== 'all') {
      incomes = incomes.filter(inc => inc.region === region);
      expenses = expenses.filter(exp => exp.region === region);
    }
    setData(incomes);
    setKpiData(incomes);
    setTotalExpenses(expenses.reduce((sum, item) => sum + (item.amount || 0), 0));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [region]);

  const handleSaveIncome = async (newRecord: Partial<IncomeRecord>) => {
    if (editingRecord) {
      const updated = await incomeApi.update(editingRecord.id, newRecord);
      if (updated) {
        setData(prev => prev.map(item => item.id === editingRecord.id ? updated : item));
        setIsDrawerOpen(false);
        setEditingRecord(null);
      }
    } else {
      const created = await incomeApi.create(newRecord);
      if (created) {
        // Kasa entegrasyonu (yeni kayıtta peşinat varsa)
        if (newRecord.paidAmount && newRecord.paidAmount > 0 && newRecord.accountId) {
          const accs = await accountsApi.getAll();
          const acc = accs.find(a => a.id === newRecord.accountId);
          if (acc) {
            await accountsApi.update(acc.id, { balance: acc.balance + newRecord.paidAmount });
          }
        }
        setData(prev => [created, ...prev]);
        setIsDrawerOpen(false);
        checkSystemAlerts();
        
        if (user?.role === 'editor') {
          addNotification({
            title: t('income.newIncomeAdded', 'Yeni Gelir Eklendi'),
            message: t('income.newIncomeAddedDesc', '{{name}} sisteme bir gelir faturası ekledi.{{invoice}}', { name: user.name, invoice: created.invoiceNo ? ` (Belge: ${created.invoiceNo})` : '' }),
            type: 'info',
            link: '/income',
            related_id: created.id
          });
        }
      }
    }
  };

  const handleDeleteIncome = async (item: IncomeRecord) => {
    if (window.confirm(t('income.deleteIncomeConfirm', '{{name}} isimli müşteriye ait bu gelir kaydını silmek istediğinize emin misiniz?\n\nUyarı: Eğer bu faturaya daha önce tahsilat eklenmiş ve Kasa/Banka bakiyesi artırılmışsa, faturayı sildiğinizde Kasa bakiyesi GERİ ALINMAZ. Kasa bakiyesini manuel olarak düzeltmeniz gerekir.', { name: item.companyName }))) {
      const success = await incomeApi.delete(item.id);
      if (success) {
        setData(prev => prev.filter(r => r.id !== item.id));
      }
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    const success = await incomeApi.deleteMultiple(ids);
    if (success) {
      setData(prev => prev.filter(r => !ids.includes(r.id)));
    }
  };

  const handleMoveToExpense = async (item: IncomeRecord) => {
    if (window.confirm(t('income.moveToExpenseConfirm', '{{name}} isimli bu gelir kaydını GİDER olarak değiştirmek istediğinize emin misiniz?', { name: item.companyName }))) {
      const expenseData = {
        date: item.date,
        dueDate: item.dueDate,
        payee: item.companyName,
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
      
      const created = await expensesApi.create(expenseData as any);
      if (created) {
        await incomeApi.delete(item.id);
        setData(prev => prev.filter(r => r.id !== item.id));
        checkSystemAlerts();
      }
    }
  };

  const handleImportSuccess = async (records: Partial<IncomeRecord>[]) => {
    const accs = await accountsApi.getAll();
    
    for (const rec of records) {
      if (rec.account && !rec.accountId) {
        const foundAcc = accs.find(a => a.name.toLowerCase() === rec.account?.toLowerCase());
        if (foundAcc) {
          rec.accountId = foundAcc.id;
        }
      }
      
      rec.createdBy = user?.name ? `${user.name} (Excel)` : t('common.systemExcel', 'Sistem (Excel)');

      const created = await incomeApi.create(rec);
      if (created) {
        if (rec.paidAmount && rec.paidAmount > 0 && rec.accountId) {
          const acc = accs.find(a => a.id === rec.accountId);
          if (acc) {
            await accountsApi.update(acc.id, { balance: acc.balance + rec.paidAmount });
            // Update the local array so subsequent updates see the new balance
            acc.balance += rec.paidAmount;
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
    const newStatus = newPaidAmount >= record.amount ? 'completed' : record.status;
    
    const newHistoryEntry = { amount: addedAmount, method: method as any, date, notes, accountId };
    const newPaymentHistory = [...(record.paymentHistory || []), newHistoryEntry];

    const updated = await incomeApi.update(recordId, { 
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
          await accountsApi.update(accountId, { balance: acc.balance + finalAmount });
        }
      }

      setData(prev => prev.map(item => item.id === recordId ? updated : item));
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord(updated);
      }
      setPaymentRecord(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>{t('income.title')}</h1>
        <p className="text-muted">{t('income.subtitle')}</p>
      </div>

      <IncomeKPIs 
        data={kpiData} 
        netProfit={data.reduce((sum, item) => sum + (item.amount || 0), 0) - totalExpenses} 
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
          <IncomeTable 
            data={data}
            kpiFilter={kpiFilter}
            kpiCurrencyFilter={kpiCurrencyFilter}
            onDataFiltered={setKpiData} 
            onAddNew={() => { setEditingRecord(null); setIsDrawerOpen(true); }} 
            onImportClick={() => setIsImportModalOpen(true)}
            onRowClick={(item) => navigate(`/income/${item.id}`)}
            onPaymentClick={(item) => setPaymentRecord(item)}
            onEditClick={(item) => { setEditingRecord(item); setIsDrawerOpen(true); }}
            onDeleteClick={handleDeleteIncome}
            onMoveClick={handleMoveToExpense}
            onDeleteMultiple={handleDeleteMultiple}
          />
        )}
      </div>

      <IncomeDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => { setIsDrawerOpen(false); setEditingRecord(null); }} 
        onSave={handleSaveIncome}
        initialData={editingRecord}
      />

      <IncomeImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSuccess}
      />


      <IncomePaymentModal
        isOpen={!!paymentRecord}
        onClose={() => setPaymentRecord(null)}
        record={paymentRecord}
        onSavePayment={handleSavePayment}
      />

      <div className="help-guide" style={{
        marginTop: '32px',
        padding: '20px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          {t('common.userGuide', 'Kullanım Kılavuzu')}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <strong>{t('income.invoiceDate', 'Fatura Tarihi')}:</strong> {t('income.invoiceDateInfo', 'İşlemin gerçekleştiği ve faturanın kesildiği asıl tarihtir. Muhasebesel dönem hesaplamalarında bu tarih baz alınır.')} <br/>
          <strong>{t('income.dueDate', 'Son Ödeme Tarihi')}:</strong> {t('income.dueDateInfo', 'Karşı tarafın ödemeyi yapması için tanınan son gündür. Bu tarih geçtiğinde, faturanın durumu otomatik olarak Gecikmiş olarak işaretlenir ve riskli alacaklar listesine dahil edilir.')}
        </p>
      </div>
    </>
  );
}
