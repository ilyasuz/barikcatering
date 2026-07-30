import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Calendar, ArrowUpRight, ArrowDownRight, Landmark, Building, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';
import { accountsApi } from '../api';
import { incomeApi } from '../../income/api';
import { expensesApi } from '../../expenses/api';
import { supabase } from '../../../lib/supabase';
import type { AccountRecord } from '../types';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { StatusBadge } from '../../../core/components/Typography/StatusBadge';
import { type PrintColumn } from '../../../core/components/Print/OfficialPrintDocument';
import { PrintPreviewModal } from '../../../core/components/Print/PrintPreviewModal';
import '../../../core/components/DataTable/DataTable.css';

interface Transaction {
  id: string;
  date: string; // ISO string for sorting
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out';
  description: string;
  amount: number;
  currency: string;
  refId?: string; // Reference to original record
}

export function AccountDetailPage() {
  const { baseName } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [accountGroup, setAccountGroup] = useState<import('../types').AccountGroup | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer_in' | 'transfer_out'>('income');
  
  // For daily report
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [unassignedIncomes, setUnassignedIncomes] = useState<any[]>([]);
  const [unassignedExpenses, setUnassignedExpenses] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignProgress, setAssignProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (baseName) {
      loadData(decodeURIComponent(baseName));
    }
  }, [baseName]);

  const loadData = async (bName: string) => {
    setLoading(true);
    try {
      const [accs, incomes, expenses, { data: transfers }] = await Promise.all([
        accountsApi.getAll(),
        incomeApi.getAll(),
        expensesApi.getAll(),
        supabase
          .from('transfers')
          .select(`*, source_account:accounts!transfers_source_account_id_fkey(name), target_account:accounts!transfers_target_account_id_fkey(name)`)
      ]);

      const subAccounts = accs.filter(a => a.name.replace(/ \([A-Z]{3}\)$/, '').trim() === bName);
      if (subAccounts.length > 0) {
        const referenceAcc = subAccounts[0];
        const group: import('../types').AccountGroup = {
          id: bName,
          baseName: bName,
          type: referenceAcc.type,
          region: referenceAcc.region,
          status: referenceAcc.status,
          subAccounts,
          balances: {},
          bankName: referenceAcc.bankName,
          iban: referenceAcc.iban,
          accountNumber: referenceAcc.accountNumber,
          swiftCode: referenceAcc.swiftCode
        };
        
        subAccounts.forEach(sa => {
          group.balances[sa.currency] = (group.balances[sa.currency] || 0) + sa.balance;
        });
        
        setAccountGroup(group);
        
        const txList: Transaction[] = [];
        const unassignedInc: any[] = [];
        const unassignedExp: any[] = [];
        const subAccountIds = subAccounts.map(a => a.id);
        const bNameLower = bName.toLowerCase();

        // Parse Incomes
        incomes.forEach(inc => {
          if (!inc.accountId) {
             unassignedInc.push(inc);
          }

          if (inc.paymentHistory && inc.paymentHistory.length > 0) {
            inc.paymentHistory.forEach((ph: any, idx: number) => {
              if (subAccountIds.includes(ph.accountId) || (!ph.accountId && (subAccountIds.includes(inc.accountId || '') || inc.account?.toLowerCase() === bNameLower || inc.account?.toLowerCase().startsWith(bNameLower)))) {
                txList.push({
                  id: `inc-ph-${inc.id}-${idx}`,
                  date: ph.date || inc.date,
                  type: 'income',
                  description: `${inc.companyName || t('common.unknown', 'Bilinmiyor')} - ${t('accounts.collection', 'Tahsilat')}`,
                  amount: ph.amount,
                  currency: inc.currency,
                  refId: inc.id
                });
              }
            });
          } else if ((subAccountIds.includes(inc.accountId || '') || inc.account?.toLowerCase() === bNameLower || inc.account?.toLowerCase().startsWith(bNameLower)) && (inc.paidAmount || 0) > 0) {
            txList.push({
              id: `inc-${inc.id}`,
              date: inc.date,
              type: 'income',
              description: `${inc.companyName || t('common.unknown', 'Bilinmiyor')} - ${t('accounts.incomeDesc', 'Gelir')}`,
              amount: inc.paidAmount || 0,
              currency: inc.currency,
              refId: inc.id
            });
          }
        });

        // Parse Expenses
        expenses.forEach(exp => {
          if (!exp.accountId) {
             unassignedExp.push(exp);
          }

          if (exp.paymentHistory && exp.paymentHistory.length > 0) {
            exp.paymentHistory.forEach((ph: any, idx: number) => {
              if (subAccountIds.includes(ph.accountId) || (!ph.accountId && (subAccountIds.includes(exp.accountId || '') || exp.account?.toLowerCase() === bNameLower || exp.account?.toLowerCase().startsWith(bNameLower)))) {
                txList.push({
                  id: `exp-ph-${exp.id}-${idx}`,
                  date: ph.date || exp.date,
                  type: 'expense',
                  description: `${exp.payee || t('common.unknown', 'Bilinmiyor')} - ${t('accounts.payment', 'Ödeme')}`,
                  amount: ph.amount,
                  currency: exp.currency,
                  refId: exp.id
                });
              }
            });
          } else if ((subAccountIds.includes(exp.accountId || '') || exp.account?.toLowerCase() === bNameLower || exp.account?.toLowerCase().startsWith(bNameLower)) && (exp.paidAmount || 0) > 0) {
            txList.push({
              id: `exp-${exp.id}`,
              date: exp.date,
              type: 'expense',
              description: `${exp.payee || t('common.unknown', 'Bilinmiyor')} - ${t('accounts.expenseDesc', 'Gider')}`,
              amount: exp.paidAmount || 0,
              currency: exp.currency,
              refId: exp.id
            });
          }
        });

        // Parse Transfers
        if (transfers) {
          transfers.forEach(tr => {
            if (subAccountIds.includes(tr.source_account_id)) {
              txList.push({
                id: `tr-out-${tr.id}`,
                date: tr.created_at.split('T')[0],
                type: 'transfer_out',
                description: `${t('accounts.transferDesc', 'Transfer:')} ${tr.target_account?.name || t('accounts.otherAccount', 'Diğer Kasa')}`,
                amount: tr.amount,
                currency: subAccounts.find(a => a.id === tr.source_account_id)?.currency || 'USD'
              });
            } else if (subAccountIds.includes(tr.target_account_id)) {
              txList.push({
                id: `tr-in-${tr.id}`,
                date: tr.created_at.split('T')[0],
                type: 'transfer_in',
                description: `${t('accounts.transferDesc', 'Transfer:')} ${tr.source_account?.name || t('accounts.otherAccount', 'Diğer Kasa')}`,
                amount: tr.converted_amount || tr.amount,
                currency: subAccounts.find(a => a.id === tr.target_account_id)?.currency || 'USD'
              });
            }
          });
        }

        // Sort by date descending
        txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(txList);
        setUnassignedIncomes(unassignedInc);
        setUnassignedExpenses(unassignedExp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { filteredTx, totalsByCurrency, previousDayBalances, closingBalances } = useMemo(() => {
    if (!selectedDate || !accountGroup) {
      const totals: Record<string, { in: number; out: number }> = {};
      Object.keys(accountGroup?.balances || {}).forEach(curr => { totals[curr] = { in: 0, out: 0 }; });
      transactions.forEach(t => {
        if (!totals[t.currency]) totals[t.currency] = { in: 0, out: 0 };
        if (t.type === 'income' || t.type === 'transfer_in') totals[t.currency].in += t.amount;
        else totals[t.currency].out += t.amount;
      });
      return { 
        filteredTx: transactions, 
        totalsByCurrency: totals,
        previousDayBalances: null, 
        closingBalances: null 
      };
    }

    const filtered = transactions.filter(t => t.date.startsWith(selectedDate));
    
    const totals: Record<string, { in: number; out: number }> = {};
    const afterSelectedFlow: Record<string, number> = {};
    
    Object.keys(accountGroup.balances).forEach(curr => {
      totals[curr] = { in: 0, out: 0 };
      afterSelectedFlow[curr] = 0;
    });

    transactions.forEach(t => {
      if (t.date > selectedDate) {
        if (!afterSelectedFlow[t.currency]) afterSelectedFlow[t.currency] = 0;
        if (t.type === 'income' || t.type === 'transfer_in') afterSelectedFlow[t.currency] += t.amount;
        if (t.type === 'expense' || t.type === 'transfer_out') afterSelectedFlow[t.currency] -= t.amount;
      }
    });

    filtered.forEach(t => {
      if (!totals[t.currency]) totals[t.currency] = { in: 0, out: 0 };
      if (t.type === 'income' || t.type === 'transfer_in') {
        totals[t.currency].in += t.amount;
      } else {
        totals[t.currency].out += t.amount;
      }
    });

    const prevBalances: Record<string, number> = {};
    const closeBalances: Record<string, number> = {};

    Object.entries(accountGroup.balances).forEach(([curr, currentBalance]) => {
      const flowAfter = afterSelectedFlow[curr] || 0;
      const flowToday = (totals[curr]?.in || 0) - (totals[curr]?.out || 0);
      
      const closing = currentBalance - flowAfter;
      const previous = closing - flowToday;
      
      closeBalances[curr] = closing;
      prevBalances[curr] = previous;
    });

    return { 
      filteredTx: filtered, 
      totalsByCurrency: totals,
      previousDayBalances: prevBalances,
      closingBalances: closeBalances
    };
  }, [transactions, selectedDate, accountGroup]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading', 'Yükleniyor...')}</div>;
  if (!accountGroup) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('accounts.accountNotFound', 'Kasa bulunamadı.')}</div>;

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const handleAssignUnassigned = async () => {
    if (!accountGroup || accountGroup.subAccounts.length === 0) return;
    setIsAssigning(true);
    const totalToAssign = unassignedIncomes.length + unassignedExpenses.length;
    setAssignProgress({ current: 0, total: totalToAssign });
    
    let processed = 0;
    try {
      for (const inc of unassignedIncomes) {
        const newPaidAmount = Math.max(inc.amount || 0, inc.paidAmount || 0);
        const subAccount = accountGroup.subAccounts.find(a => a.currency === inc.currency) || accountGroup.subAccounts[0];
        await incomeApi.update(inc.id, { 
          accountId: subAccount.id,
          paidAmount: newPaidAmount,
          status: newPaidAmount >= (inc.amount || 0) ? 'completed' : 'pending'
        });
        subAccount.balance += newPaidAmount;
        await accountsApi.update(subAccount.id, { balance: subAccount.balance });
        processed++;
        setAssignProgress({ current: processed, total: totalToAssign });
      }
      for (const exp of unassignedExpenses) {
        const newPaidAmount = Math.max(exp.amount || 0, exp.paidAmount || 0);
        const subAccount = accountGroup.subAccounts.find(a => a.currency === exp.currency) || accountGroup.subAccounts[0];
        await expensesApi.update(exp.id, { 
          accountId: subAccount.id,
          paidAmount: newPaidAmount,
          status: newPaidAmount >= (exp.amount || 0) ? 'completed' : 'pending'
        });
        subAccount.balance -= newPaidAmount;
        await accountsApi.update(subAccount.id, { balance: subAccount.balance });
        processed++;
        setAssignProgress({ current: processed, total: totalToAssign });
      }

      await loadData(accountGroup.baseName);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAssigning(false);
    }
  };

  const printColumns: PrintColumn<Transaction>[] = [
    { key: 'date', headerTR: 'TARİH', headerAR: 'التاريخ' },
    { 
      key: 'type', 
      headerTR: 'İŞLEM TÜRÜ', 
      headerAR: 'نوع العملية',
      render: (tx) => {
        if (tx.type === 'income') return t('accounts.incomeCollection', 'Gelir / Tahsilat');
        if (tx.type === 'expense') return t('accounts.expensePayment', 'Gider / Ödeme');
        if (tx.type === 'transfer_in') return t('accounts.incomingTransfer', 'Gelen Transfer');
        return t('accounts.outgoingTransfer', 'Giden Transfer');
      }
    },
    { key: 'description', headerTR: 'AÇIKLAMA', headerAR: 'البيان' },
    { 
      key: 'in', 
      headerTR: 'GİRİŞ (+)', 
      headerAR: 'دخول',
      render: (tx) => (tx.type === 'income' || tx.type === 'transfer_in') ? 
        new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(tx.amount) : '-'
    },
    { 
      key: 'out', 
      headerTR: 'ÇIKIŞ (-)', 
      headerAR: 'خروج',
      render: (tx) => (tx.type === 'expense' || tx.type === 'transfer_out') ? 
        new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(tx.amount) : '-'
    }
  ];

    const printHeaderNode = selectedDate && previousDayBalances ? (
      <div style={{ padding: '12px', backgroundColor: '#f3f4f6', border: '1px solid black', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold' }}>
          <div dir="rtl">رصيد اليوم السابق</div>
          <div style={{ fontSize: '12px' }}>( {t('accounts.previousDayBalance', 'Dünden Devreden Bakiye')} )</div>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontWeight: 'bold', fontSize: '18px' }}>
          {Object.entries(previousDayBalances).map(([curr, amt]) => (
            <span key={curr} style={{ whiteSpace: 'nowrap' }}>
              {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(amt)} {curr}
            </span>
          ))}
        </div>
      </div>
    ) : undefined;

  return (
    <>
    <div className="page-container screen-only">
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <button 
            onClick={() => navigate('/accounts')}
            className="btn-icon"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}
          >
            <ArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <div>
            <h1>{accountGroup.baseName}</h1>
            <p className="text-muted">{t('accounts.accountDetailAndReport', 'Kasa / Banka Detayı ve Gün Sonu Raporu')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            <span>{t('common.print', 'Yazdır')}</span>
          </button>
        </div>
      </div>

      <div className="print-header" style={{ display: 'none', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>{accountGroup.baseName} {t('accounts.report', 'Raporu')}</h2>
        <div style={{ fontSize: '14px', color: '#4B5563' }}>{t('common.date', 'Tarih')}: {selectedDate || t('accounts.allTime', 'Tüm Zamanlar')}</div>
      </div>

      {(unassignedIncomes.length > 0 || unassignedExpenses.length > 0) && (
        <div style={{ padding: '16px 24px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={24} color="#3B82F6" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('accounts.unassignedTxFound', 'Kasaya İşlenmeyen İşlemler Bulundu!')}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {t('accounts.unassignedTxInfo', 'Sistemde henüz hiçbir kasaya bağlanmamış')} <strong>{unassignedIncomes.length + unassignedExpenses.length} {t('common.items', 'adet')}</strong> {t('accounts.unassignedTxQuestion', 'işlem var. Bu işlemleri bu kasaya aktararak bakiye hesabına dahil etmek ister misiniz?')}
              </div>
            </div>
          </div>
          <button 
            className="btn-primary" 
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleAssignUnassigned}
            disabled={isAssigning}
          >
            <CheckCircle2 size={18} />
            <span>
              {isAssigning 
                ? `${t('accounts.adding', 'Ekleniyor...')} (${assignProgress.current} / ${assignProgress.total} - %${Math.round((assignProgress.current / (assignProgress.total || 1)) * 100)})` 
                : t('accounts.addToAccount', 'Bu Kasaya Ekle')}
            </span>
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Balances Cards */}
        {Object.entries(accountGroup.balances).map(([curr, amount]) => (
          <div key={curr} className="kpi-card" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="kpi-header">
              <span className="kpi-title" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{t('accounts.currentBalanceOf', 'Güncel {{curr}} Bakiyesi', { curr })}</span>
              <Landmark size={20} color="rgba(255, 255, 255, 0.9)" />
            </div>
            <div className="kpi-value" style={{ color: 'white' }}>
              <CurrencyDisplay amount={amount} currency={curr as any} />
            </div>
            <div className="kpi-trend" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              IBAN: {accountGroup.iban || t('common.notSpecified', 'Belirtilmedi')}
            </div>
          </div>
        ))}

        {/* Selected Date Filter Card */}
        <div className="kpi-card no-print" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> {t('accounts.selectReportDate', 'Rapor Tarihi Seçin (Gün Sonu Raporu)')}
          </label>
          <input 
            type="date" 
            className="form-control" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ height: '44px', fontSize: '15px' }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {t('accounts.dateFilterInfo', 'Aşağıdaki paneller ve liste bu tarihe göre filtrelenir. Tüm zamanları görmek için tarihi silin.')}
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {selectedDate ? `${selectedDate} ${t('accounts.eodReport', 'Gün Sonu Raporu')}` : t('accounts.allTimeSummary', 'Tüm Zamanların Özeti')}
      </h3>

      {selectedDate && previousDayBalances && closingBalances && (
        <div style={{ 
          backgroundColor: 'rgba(59, 130, 246, 0.05)', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '12px', 
          padding: '16px 24px', 
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('accounts.previousDayBalance', 'Dünden Devreden Bakiye')}</div>
            <div style={{ display: 'flex', gap: '16px', fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
              {Object.entries(previousDayBalances).map(([curr, amt]) => (
                <span key={curr}><CurrencyDisplay amount={amt} currency={curr as any} /></span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', textAlign: 'right' }}>{t('accounts.closingBalance', 'Günün Kapanış Bakiyesi')}</div>
            <div style={{ display: 'flex', gap: '16px', fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
              {Object.entries(closingBalances).map(([curr, amt]) => (
                <span key={curr}><CurrencyDisplay amount={amt} currency={curr as any} /></span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
          <div className="kpi-header">
            <span className="kpi-title">{t('accounts.totalCashIn', 'Toplam Kasa Girişi (Gelen)')}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight size={18} color="#10B981" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#10B981', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(totalsByCurrency).map(([curr, totals]) => (
              <div key={curr} style={{ fontSize: '20px' }}>
                <CurrencyDisplay amount={totals.in} currency={curr as any} />
              </div>
            ))}
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
          <div className="kpi-header">
            <span className="kpi-title">{t('accounts.totalCashOut', 'Toplam Kasa Çıkışı (Giden)')}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={18} color="#EF4444" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#EF4444', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(totalsByCurrency).map(([curr, totals]) => (
              <div key={curr} style={{ fontSize: '20px' }}>
                <CurrencyDisplay amount={totals.out} currency={curr as any} />
              </div>
            ))}
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(59, 130, 246, 0.2)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <div className="kpi-header">
            <span className="kpi-title">{t('accounts.netCashFlow', 'Net Nakit Akışı')}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} color="#3B82F6" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#3B82F6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(totalsByCurrency).map(([curr, totals]) => (
              <div key={curr} style={{ fontSize: '20px' }}>
                <CurrencyDisplay amount={totals.in - totals.out} currency={curr as any} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="core-table">
          <thead>
            <tr>
              <th>{t('common.date', 'Tarih')}</th>
              <th>{t('accounts.transactionType', 'İşlem Türü')}</th>
              <th>{t('accounts.description', 'Açıklama')}</th>
              <th style={{ textAlign: 'right' }}>{t('accounts.cashInLabel', 'Kasa Girişi (+)')}</th>
              <th style={{ textAlign: 'right' }}>{t('accounts.cashOutLabel', 'Kasa Çıkışı (-)')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {t('accounts.noTransactionsFound', 'Bu tarih için işlem bulunamadı.')}
                </td>
              </tr>
            ) : (
              filteredTx.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.date}</td>
                  <td>
                    {tx.type === 'income' && <StatusBadge status="completed">{t('accounts.incomeCollection', 'Gelir / Tahsilat')}</StatusBadge>}
                    {tx.type === 'expense' && <StatusBadge status="pending">{t('accounts.expensePayment', 'Gider / Ödeme')}</StatusBadge>}
                    {tx.type === 'transfer_in' && <StatusBadge status="completed">{t('accounts.incomingTransfer', 'Gelen Transfer')}</StatusBadge>}
                    {tx.type === 'transfer_out' && <StatusBadge status="overdue">{t('accounts.outgoingTransfer', 'Giden Transfer')}</StatusBadge>}
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tx.description}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {(tx.type === 'income' || tx.type === 'transfer_in') ? (
                      <span style={{ color: '#10B981', fontWeight: 600 }}>
                        + <CurrencyDisplay amount={tx.amount} currency={tx.currency as any} />
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {(tx.type === 'expense' || tx.type === 'transfer_out') ? (
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>
                        - <CurrencyDisplay amount={tx.amount} currency={tx.currency as any} />
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    
    <PrintPreviewModal
      isOpen={showPrintPreview}
      onClose={() => setShowPrintPreview(false)}
      titleTR={selectedDate ? "KASA GÜNLÜK HESAP TABLOSU" : "TÜM ZAMANLAR KASA RAPORU"}
      titleAR={selectedDate ? "حركة الصندوق اليومي" : "تقرير الصندوق لجميع الأوقات"}
      columns={printColumns}
      data={filteredTx}
      totals={Object.entries(totalsByCurrency).map(([curr, totals]) => ({ currency: curr, amount: totals.in - totals.out }))}
      totalsLabelTR={selectedDate ? "GÜNLÜK NET AKIŞ" : "NET NAKİT AKIŞI"}
      totalsLabelAR={selectedDate ? "صافي التدفق اليومي" : "صافي التدفق"}
      headerNode={printHeaderNode}
      extraTotals={selectedDate ? [
        {
          labelTR: "GÜNÜN KAPANIŞ BAKİYESİ",
          labelAR: "رصيد الصندوق اليومي",
          amounts: Object.entries(closingBalances || {}).map(([curr, amount]) => ({ currency: curr, amount }))
        },
        {
          labelTR: "GÜNCEL KASA BAKİYESİ",
          labelAR: "رصيد الصندوق الحالي",
          amounts: Object.entries(accountGroup.balances).map(([curr, amount]) => ({ currency: curr, amount }))
        }
      ] : undefined}
    />
    </>
  );
}
