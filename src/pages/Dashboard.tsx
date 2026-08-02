import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CashFlowChart } from '../components/DashboardCharts';
import { DataTable } from '../core/components/DataTable/DataTable';
import type { Column } from '../core/components/DataTable/DataTable';
import { StatusBadge } from '../core/components/Typography/StatusBadge';
import type { StatusType } from '../core/components/Typography/StatusBadge';
import { CurrencyDisplay } from '../core/components/Typography/CurrencyDisplay';

const formatCurrency = (amount: number, region: AppRegion) => {
  const currency = region === 'Arabistan' ? 'SAR' : 'TRY';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
};
import { supabase } from '../lib/supabase';
import { KPICard } from '../core/components/Card/KPICard';
import { Wallet, TrendingUp, TrendingDown, Users, FileSpreadsheet } from 'lucide-react';
import { useExchangeRates } from '../core/contexts/ExchangeRatesContext';
import { calculateTotalBase, getDisplayCurrency, getDisplaySymbol } from '../core/utils/currencyUtils';
import { GlobalExcelImportModal } from '../components/GlobalExcelImportModal';

interface ActivityRecord {
  id: string;
  date: string;
  desc: string;
  company: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR' | 'SAR';
  status: StatusType;
  type?: 'income' | 'expense';
  created_at: string;
}

import { useRegion } from '../core/contexts/RegionContext';
import type { AppRegion } from '../core/contexts/RegionContext';

