import { useTranslation } from 'react-i18next';
import { KPICard } from '../../../core/components/Card/KPICard';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { Wallet, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import type { IncomeRecord } from '../types';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { calculateTotalBase, getDisplaySymbol } from '../../../core/utils/currencyUtils';
import '../Income.css';

interface IncomeKPIsProps {
  data?: IncomeRecord[];
  netProfit?: number;
  onFilterClick?: (filter: 'all' | 'pending' | 'overdue', currency?: 'all' | 'USD' | 'SAR' | 'TRY' | 'EUR') => void;
  activeFilter?: 'all' | 'pending' | 'overdue';
  activeCurrencyFilter?: 'all' | 'USD' | 'SAR' | 'TRY' | 'EUR';
}

export function IncomeKPIs({ data = [], netProfit, onFilterClick, activeFilter = 'all', activeCurrencyFilter = 'all' }: IncomeKPIsProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const { rates, baseCurrency } = useExchangeRates();

  const isAllRegions = region === 'all';
  const defaultCurrency = region === 'Arabistan' ? 'SAR' : 'TRY';

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = (item: IncomeRecord) => item.status === 'overdue' || (item.status !== 'completed' && !!item.dueDate && item.dueDate < todayStr);
  const isPending = (item: IncomeRecord) => (item.status === 'pending' || item.status !== 'completed') && !isOverdue(item);

  const pendingData = data.filter(isPending);
  const overdueData = data.filter(isOverdue);

  // Base currency equivalents (if needed for all regions)
  const totalRevenueBase = calculateTotalBase(data, baseCurrency, rates, false);
  const pendingCollectionsBase = calculateTotalBase(pendingData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), baseCurrency, rates, false);
  const overdueInvoicesBase = calculateTotalBase(overdueData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), baseCurrency, rates, false);

  const displayCurrency = region === 'Arabistan' ? 'SAR' : (region === 'all' ? baseCurrency : 'TRY');
  const displaySymbol = getDisplaySymbol(displayCurrency);

  // Correct sums for the specific region (converts USD to SAR for Arabistan, etc.)
  const totalRevenue = calculateTotalBase(data, displayCurrency, rates, false);
  const pendingCollections = calculateTotalBase(pendingData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), displayCurrency, rates, false);
  const overdueInvoices = calculateTotalBase(overdueData.map(d => ({ ...d, amount: (d.amount || 0) - (d.paidAmount || 0) })), displayCurrency, rates, false);

  const totalIncomeVal = isAllRegions ? totalRevenueBase : totalRevenue;
  const totalPendingVal = isAllRegions ? pendingCollectionsBase : pendingCollections;
  const totalOverdueVal = isAllRegions ? overdueInvoicesBase : overdueInvoices;

  const getEqStr = (amount: number, curr: string) => {
    if (amount === 0) return undefined;
    const eq = calculateTotalBase([{ amount, currency: curr }], displayCurrency, rates, false);
    return `≈ ${displaySymbol}${eq.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const incomeBreakdown = { USD: 0, SAR: 0, TRY: 0, EUR: 0 };
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
    if (curr in incomeBreakdown) {
      incomeBreakdown[curr] += (item.amount || 0);
      
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
    if (previous === 0) return current > 0 ? { value: 100, isPositive: true, label: t('income.comparedToLastMonth', 'Geçen aya göre') } : undefined;
    const pct = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(pct), isPositive: pct >= 0, label: t('income.comparedToLastMonth', 'Geçen aya göre') };
  };

  return (
    <div className="kpi-sections-container">
      <div className="kpi-section">
        <h2 className="kpi-section-title"><Wallet size={18} color="var(--success)" /> {t('income.kpi.totalRevenue')}</h2>
        <div className="kpi-row" style={{ cursor: onFilterClick ? 'pointer' : 'default', opacity: activeFilter === 'all' ? 1 : 0.6 }}>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('all', 'USD'); }}>
            <KPICard 
              title={t('income.usdRevenues', 'Dolar Gelirleri (USD)')}
              value={`$${incomeBreakdown.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(incomeBreakdown.USD, 'USD')}
              trend={calculateTrend(currentMonthBreakdown.USD, lastMonthBreakdown.USD)}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('all', 'SAR'); }}>
            <KPICard 
              title={t('income.sarRevenues', 'Riyal Gelirleri (SAR)')}
              value={`${incomeBreakdown.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
              className="small-kpi"
              trend={calculateTrend(currentMonthBreakdown.SAR, lastMonthBreakdown.SAR)}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('all', 'TRY'); }}>
            <KPICard 
              title={t('income.tryRevenues', 'TL Gelirleri (TRY)')}
              value={`₺${incomeBreakdown.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(incomeBreakdown.TRY, 'TRY')}
              trend={calculateTrend(currentMonthBreakdown.TRY, lastMonthBreakdown.TRY)}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('all', 'all'); }}>
            <KPICard 
              title={t('income.totalRevenueParam', 'Toplam Gelir ({{currency}})', { currency: displayCurrency })}
              value={`${displaySymbol}${totalIncomeVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              trend={calculateTrend(currentMonthTotal, lastMonthTotal)}
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5 L100,40 Z" fill="#10B981" />
                <path d="M0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5" fill="none" stroke="#10B981" strokeWidth="2" />
              </svg>
            </KPICard>
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <h2 className="kpi-section-title"><Clock size={18} color="var(--warning)" /> {t('income.kpi.pendingCollections')}</h2>
        <div className="kpi-row" style={{ cursor: onFilterClick ? 'pointer' : 'default', opacity: activeFilter === 'pending' ? 1 : (activeFilter === 'all' ? 1 : 0.6) }}>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('pending', 'USD'); }}>
            <KPICard 
              title={t('income.usdPending', 'Dolar Bekleyen (USD)')}
              value={`$${pendingBreakdown.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(pendingBreakdown.USD, 'USD')}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('pending', 'SAR'); }}>
            <KPICard 
              title={t('income.sarPending', 'Riyal Bekleyen (SAR)')}
              value={`${pendingBreakdown.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
              className="small-kpi"
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('pending', 'TRY'); }}>
            <KPICard 
              title={t('income.tryPending', 'TL Bekleyen (TRY)')}
              value={`₺${pendingBreakdown.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(pendingBreakdown.TRY, 'TRY')}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('pending', 'all'); }}>
            <KPICard 
              title={t('income.totalPendingParam', 'Toplam Bekleyen ({{currency}})', { currency: displayCurrency })}
              value={`${displaySymbol}${totalPendingVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2 }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,25 Q15,35 30,20 T60,25 T85,15 T100,20 L100,40 Z" fill="#F59E0B" />
                <path d="M0,25 Q15,35 30,20 T60,25 T85,15 T100,20" fill="none" stroke="#F59E0B" strokeWidth="2" />
              </svg>
            </KPICard>
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <h2 className="kpi-section-title"><AlertCircle size={18} color="var(--danger)" /> {t('income.kpi.overdueInvoices')}</h2>
        <div className="kpi-row" style={{ cursor: onFilterClick ? 'pointer' : 'default', opacity: activeFilter === 'overdue' ? 1 : (activeFilter === 'all' ? 1 : 0.6) }}>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('overdue', 'USD'); }}>
            <KPICard 
              title={t('income.usdOverdue', 'Dolar Geciken (USD)')}
              value={`$${overdueBreakdown.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(overdueBreakdown.USD, 'USD')}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('overdue', 'SAR'); }}>
            <KPICard 
              title={t('income.sarOverdue', 'Riyal Geciken (SAR)')}
              value={`${overdueBreakdown.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
              className="small-kpi"
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('overdue', 'TRY'); }}>
            <KPICard 
              title={t('income.tryOverdue', 'TL Geciken (TRY)')}
              value={`₺${overdueBreakdown.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              className="small-kpi"
              equivalentStr={getEqStr(overdueBreakdown.TRY, 'TRY')}
            />
          </div>
          <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onFilterClick && onFilterClick('overdue', 'all'); }}>
            <KPICard 
              title={t('income.totalOverdueParam', 'Toplam Geciken ({{currency}})', { currency: displayCurrency })}
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
