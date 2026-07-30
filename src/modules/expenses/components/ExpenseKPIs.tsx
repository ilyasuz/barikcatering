import { useTranslation } from 'react-i18next';
import { KPICard } from '../../../core/components/Card/KPICard';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { CreditCard, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import type { ExpenseRecord } from '../types';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { calculateTotalBase, getDisplaySymbol } from '../../../core/utils/currencyUtils';
import '../../income/Income.css'; 

interface ExpenseKPIsProps {
  data?: ExpenseRecord[];
  netProfit?: number;
  onFilterClick?: (filter: 'all' | 'pending' | 'overdue', currency?: 'all' | 'USD' | 'SAR' | 'TRY' | 'EUR') => void;
  activeFilter?: 'all' | 'pending' | 'overdue';
  activeCurrencyFilter?: 'all' | 'USD' | 'SAR' | 'TRY' | 'EUR';
}

export function ExpenseKPIs({ data = [], netProfit, onFilterClick, activeFilter = 'all', activeCurrencyFilter = 'all' }: ExpenseKPIsProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const { rates, baseCurrency } = useExchangeRates();

  const isAllRegions = region === 'all';
  const defaultCurrency = region === 'Arabistan' ? 'SAR' : 'TRY';

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = (item: ExpenseRecord) => item.status === 'overdue' || (item.status !== 'completed' && !!item.dueDate && item.dueDate < todayStr);
  const isPending = (item: ExpenseRecord) => (item.status === 'pending' || item.status !== 'completed') && !isOverdue(item);

  const pendingData = data.filter(isPending);
  const overdueData = data.filter(isOverdue);

  // Base currency equivalents
  const totalExpensesBase = calculateTotalBase(data, baseCurrency, rates, false);
  const pendingDebitsBase = calculateTotalBase(pendingData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), baseCurrency, rates, false);
  const overdueDebitsBase = calculateTotalBase(overdueData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), baseCurrency, rates, false);

  const displayCurrency = region === 'Arabistan' ? 'SAR' : (region === 'all' ? baseCurrency : 'TRY');
  const displaySymbol = getDisplaySymbol(displayCurrency);

  // Correct sums for the specific region (converts USD to SAR for Arabistan, etc.)
  const totalExpenses = calculateTotalBase(data, displayCurrency, rates, false);
  const pendingDebits = calculateTotalBase(pendingData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), displayCurrency, rates, false);
  const overdueDebits = calculateTotalBase(overdueData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), displayCurrency, rates, false);

  const totalExpenseVal = isAllRegions ? totalExpensesBase : totalExpenses;
  const totalPendingVal = isAllRegions ? pendingDebitsBase : pendingDebits;
  const totalOverdueVal = isAllRegions ? overdueDebitsBase : overdueDebits;

  const getEqStr = (amount: number, curr: string) => {
    if (amount === 0) return undefined;
    const eq = calculateTotalBase([{ amount, currency: curr }], displayCurrency, rates, false);
    return `≈ ${displaySymbol}${eq.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const expenseBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
  const pendingBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
  const overdueBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const isCurrentMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isLastMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  };

  const currentMonthBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
  const lastMonthBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
  let currentMonthTotal = 0;
  let lastMonthTotal = 0;

  data.forEach(item => {
    const curr = item.currency as 'USD' | 'SAR' | 'TRY' | 'EUR';
    if (curr in expenseBreakdown) {
      expenseBreakdown[curr] += (item.amount || 0);
      
      if (isPending(item)) {
        pendingBreakdown[curr] += ((item.amount || 0) - (item.paidAmount || 0));
      }
      if (isOverdue(item)) {
        overdueBreakdown[curr] += ((item.amount || 0) - (item.paidAmount || 0));
      }
      if (isCurrentMonth(item.date)) {
        currentMonthBreakdown[curr] += (item.amount || 0);
        currentMonthTotal += (item.amount || 0);
      } else if (isLastMonth(item.date)) {
        lastMonthBreakdown[curr] += (item.amount || 0);
        lastMonthTotal += (item.amount || 0);
      }
    }
  });

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? { value: 100, isPositive: true, label: t('common.vsLastMonth', 'Geçen aya göre') } : undefined;
    const pct = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(pct), isPositive: pct >= 0, label: t('common.vsLastMonth', 'Geçen aya göre') };
  };

  return (
    <div className="kpi-sections-container">
      <div className="kpi-section">
        <h2 className="kpi-section-title"><CreditCard size={18} color="var(--danger)" /> {t('expenses.kpi.totalExpenses', 'Toplam Gider')}</h2>
        <div className="kpi-row" style={{ cursor: onFilterClick ? 'pointer' : 'default', opacity: activeFilter === 'all' ? 1 : 0.6 }}>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('all', 'USD'); }}>
            <KPICard 
              title={t('expenses.kpi.usdExpenses', 'Dolar Giderleri (USD)')}
              value={`$${expenseBreakdown.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(expenseBreakdown.USD, 'USD')}
              trend={calculateTrend(currentMonthBreakdown.USD, lastMonthBreakdown.USD)}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('all', 'SAR'); }}>
            <KPICard 
              title={t('expenses.kpi.sarExpenses', 'Riyal Giderleri (SAR)')}
              value={`${expenseBreakdown.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
              className="small-kpi"
              trend={calculateTrend(currentMonthBreakdown.SAR, lastMonthBreakdown.SAR)}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('all', 'all'); }}>
            <KPICard 
              title={t('expenses.kpi.totalExpensesLabel', 'Toplam Gider ({{currency}})', { currency: displayCurrency })}
              value={`${displaySymbol}${totalExpenseVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              trend={calculateTrend(currentMonthTotal, lastMonthTotal)}
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2 }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5 L100,40 Z" fill="#F59E0B" />
                <path d="M0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5" fill="none" stroke="#F59E0B" strokeWidth="2" />
              </svg>
            </KPICard>
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <h2 className="kpi-section-title"><Clock size={18} color="var(--info)" /> {t('expenses.kpi.pendingPayments', 'Bekleyen Ödemeler')}</h2>
        <div className="kpi-row" style={{ cursor: onFilterClick ? 'pointer' : 'default', opacity: activeFilter === 'pending' ? 1 : (activeFilter === 'all' ? 1 : 0.6) }}>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('pending', 'USD'); }}>
            <KPICard 
              title={t('expenses.kpi.usdPending', 'Dolar Bekleyen (USD)')}
              value={`$${pendingBreakdown.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(pendingBreakdown.USD, 'USD')}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('pending', 'SAR'); }}>
            <KPICard 
              title={t('expenses.kpi.sarPending', 'Riyal Bekleyen (SAR)')}
              value={`${pendingBreakdown.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
              className="small-kpi"
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('pending', 'all'); }}>
            <KPICard 
              title={t('expenses.kpi.totalPendingLabel', 'Toplam Bekleyen ({{currency}})', { currency: displayCurrency })}
              value={`${displaySymbol}${totalPendingVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2 }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,25 Q15,35 30,20 T60,25 T85,15 T100,20 L100,40 Z" fill="#3B82F6" />
                <path d="M0,25 Q15,35 30,20 T60,25 T85,15 T100,20" fill="none" stroke="#3B82F6" strokeWidth="2" />
              </svg>
            </KPICard>
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <h2 className="kpi-section-title"><AlertCircle size={18} color="var(--danger)" /> {t('expenses.kpi.overdueInvoices', 'Geciken Ödemeler')}</h2>
        <div className="kpi-row" style={{ cursor: onFilterClick ? 'pointer' : 'default', opacity: activeFilter === 'overdue' ? 1 : (activeFilter === 'all' ? 1 : 0.6) }}>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('overdue', 'USD'); }}>
            <KPICard 
              title={t('expenses.kpi.usdOverdue', 'Dolar Geciken (USD)')}
              value={`$${overdueBreakdown.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(overdueBreakdown.USD, 'USD')}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('overdue', 'SAR'); }}>
            <KPICard 
              title={t('expenses.kpi.sarOverdue', 'Riyal Geciken (SAR)')}
              value={`${overdueBreakdown.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
              className="small-kpi"
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('overdue', 'all'); }}>
            <KPICard 
              title={t('expenses.kpi.totalOverdueLabel', 'Toplam Geciken ({{currency}})', { currency: displayCurrency })}
              value={`${displaySymbol}${totalOverdueVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15 }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,30 Q20,20 40,35 T70,25 T100,10 L100,40 Z" fill="#EF4444" />
                <path d="M0,30 Q20,20 40,35 T70,25 T100,10" fill="none" stroke="#EF4444" strokeWidth="2" />
              </svg>
            </KPICard>
          </div>
        </div>
      </div>
    </div>
  );
}