export function Dashboard() {
  const { region } = useRegion();
  const { rates, baseCurrency } = useExchangeRates();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    activeCompanies: 0,
    totalAccountsBalance: 0,
    totalIncomeBase: 0,
    totalExpenseBase: 0,
    netProfitBase: 0,
    totalAccountsBalanceBase: 0,
    displayCurrency: 'TRY',
    displaySymbol: '₺',
    breakdown: {
      income: { USD: 0, SAR: 0, TRY: 0, EUR: 0 },
      expense: { USD: 0, SAR: 0, TRY: 0, EUR: 0 },
      net: { USD: 0, SAR: 0, TRY: 0, EUR: 0 },
      accounts: { USD: 0, SAR: 0, TRY: 0, EUR: 0 }
    },
    trends: {
      income: { USD: undefined, SAR: undefined, Total: undefined },
      expense: { USD: undefined, SAR: undefined, Total: undefined }
    } as Record<string, Record<string, { value: number, isPositive: boolean, label: string } | undefined>>
  });
  const [chartData, setChartData] = useState<import('../components/DashboardCharts').ChartData[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboardStats() {
      setIsLoading(true);
      try {
        // Fetch incomes
        let incQuery = supabase.from('income').select('id, amount, currency, date, created_at, description, title, status');
        if (region !== 'all') incQuery = incQuery.eq('region', region);
        const { data: incomes, error: incError } = await incQuery;
        if (incError) console.error("Income fetch error:", incError);
        
        const displayCurrency = getDisplayCurrency(region, baseCurrency);
        const displaySymbol = getDisplaySymbol(displayCurrency);

        const totalIncome = calculateTotalBase(incomes || [], displayCurrency, rates, false);
        const totalIncomeBase = calculateTotalBase(incomes || [], baseCurrency, rates, false);
        
        const incomeBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
        (incomes || []).forEach(inc => {
          const curr = inc.currency as 'USD'|'SAR'|'TRY'|'EUR';
          if (incomeBreakdown[curr] !== undefined) {
            incomeBreakdown[curr] += Number(inc.amount) || 0;
          }
        });

        // Fetch expenses
        let expQuery = supabase.from('expenses').select('id, amount, currency, date, created_at, description, title, status');
        if (region !== 'all') expQuery = expQuery.eq('region', region);
        const { data: expenses, error: expError } = await expQuery;
        if (expError) console.error("Expense fetch error:", expError);
        
        const totalExpense = calculateTotalBase(expenses || [], displayCurrency, rates, false);
        const totalExpenseBase = calculateTotalBase(expenses || [], baseCurrency, rates, false);

        const expenseBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
        (expenses || []).forEach(exp => {
          const curr = exp.currency as 'USD'|'SAR'|'TRY'|'EUR';
          if (expenseBreakdown[curr] !== undefined) {
            expenseBreakdown[curr] += Number(exp.amount) || 0;
          }
        });

        // Calculate Trends
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const isCurrentMonth = (dStr: string) => { const d = new Date(dStr); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; };
        const isLastMonth = (dStr: string) => { const d = new Date(dStr); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; };

        const incCur = { USD: 0, SAR: 0, Total: 0 };
        const incLast = { USD: 0, SAR: 0, Total: 0 };
        (incomes || []).forEach(inc => {
          const amount = Number(inc.amount) || 0;
          const curr = inc.currency as 'USD'|'SAR';
          const amountBase = calculateTotalBase([{ amount, currency: inc.currency }], baseCurrency, rates, false);
          
          if (isCurrentMonth(inc.date)) {
            if (curr === 'USD') incCur.USD += amount;
            if (curr === 'SAR') incCur.SAR += amount;
            incCur.Total += amountBase;
          } else if (isLastMonth(inc.date)) {
            if (curr === 'USD') incLast.USD += amount;
            if (curr === 'SAR') incLast.SAR += amount;
            incLast.Total += amountBase;
          }
        });

        const expCur = { USD: 0, SAR: 0, Total: 0 };
        const expLast = { USD: 0, SAR: 0, Total: 0 };
        (expenses || []).forEach(exp => {
          const amount = Number(exp.amount) || 0;
          const curr = exp.currency as 'USD'|'SAR';
          const amountBase = calculateTotalBase([{ amount, currency: exp.currency }], baseCurrency, rates, false);
          
          if (isCurrentMonth(exp.date)) {
            if (curr === 'USD') expCur.USD += amount;
            if (curr === 'SAR') expCur.SAR += amount;
            expCur.Total += amountBase;
          } else if (isLastMonth(exp.date)) {
            if (curr === 'USD') expLast.USD += amount;
            if (curr === 'SAR') expLast.SAR += amount;
            expLast.Total += amountBase;
          }
        });

        const calcTrend = (cur: number, last: number) => {
          if (last === 0) return cur > 0 ? { value: 100, isPositive: true, label: t('dashboard.comparedToLastMonth', 'Geçen aya göre') } : undefined;
          const pct = Math.round(((cur - last) / last) * 100);
          return { value: Math.abs(pct), isPositive: pct >= 0, label: t('dashboard.comparedToLastMonth', 'Geçen aya göre') };
        };

        const trends = {
          income: {
            USD: calcTrend(incCur.USD, incLast.USD),
            SAR: calcTrend(incCur.SAR, incLast.SAR),
            Total: calcTrend(incCur.Total, incLast.Total)
          },
          expense: {
            USD: calcTrend(expCur.USD, expLast.USD),
            SAR: calcTrend(expCur.SAR, expLast.SAR),
            Total: calcTrend(expCur.Total, expLast.Total)
          }
        };

        // Net Profit Breakdown
        const netBreakdown = {
          USD: incomeBreakdown.USD - expenseBreakdown.USD,
          SAR: incomeBreakdown.SAR - expenseBreakdown.SAR,
          TRY: incomeBreakdown.TRY - expenseBreakdown.TRY,
          EUR: incomeBreakdown.EUR - expenseBreakdown.EUR,
        };

        // Fetch companies count
        let compQuery = supabase.from('companies').select('*', { count: 'exact', head: true });
        if (region !== 'all') compQuery = compQuery.eq('region', region);
        const { count: activeCompanies } = await compQuery;

        // Fetch accounts balance
        let accQuery = supabase.from('accounts').select('balance, currency');
        if (region !== 'all') accQuery = accQuery.eq('region', region);
        const { data: accounts } = await accQuery;
        
        const accountsData = (accounts || []).map(a => ({ amount: Number(a.balance), currency: a.currency }));
        const totalAccountsBalance = calculateTotalBase(accountsData, displayCurrency, rates, false);
        const totalAccountsBalanceBase = calculateTotalBase(accountsData, baseCurrency, rates, false);

        const accountsBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
        (accounts || []).forEach(acc => {
          const curr = acc.currency as 'USD'|'SAR'|'TRY'|'EUR';
          if (accountsBreakdown[curr] !== undefined) {
            accountsBreakdown[curr] += Number(acc.balance) || 0;
          }
        });

        setStats({
          totalIncome,
          totalExpense,
          netProfit: totalIncome - totalExpense,
          activeCompanies: activeCompanies || 0,
          totalAccountsBalance,
          totalIncomeBase,
          totalExpenseBase,
          netProfitBase: totalIncomeBase - totalExpenseBase,
          totalAccountsBalanceBase,
          displayCurrency,
          displaySymbol,
          breakdown: {
            income: incomeBreakdown,
            expense: expenseBreakdown,
            net: netBreakdown,
            accounts: accountsBreakdown
          },
          trends
        });

        // Group by month
        const monthlyData: Record<string, any> = {};
        const monthNames = [
          t('common.months.jan', 'Oca'), t('common.months.feb', 'Şub'), t('common.months.mar', 'Mar'),
          t('common.months.apr', 'Nis'), t('common.months.may', 'May'), t('common.months.jun', 'Haz'),
          t('common.months.jul', 'Tem'), t('common.months.aug', 'Ağu'), t('common.months.sep', 'Eyl'),
          t('common.months.oct', 'Eki'), t('common.months.nov', 'Kas'), t('common.months.dec', 'Ara')
        ];

        const processData = (items: any[], type: 'income' | 'expense') => {
          items.forEach(item => {
            if (!item.date) return;
            const d = new Date(item.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (!monthlyData[key]) {
              monthlyData[key] = {
                name: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
                income: 0,
                expense: 0,
                sortKey: new Date(d.getFullYear(), d.getMonth(), 1).getTime()
              };
            }
            monthlyData[key][type] += Number(item.amount);
          });
        };
        
        processData(incomes || [], 'income');
        processData(expenses || [], 'expense');
        
        const sortedChart = Object.values(monthlyData)
          .sort((a: any, b: any) => a.sortKey - b.sortKey)
          .map(({ sortKey, ...rest }: any) => rest);
          
        setChartData(sortedChart.length > 0 ? sortedChart : [
          { name: t('common.months.jan', 'Oca'), income: 0, expense: 0 }
        ]);

        // Process Recent Activities
        const recentIncomes: ActivityRecord[] = (incomes || []).map(inc => ({
          id: inc.id,
          date: inc.date,
          desc: inc.description || t('common.income', 'Gelir'),
          company: inc.title || t('common.unknown', 'Bilinmiyor'),
          amount: Number(inc.amount),
          currency: inc.currency as 'TRY' | 'USD' | 'EUR',
          status: inc.status as StatusType,
          type: 'income',
          created_at: inc.created_at
        }));

        const recentExpenses: ActivityRecord[] = (expenses || []).map(exp => ({
          id: exp.id,
          date: exp.date,
          desc: exp.description || t('common.expense', 'Gider'),
          company: exp.title || t('common.unknown', 'Bilinmiyor'),
          amount: Number(exp.amount),
          currency: exp.currency as 'TRY' | 'USD' | 'EUR',
          status: exp.status as StatusType,
          type: 'expense',
          created_at: exp.created_at
        }));

        const allActivities = [...recentIncomes, ...recentExpenses]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6);
        
        setRecentActivities(allActivities);

      } catch (err) {
        console.error(t('dashboard.fetchError', 'Dashboard veri çekme hatası:'), err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
  }, [region, rates, baseCurrency]);
  
  const { t } = useTranslation();

  const columns: Column<ActivityRecord>[] = [
    { key: 'date', header: t('income.table.date'), width: '120px' },
    { key: 'desc', header: t('income.table.description') },
    { key: 'company', header: t('income.table.company') },
    { 
      key: 'amount', 
      header: t('income.table.amount'), 
      align: 'right',
      render: (item) => (
        <span style={{ color: item.type === 'expense' ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>
          {item.type === 'expense' ? '- ' : '+ '}
          <CurrencyDisplay amount={item.amount} currency={item.currency} />
        </span>
      )
    },
    { 
      key: 'status', 
      header: t('common.status'),
      render: (item) => <StatusBadge status={item.status} label={t(`common.${item.status}` as any)} />
    }
  ];

  const baseSymbol = baseCurrency === 'USD' ? '$' : baseCurrency === 'EUR' ? '€' : baseCurrency === 'TRY' ? '₺' : 'SAR ';

  const getEqStr = (amount: number, curr: string) => {
    if (amount === 0) return undefined;
    const eq = calculateTotalBase([{ amount, currency: curr }], stats.displayCurrency, rates, false);
    return `≈ ${stats.displaySymbol}${eq.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="text-muted">{t('dashboard.subtitle')}</p>
        </div>
        <div className="page-actions">
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10B981' }}
            onClick={() => setIsExcelModalOpen(true)}
          >
            <FileSpreadsheet size={18} />
            {t('dashboard.uploadExcel', 'Toplu Kasa Excel\'i Yükle')}
          </button>
        </div>
      </div>
      
      {isExcelModalOpen && (
        <GlobalExcelImportModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          onSuccess={() => {
            setIsExcelModalOpen(false);
            window.location.reload(); // Refresh to see new data
          }}
        />
      )}
      
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('dashboard.loadingStats', 'İstatistikler Yükleniyor...')}</div>
      ) : (
        <div className="kpi-sections-container">
          <div className="kpi-section">
            <h2 className="kpi-section-title"><TrendingUp size={18} color="var(--success)" /> {t('dashboard.incomeSummary', 'Gelirler Özeti')}</h2>
            <div className="kpi-row">
              <KPICard 
                title={t('dashboard.usdIncome', 'Dolar Gelirleri (USD)')} 
                value={`$${stats.breakdown.income.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.income.USD, 'USD')}
                trend={stats.trends.income.USD}
              />
              <KPICard 
                title={t('dashboard.sarIncome', 'Riyal Gelirleri (SAR)')} 
                value={`${stats.breakdown.income.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
                className="small-kpi"
                trend={stats.trends.income.SAR}
              />
              <KPICard 
                title={t('dashboard.tryIncome', 'TL Gelirleri (TRY)')} 
                value={`₺${stats.breakdown.income.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.income.TRY, 'TRY')}
              />
              <KPICard 
                title={`${t('reports.totalIncome', 'Toplam Gelir')} (${stats.displayCurrency})`}
                value={region === 'all' 
                  ? `${stats.displaySymbol}${stats.totalIncomeBase.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `${stats.displaySymbol}${stats.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                trend={stats.trends.income.Total}
              >
                <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,40 L0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5 L100,40 Z" fill="#10B981" />
                  <path d="M0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5" fill="none" stroke="#10B981" strokeWidth="2" />
                </svg>
              </KPICard>
            </div>
          </div>

          <div className="kpi-section">
            <h2 className="kpi-section-title"><TrendingDown size={18} color="var(--danger)" /> {t('dashboard.expenseSummary', 'Giderler Özeti')}</h2>
            <div className="kpi-row">
              <KPICard 
                title={t('dashboard.usdExpense', 'Dolar Giderleri (USD)')} 
                value={`$${stats.breakdown.expense.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.expense.USD, 'USD')}
                trend={stats.trends.expense.USD}
              />
              <KPICard 
                title={t('dashboard.sarExpense', 'Riyal Giderleri (SAR)')} 
                value={`${stats.breakdown.expense.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
                className="small-kpi"
                trend={stats.trends.expense.SAR}
              />
              <KPICard 
                title={t('dashboard.tryExpense', 'TL Giderleri (TRY)')} 
                value={`₺${stats.breakdown.expense.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.expense.TRY, 'TRY')}
              />
              <KPICard 
                title={`${t('reports.totalExpense', 'Toplam Gider')} (${stats.displayCurrency})`}
                value={region === 'all' 
                  ? `${stats.displaySymbol}${stats.totalExpenseBase.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `${stats.displaySymbol}${stats.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                trend={stats.trends.expense.Total}
              >
                <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.1, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,40 L0,30 Q20,20 40,35 T70,25 T100,10 L100,40 Z" fill="#EF4444" />
                  <path d="M0,30 Q20,20 40,35 T70,25 T100,10" fill="none" stroke="#EF4444" strokeWidth="2" />
                </svg>
              </KPICard>
            </div>
          </div>

          <div className="kpi-section">
            <h2 className="kpi-section-title"><Wallet size={18} color="var(--accent)" /> {t('dashboard.profitLossSummary', 'Kâr & Zarar Özeti')}</h2>
            <div className="kpi-row">
              <KPICard 
                title={t('dashboard.usdNet', 'USD Net Durum')} 
                value={`$${stats.breakdown.net.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.net.USD, 'USD')}
              />
              <KPICard 
                title={t('dashboard.sarNet', 'SAR Net Durum')} 
                value={`${stats.breakdown.net.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
                className="small-kpi"
              />
              <KPICard 
                title={t('dashboard.tryNet', 'TL Net Durum')} 
                value={`₺${stats.breakdown.net.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.net.TRY, 'TRY')}
              />
              <KPICard 
                title={`${t('dashboard.totalNet', 'Toplam Net Durum')} (${stats.displayCurrency})`}
                value={region === 'all' 
                  ? `${stats.displaySymbol}${stats.netProfitBase.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `${stats.displaySymbol}${stats.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                trend={{
                  value: (region === 'all' ? stats.totalIncomeBase : stats.totalIncome) > 0 ? Math.round(((region === 'all' ? Math.abs(stats.netProfitBase) : Math.abs(stats.netProfit)) / (region === 'all' ? stats.totalIncomeBase : stats.totalIncome)) * 100) : 0,
                  label: t('reports.profitMargin', 'Kâr Marjı'),
                  isPositive: (region === 'all' ? stats.netProfitBase : stats.netProfit) >= 0
                }}
              >
                <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,40 L0,25 Q15,35 30,20 T60,25 T85,15 T100,20 L100,40 Z" fill="#3B82F6" />
                  <path d="M0,25 Q15,35 30,20 T60,25 T85,15 T100,20" fill="none" stroke="#3B82F6" strokeWidth="2" />
                </svg>
              </KPICard>
            </div>
          </div>

          <div className="kpi-section">
            <h2 className="kpi-section-title"><Users size={18} color="var(--accent)" /> {t('dashboard.accountsSummary', 'Kasa ve Bankalar Özeti')}</h2>
            <div className="kpi-row">
              <KPICard 
                title={t('dashboard.usdBalance', 'USD Bakiye')} 
                value={`$${stats.breakdown.accounts.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.accounts.USD, 'USD')}
              />
              <KPICard 
                title={t('dashboard.sarBalance', 'SAR Bakiye')} 
                value={`${stats.breakdown.accounts.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
                className="small-kpi"
              />
              <KPICard 
                title={t('dashboard.tryBalance', 'TL Bakiye')} 
                value={`₺${stats.breakdown.accounts.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                equivalentStr={getEqStr(stats.breakdown.accounts.TRY, 'TRY')}
              />
              <KPICard 
                title={`${t('dashboard.totalBalance', 'Toplam Bakiye')} (${stats.displayCurrency})`}
                value={region === 'all' 
                  ? `${stats.displaySymbol}${stats.totalAccountsBalanceBase.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `${stats.displaySymbol}${stats.totalAccountsBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="small-kpi"
                trend={undefined}
              >
                <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,40 L0,20 Q15,30 30,10 T60,25 T80,5 T100,15 L100,40 Z" fill="#8B5CF6" />
                  <path d="M0,20 Q15,30 30,10 T60,25 T80,5 T100,15" fill="none" stroke="#8B5CF6" strokeWidth="2" />
                </svg>
              </KPICard>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-main">
        <div className="chart-placeholder">
          <h3>{t('dashboard.cashFlow')}</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <CashFlowChart data={chartData} />
          </div>
        </div>
        <div className="activity-placeholder" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ padding: '24px 24px 16px 24px', margin: 0, borderBottom: '1px solid var(--border-color)' }}>{t('dashboard.recentActivity')}</h3>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DataTable
              columns={columns}
              data={recentActivities}
            />
          </div>
        </div>
      </div>
    </>
  );
}
