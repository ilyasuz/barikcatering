import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Mail, Phone, MapPin, 
  FileText, Briefcase, Globe, Wallet
} from 'lucide-react';
import { AdvanceModal } from '../components/AdvanceModal';
import type { CompanyRecord } from '../types';
import type { IncomeRecord } from '../../income/types';
import type { ExpenseRecord } from '../../expenses/types';
import { companiesApi } from '../api';
import { incomeApi } from '../../income/api';
import { expensesApi } from '../../expenses/api';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useTranslation } from 'react-i18next';

import { OfficialPrintDocument } from '../../../core/components/Print/OfficialPrintDocument';
import { PrintPreviewModal } from '../../../core/components/Print/PrintPreviewModal';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';

const isAdvanceOrTediye = (category?: string, description?: string) => {
  const cat = (category || '').toLowerCase();
  const desc = (description || '').toLowerCase();
  return (
    cat.includes('tediye') ||
    cat.includes('avans') ||
    cat.includes('personel') ||
    cat.includes('advance') ||
    cat.includes('سلفة') ||
    desc.includes('avans') ||
    desc.includes('advance') ||
    desc.includes('سلفة')
  );
};

export function CompanyDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const navigate = useNavigate();
  const { region } = useRegion();
  
  const [record, setRecord] = useState<CompanyRecord | null>(null);
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'details' | 'ledger'>('ledger');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

  const fetchTransactions = async () => {
    if (!id) return;
    setIsLoading(true);
    const [comp, allInc, allExp] = await Promise.all([
      companiesApi.getById(id),
      incomeApi.getAll(),
      expensesApi.getAll()
    ]);
    
    setRecord(comp);
    
    let compInc = allInc.filter(i => i.companyId === id);
    let compExp = allExp.filter(e => e.companyId === id);
    
    if (region !== 'all') {
      compInc = compInc.filter(i => i.region === region);
      compExp = compExp.filter(e => e.region === region);
    }
    
    setIncomes(compInc);
    setExpenses(compExp);
    setIsLoading(false);
  };

  type LedgerRow = {
    id: string;
    date: string;
    description: string;
    category?: string;
    invoiceNo?: string;
    currency?: string;
    effect: number;
    isPaymentRow: boolean;
    txType: 'income' | 'expense';
    originalTx: any;
  };

  useEffect(() => {
    fetchTransactions();
  }, [id, region]);

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading', 'Yükleniyor...')}</div>;
  }

  if (!record) {
    return (
      <div className="page-container">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('common.noRecordFound', 'Kayıt bulunamadı.')} <br/><br/>
          <button className="btn-secondary" onClick={() => navigate('/companies')}>{t('common.goBack', 'Geri Dön')}</button>
        </div>
      </div>
    );
  }

  const isMusteri = record.type === 'Müşteri';

  const availableCurrencies = Array.from(new Set([
    record.currency,
    ...incomes.map(i => i.currency),
    ...expenses.map(e => e.currency)
  ])).filter(Boolean) as string[];

  const activeCurrency = selectedCurrency || record.currency || availableCurrencies[0] || 'TRY';

  const getLedgerData = (currency: string) => {
    const currentIncomes = incomes.filter(i => i.currency === currency);
    const currentExpenses = expenses.filter(e => e.currency === currency);

    // Combine and sort transactions chronologically
    const baseTx = [
      ...currentIncomes.map(i => ({ ...i, txType: 'income' as const })),
      ...currentExpenses.map(e => ({ ...e, txType: 'expense' as const }))
    ];

    const allTx: LedgerRow[] = [];

    baseTx.forEach(tx => {
      let invEffect = 0;
      let payEffectSign = 0;

      if (isMusteri) {
        if (tx.txType === 'income') {
          if (tx.category === 'Tahsilat (Ödeme Alma)') {
            invEffect = -tx.amount;
            payEffectSign = 0;
          } else {
            invEffect = tx.amount;
            payEffectSign = -1;
          }
        }
      } else {
        if (tx.txType === 'expense') {
          if (isAdvanceOrTediye(tx.category, tx.description)) {
            invEffect = tx.amount;
            payEffectSign = 0;
          } else {
            invEffect = -tx.amount;
            payEffectSign = 1;
          }
        }
      }

      // Push invoice row
      allTx.push({
        id: tx.id + '-inv',
        date: tx.date,
        description: tx.description || tx.category || t('common.unspecified', 'Belirtilmedi'),
        category: tx.category,
        invoiceNo: tx.invoiceNo,
        currency: tx.currency,
        effect: invEffect,
        isPaymentRow: false,
        txType: tx.txType,
        originalTx: tx
      });

      if (payEffectSign !== 0) {
        const historySum = (tx.paymentHistory || []).reduce((sum: number, ph: any) => sum + (ph.amount || 0), 0);
        const initialPayment = (tx.paidAmount || 0) - historySum;

        if (initialPayment > 0) {
          allTx.push({
            id: tx.id + '-initpay',
            date: tx.date,
            description: tx.description || tx.category || t('common.unspecified', 'Belirtilmedi'),
            category: t('companies.payment', 'Ödeme'),
            invoiceNo: tx.invoiceNo,
            currency: tx.currency,
            effect: initialPayment * payEffectSign,
            isPaymentRow: true,
            txType: tx.txType,
            originalTx: tx
          });
        }

        if (tx.paymentHistory && tx.paymentHistory.length > 0) {
          tx.paymentHistory.forEach((ph: any, idx: number) => {
            allTx.push({
              id: tx.id + '-pay-' + idx,
              date: ph.date,
              description: ph.notes || t('companies.collectionPayment', 'Tahsilat / Ödeme'),
              category: t('companies.payment', 'Ödeme'),
              invoiceNo: tx.invoiceNo,
              currency: tx.currency,
              effect: (ph.amount || 0) * payEffectSign,
              isPaymentRow: true,
              txType: tx.txType,
              originalTx: tx
            });
          });
        }
      }
    });

    allTx.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      
      // Aynı güne ait işlemlerde Tahakkuk faturası her zaman en üstte (önce) görünsün
      const isSalaryA = a.category?.includes('Tahakkuk') ? -1 : 1;
      const isSalaryB = b.category?.includes('Tahakkuk') ? -1 : 1;
      if (isSalaryA !== isSalaryB) {
        return isSalaryA - isSalaryB;
      }
      
      // Payment rows should come AFTER the invoice row on the same day
      if (a.isPaymentRow !== b.isPaymentRow) {
        return a.isPaymentRow ? 1 : -1;
      }
      
      return 0;
    });
    
    const debtToUs = isMusteri
      ? currentIncomes.filter(i => i.category !== 'Tahsilat (Ödeme Alma)').reduce((sum, i) => sum + i.amount, 0)
      : currentExpenses.filter(e => isAdvanceOrTediye(e.category, e.description)).reduce((sum, e) => sum + e.amount, 0) + currentExpenses.filter(e => !isAdvanceOrTediye(e.category, e.description)).reduce((sum, e) => sum + (e.paidAmount || 0), 0);

    const expAccruals = currentExpenses.filter(e => !isAdvanceOrTediye(e.category, e.description)).reduce((sum, e) => sum + e.amount, 0);
    const personnelBaseAccrual = (record.type === 'Personel' && record.monthlySalary && expAccruals === 0) ? record.monthlySalary : 0;

    const debtToThem = isMusteri
      ? currentIncomes.filter(i => i.category !== 'Tahsilat (Ödeme Alma)').reduce((sum, i) => sum + (i.paidAmount || 0), 0) + currentIncomes.filter(i => i.category === 'Tahsilat (Ödeme Alma)').reduce((sum, i) => sum + i.amount, 0)
      : expAccruals + personnelBaseAccrual;
      
    const currentBalance = debtToUs - debtToThem;
    const isOweUs = currentBalance > 0;
    const isWeOwe = currentBalance < 0;

    const totalAmount = isMusteri ? debtToUs : debtToThem;
    const totalPaid = isMusteri ? debtToThem : debtToUs;
    const remaining = Math.abs(currentBalance);

    const isSelectedMonthFilter = selectedMonth !== 'all';
    let targetYear = new Date().getFullYear();
    let targetMonth = new Date().getMonth();
    if (isSelectedMonthFilter) {
      const [yearStr, monthStr] = selectedMonth.split('-');
      targetYear = parseInt(yearStr);
      targetMonth = parseInt(monthStr) - 1;
    }

    const currentMonthAdvances = currentExpenses
      .filter(e => {
        const d = new Date(e.date);
        const isAdv = isAdvanceOrTediye(e.category, e.description);
        if (!isAdv) return false;
        return isSelectedMonthFilter
          ? (d.getFullYear() === targetYear && d.getMonth() === targetMonth)
          : (d.getFullYear() === new Date().getFullYear() && d.getMonth() === new Date().getMonth());
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const remainingSalaryThisMonth = (record.monthlySalary || 0) - currentMonthAdvances;

    let priorMonthTxEffect = 0;
    if (isSelectedMonthFilter) {
      if (record.type === 'Personel' && record.monthlySalary) {
        const priorMonthExpenses = currentExpenses.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() < targetYear || (d.getFullYear() === targetYear && d.getMonth() < targetMonth);
        });

        const priorMonthsSet = new Set(priorMonthExpenses.map(e => {
          const d = new Date(e.date);
          return `${d.getFullYear()}-${d.getMonth()}`;
        }));

        const priorAdvancesSum = priorMonthExpenses
          .filter(e => isAdvanceOrTediye(e.category, e.description))
          .reduce((sum, e) => sum + e.amount, 0);

        const priorSalaryAccrualSum = priorMonthsSet.size * record.monthlySalary;
        priorMonthTxEffect = priorAdvancesSum - priorSalaryAccrualSum;
      } else {
        allTx.forEach(tx => {
          const d = new Date(tx.date);
          const y = d.getFullYear();
          const m = d.getMonth();
          if (y < targetYear || (y === targetYear && m < targetMonth)) {
            priorMonthTxEffect += tx.effect;
          }
        });
      }
    }

    // --- Print / Display Data Preparation ---
    const initialBaseBal = (record.type === 'Personel' && record.monthlySalary && expAccruals === 0) ? -record.monthlySalary : 0;
    let printRunBal = initialBaseBal + priorMonthTxEffect;
    let printFilteredTx = allTx;
    
    if (isSelectedMonthFilter) {
      printFilteredTx = allTx.filter(tx => {
        const d = new Date(tx.date);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      });
    }

    // Pre-calculate running balances for each row for printing
    const printData = printFilteredTx.map(tx => {
      printRunBal += tx.effect;
      return { ...tx, currentRunBal: printRunBal };
    });

    return {
      allTx,
      totalAmount,
      totalPaid,
      remaining,
      isOweUs,
      isWeOwe,
      currentMonthAdvances,
      remainingSalaryThisMonth,
      printData,
      printInitialBal: priorMonthTxEffect,
      selectedMonthEndBalance: printRunBal
    };
  };

  const availableLedgers = availableCurrencies.map(c => ({ currency: c, data: getLedgerData(c) }));

  let displayAllTx: any[] = [];
  let displayPrintData: any[] = [];
  let initialBalanceRows: any[] = [];
  
  if (activeCurrency === 'all') {
    availableLedgers.forEach(l => {
      displayAllTx.push(...l.data.allTx);
      displayPrintData.push(...l.data.printData);
      if (selectedMonth !== 'all' && l.data.printInitialBal !== 0) {
        initialBalanceRows.push({
          id: `initial-bal-${l.currency}`,
          date: '-',
          description: `${l.currency} ${t('companies.transferredBalance', 'Geçmişten Devreden Bakiye')}`,
          effect: l.data.printInitialBal,
          currentRunBal: l.data.printInitialBal,
          currency: l.currency,
          isInitial: true
        });
      }
    });
    
    const sortFn = (a: any, b: any) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      const isSalaryA = a.category?.includes('Tahakkuk') ? -1 : 1;
      const isSalaryB = b.category?.includes('Tahakkuk') ? -1 : 1;
      if (isSalaryA !== isSalaryB) return isSalaryA - isSalaryB;
      if (a.isPaymentRow !== b.isPaymentRow) return a.isPaymentRow ? 1 : -1;
      return 0;
    };
    
    displayAllTx.sort(sortFn);
    displayPrintData.sort(sortFn);
  } else {
    const l = availableLedgers.find(l => l.currency === activeCurrency);
    if (l) {
      displayAllTx = l.data.allTx;
      displayPrintData = l.data.printData;
      if (selectedMonth !== 'all' && l.data.printInitialBal !== 0) {
        initialBalanceRows.push({
          id: `initial-bal-${l.currency}`,
          date: '-',
          description: t('companies.pastTransferredBalance', 'Geçmişten Devreden Bakiye'),
          effect: l.data.printInitialBal,
          currentRunBal: l.data.printInitialBal,
          currency: l.currency,
          isInitial: true
        });
      }
    }
  }

  const ledgersToDisplay = activeCurrency === 'all' 
    ? availableLedgers 
    : availableLedgers.filter(l => l.currency === activeCurrency);

  const availableMonths = Array.from(new Set([
    ...incomes.map(i => {
      const d = new Date(i.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }),
    ...expenses.map(e => {
      const d = new Date(e.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })
  ])).sort((a, b) => b.localeCompare(a));

  const handleDownloadStatement = () => {
    setShowPrintPreview(true);
  };

  
    const renderPrintDocs = (preview: boolean) => {
      return activeCurrency === 'all' ? (
        <OfficialPrintDocument
          previewMode={preview}
          titleTR={`${record.name} - HESAP EKSTRESİ (TÜM İŞLEMLER)`}
          titleAR={`كشف حساب - ${record.name}`}
          headerNode={
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid black', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{t('companies.companyType', 'Cari Türü')}: {t(`companies.${record.type === 'Müşteri' ? 'customer' : record.type === 'Tedarikçi' ? 'supplier' : 'personnel'}`, record.type)}</div>
                <div>{t('common.region', 'Bölge')}: {t(`common.${record.region === 'Türkiye' ? 'turkey' : 'saudiArabia'}`, record.region)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{t('companies.reportDate', 'Rapor Tarihi')}: {new Date().toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
          }
          columns={[
            { key: 'date', headerTR: 'TARİH', headerAR: 'التاريخ', render: (item: any) => item.date === '-' ? '-' : new Date(item.date).toLocaleDateString('tr-TR') },
            { key: 'description', headerTR: 'İŞLEM', headerAR: 'البيان', render: (item: any) => item.description || item.category },
            { key: 'borc', headerTR: 'BORÇ', headerAR: 'مدين', render: (item: any) => (isMusteri ? item.effect > 0 : item.effect < 0) ? `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(item.effect))} ${item.currency}` : '-' },
            { key: 'alacak', headerTR: isMusteri ? 'ALINAN' : 'ÖDENEN', headerAR: 'دائن', render: (item: any) => (isMusteri ? item.effect < 0 : item.effect > 0) ? `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(item.effect))} ${item.currency}` : '-' },
            { key: 'currentRunBal', headerTR: 'BAKİYE', headerAR: 'الرصيد', render: (item: any) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(item.currentRunBal))} ${item.currency}` }
          ]}
          data={[...initialBalanceRows, ...displayPrintData]}
        />
      ) : (
        availableLedgers.map((l, index) => {
          return (
            <div key={l.currency} style={{ pageBreakBefore: index > 0 ? 'always' : 'auto' }}>
              <OfficialPrintDocument
                previewMode={preview}
                titleTR={`${record.name} - HESAP EKSTRESİ (${l.currency})`}
                titleAR={`كشف حساب - ${record.name} (${l.currency})`}
                headerNode={
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid black', paddingBottom: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{t('companies.companyType', 'Cari Türü')}: {t(`companies.${record.type === 'Müşteri' ? 'customer' : record.type === 'Tedarikçi' ? 'supplier' : 'personnel'}`, record.type)}</div>
                      <div>{t('common.region', 'Bölge')}: {t(`common.${record.region === 'Türkiye' ? 'turkey' : 'saudiArabia'}`, record.region)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>{t('companies.reportDate', 'Rapor Tarihi')}: {new Date().toLocaleDateString('tr-TR')}</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {t('companies.currentBalance', 'Güncel Bakiye:')} {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(l.data.remaining)} {l.currency} 
                        {l.data.remaining !== 0 ? (l.data.isOweUs ? ` (${t('companies.weAreCreditor', 'Biz Alacaklıyız')})` : ` (${t('companies.theyAreCreditor', 'Karşı Taraf Alacaklı')})`) : ` (${t('companies.balanceClosed', 'Bakiye Kapalı')})`}
                      </div>
                    </div>
                  </div>
                }
                columns={[
                  { key: 'date', headerTR: 'TARİH', headerAR: 'التاريخ', render: (item: any) => item.date === '-' ? '-' : new Date(item.date).toLocaleDateString('tr-TR') },
                  { key: 'description', headerTR: 'İŞLEM', headerAR: 'البيان', render: (item: any) => item.description || item.category },
                  { key: 'borc', headerTR: 'BORÇ', headerAR: 'مدين', render: (item: any) => (isMusteri ? item.effect > 0 : item.effect < 0) ? `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(item.effect))} ${item.currency}` : '-' },
                  { key: 'alacak', headerTR: isMusteri ? 'ALINAN' : 'ÖDENEN', headerAR: 'دائن', render: (item: any) => (isMusteri ? item.effect < 0 : item.effect > 0) ? `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(item.effect))} ${item.currency}` : '-' },
                  { key: 'currentRunBal', headerTR: 'BAKİYE', headerAR: 'الرصيد', render: (item: any) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(item.currentRunBal))} ${l.currency}` }
                ]}
                data={l.data.printInitialBal !== 0 && selectedMonth !== 'all' ? [
                  { id: `initial-bal-${l.currency}`, date: '-', description: t('companies.pastTransferredBalance', 'Geçmişten Devreden Bakiye'), effect: l.data.printInitialBal, currentRunBal: l.data.printInitialBal, currency: l.currency, isInitial: true },
                  ...l.data.printData
                ] : l.data.printData}
              />
            </div>
          );
        })
      );
    };

    return (
      <>
      <div className="page-container fade-in screen-only">
      <div className="page-header" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <button 
          className="btn-icon" 
          onClick={() => navigate('/companies')} 
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px', 
              backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <Building2 size={24} color="var(--text-secondary)" />
            </div>
            <div>
              <h1 style={{ margin: '0 0 4px 0' }}>{record.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{record.type}</span>
                <span style={{ fontSize: '12px', color: 'var(--border-color)' }}>•</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={14} /> {record.region === 'Türkiye' ? `${t('common.turkey', 'Türkiye')} 🇹🇷` : `${t('common.saudiArabia', 'Arabistan')} 🇸🇦`}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          {availableCurrencies.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginRight: '8px', paddingBottom: '2px' }}>
              <div style={{ width: '120px' }}>
                <SearchableSelect
                  value={activeCurrency}
                  onChange={setSelectedCurrency}
                  options={availableCurrencies.map(currency => ({ value: currency, label: currency }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {record.type === 'Personel' && record.monthlySalary && (
        <div style={{ marginBottom: '16px' }}>
          <button className="btn btn-secondary" onClick={() => setIsAdvanceModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} />
            {t('companies.giveAdvance', 'Avans Ver')}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {ledgersToDisplay.map(l => (
          <div key={l.currency} style={{ 
            backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', 
            border: '1px solid var(--border-color)', display: 'flex', gap: '20px', alignItems: 'stretch' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '20px', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{l.currency} {t('companies.summary', 'Özeti')}</div>
            </div>
            
            {record.type === 'Personel' && record.monthlySalary ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{t('companies.monthlySalary', 'Aylık Maaş')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}><CurrencyDisplay amount={record.monthlySalary} currency={l.currency} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{t('companies.thisMonthAdvance', 'Bu Ay Avans')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#EF4444' }}><CurrencyDisplay amount={l.data.currentMonthAdvances} currency={l.currency} /></div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{t('companies.totalAmount', 'Toplam Tutar')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}><CurrencyDisplay amount={l.data.totalAmount} currency={l.currency} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{t('companies.paid', 'Ödenen')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}><CurrencyDisplay amount={l.data.totalPaid} currency={l.currency} /></div>
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '20px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                {record.type === 'Personel' && selectedMonth !== 'all' ? t('companies.monthEndBalance', 'Ay Sonu Net Bakiye') : t('companies.generalBalance', 'Genel Bakiye')}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: (record.type === 'Personel' ? l.data.selectedMonthEndBalance > 0 : l.data.isOweUs) ? '#EF4444' : (record.type === 'Personel' ? l.data.selectedMonthEndBalance < 0 : l.data.isWeOwe) ? '#10B981' : 'var(--text-primary)' }}>
                <CurrencyDisplay amount={record.type === 'Personel' ? Math.abs(l.data.selectedMonthEndBalance) : l.data.remaining} currency={l.currency} />
              </div>
              {record.type === 'Personel' && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {l.data.selectedMonthEndBalance < 0
                    ? `(${t('companies.remainingSalary', 'Kalan Maaş')})`
                    : l.data.selectedMonthEndBalance > 0
                    ? `(${t('companies.excessAdvance', 'Fazla Avans')})`
                    : `(${t('companies.salaryCompleted', 'Maaş Tamamlandı')})`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('ledger')}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'ledger' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'ledger' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'ledger' ? 600 : 500, fontSize: '14px'
          }}
        >
          {t('companies.statementMovements', 'Hesap Ekstresi (Hareketler)')}
        </button>
        <button 
          onClick={() => setActiveTab('details')}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'details' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'details' ? 600 : 500, fontSize: '14px'
          }}
        >
          {t('companies.companyDetails', 'Firma Detayları')}
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '400px' }}>
        {activeTab === 'details' ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', color: 'var(--primary)' }}>
                <Briefcase size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('companies.taxOfficeNo', 'Vergi Dairesi / No')}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {record.taxOffice ? `${record.taxOffice} - ${record.taxNumber}` : t('common.unspecified', 'Belirtilmemiş')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', color: 'var(--primary)' }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('companies.emailAddress', 'E-posta Adresi')}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {record.email || t('common.unspecified', 'Belirtilmemiş')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', color: 'var(--primary)' }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('companies.phone', 'Telefon')}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {record.phone || t('common.unspecified', 'Belirtilmemiş')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', color: 'var(--primary)' }}>
                <MapPin size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('companies.fullAddress', 'Açık Adres')}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                  {record.address || t('common.unspecified', 'Belirtilmemiş')}
                </div>
              </div>
            </div>
            
            {record.notes && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', gridColumn: '1 / -1' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', color: 'var(--primary)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('companies.specialNotes', 'Özel Notlar')}</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {record.notes}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', flex: 1 }}>{t('companies.accountStatement', 'Hesap Ekstresi')}</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '160px' }}>
                  <SearchableSelect 
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    options={[
                      { value: 'all', label: t('companies.allTimes', 'Tüm Zamanlar') },
                      ...availableMonths.map(m => {
                        const [year, month] = m.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                        const label = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                        return { value: m, label };
                      })
                    ]}
                  />
                </div>

                <button className="btn-secondary" onClick={handleDownloadStatement} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> {t('companies.downloadPrint', 'İndir / Yazdır')}
                </button>
              </div>
            </div>
            
            {displayAllTx.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t('companies.noTransactionsYet', 'Henüz bu cariye ait bir işlem (fatura/ödeme) bulunmuyor.')}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500 }}>{t('companies.date', 'Tarih')}</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500 }}>{t('companies.transaction', 'İşlem')}</th>
                    <th style={{ textAlign: 'right', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500 }}>{t('companies.debt', 'Borç')}</th>
                    <th style={{ textAlign: 'right', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500 }}>{isMusteri ? t('companies.received', 'Alınan') : t('companies.paidAction', 'Ödenen')}</th>
                    <th style={{ textAlign: 'right', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500 }}>{t('companies.balance', 'Bakiye')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const combinedRows = [...initialBalanceRows, ...displayPrintData];
                    
                    if (combinedRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t('companies.noTransactionInMonth', 'Seçili ayda işlem bulunmuyor.')}
                          </td>
                        </tr>
                      );
                    }

                    return combinedRows.map(tx => {
                      if (tx.isInitial) {
                        const initIsDebt = isMusteri ? tx.effect > 0 : tx.effect < 0;
                        return (
                          <tr key={tx.id} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <td colSpan={2} style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {tx.description}
                            </td>
                            <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                              {initIsDebt ? (
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  <CurrencyDisplay amount={Math.abs(tx.effect)} currency={tx.currency as any} />
                                </div>
                              ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                            </td>
                            <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                              {!initIsDebt ? (
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  <CurrencyDisplay amount={Math.abs(tx.effect)} currency={tx.currency as any} />
                                </div>
                              ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                            </td>
                            <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                <CurrencyDisplay amount={Math.abs(tx.currentRunBal)} currency={tx.currency as any} />
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const effect = tx.effect;
                      const runBal = tx.currentRunBal;

                      const isDebtCreation = isMusteri ? effect > 0 : effect < 0;
                      const isPayment = isMusteri ? effect < 0 : effect > 0;

                      return (
                        <tr key={tx.id}>
                          <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            {new Date(tx.date).toLocaleDateString('tr-TR')}
                          </td>
                          <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 500 }}>{tx.description || tx.category}</div>
                            {tx.invoiceNo && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('companies.invoiceNo', 'Fatura No:')} {tx.invoiceNo}</div>}
                          </td>
                          <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                            {isDebtCreation ? (
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                <CurrencyDisplay amount={Math.abs(effect)} currency={tx.currency as any} />
                              </div>
                            ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </td>
                          <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                            {isPayment ? (
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                <CurrencyDisplay amount={Math.abs(effect)} currency={tx.currency as any} />
                              </div>
                            ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </td>
                          <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              <CurrencyDisplay amount={Math.abs(runBal)} currency={tx.currency as any} />
                            </div>
                            <div style={{ fontSize: '11px', color: runBal === 0 ? 'var(--success)' : 'var(--text-muted)', marginTop: '2px' }}>
                              {record.type === 'Personel' ? (
                                runBal < 0
                                  ? `(${t('companies.remainingSalary', 'Kalan Maaş')})`
                                  : runBal > 0
                                  ? `(${t('companies.excessAdvance', 'Fazla Avans / Biz Alacaklıyız')})`
                                  : `(${t('companies.salaryCompleted', 'Maaş Tamamlandı')})`
                              ) : (
                                runBal > 0 
                                  ? `(${t('companies.weAreCreditor', 'Biz Alacaklıyız')})` 
                                  : runBal < 0 
                                  ? `(${t('companies.theyAreCreditor', 'Karşı Taraf Alacaklı')})`
                                  : `(${t('companies.balanceClosed', 'Bakiye Kapalı')})`
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
    <PrintPreviewModal
      isOpen={showPrintPreview}
      onClose={() => setShowPrintPreview(false)}
      children={renderPrintDocs(false)}
      previewChildren={renderPrintDocs(true)}
    />
    
    {record && (
      <AdvanceModal 
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSuccess={() => {
          fetchTransactions();
        }}
        personelId={record.id}
        personelName={record.name}
        currency={record.currency || 'TRY'}
        personelRegion={record.region}
      />
    )}
    </>
  );
}
