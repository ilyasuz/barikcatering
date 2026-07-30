import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart as PieChartIcon, TrendingUp, TrendingDown, Activity, Globe,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend
} from 'recharts';
import { KPICard } from '../core/components/Card/KPICard';
import { supabase } from '../lib/supabase';
import { useRegion } from '../core/contexts/RegionContext';
import { useExchangeRates } from '../core/contexts/ExchangeRatesContext';
import { convertToBase, getDisplayCurrency, getDisplaySymbol } from '../core/utils/currencyUtils';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];

type ReportPeriod = 'thisMonth' | 'thisYear' | 'lastYear' | 'all';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      backgroundColor: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: p.color, marginTop: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
          <span>{p.name}: {Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div style={{
      backgroundColor: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', padding: '10px 14px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{d.name}</div>
      <div style={{ fontSize: '12px', color: d.payload.fill, marginTop: '4px' }}>
        {Number(d.value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({d.payload.percent}%)
      </div>
    </div>
  );
};

export function ReportsPage() {
  const { t } = useTranslation();
  const { region } = useRegion();
  const { rates, baseCurrency } = useExchangeRates();

  const [period, setPeriod] = useState<ReportPeriod>('thisYear');
  const [isLoading, setIsLoading] = useState(true);

  const MONTH_NAMES = [
    t('common.months.jan', 'Oca'), t('common.months.feb', 'Şub'), t('common.months.mar', 'Mar'),
    t('common.months.apr', 'Nis'), t('common.months.may', 'May'), t('common.months.jun', 'Haz'),
    t('common.months.jul', 'Tem'), t('common.months.aug', 'Ağu'), t('common.months.sep', 'Eyl'),
    t('common.months.oct', 'Eki'), t('common.months.nov', 'Kas'), t('common.months.dec', 'Ara')
  ];

  // The currency used for display depends on region selection
  const displayCurrency = getDisplayCurrency(region, baseCurrency);
  const displaySymbol = getDisplaySymbol(displayCurrency);
  const isAllRegions = region === 'all';

  // Data states
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [incomeByCat, setIncomeByCat] = useState<any[]>([]);
  const [expenseByCat, setExpenseByCat] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [region, period, rates, baseCurrency]);

  const getDateFilter = () => {
    const now = new Date();
    switch (period) {
      case 'thisMonth':
        return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: null };
      case 'thisYear':
        return { from: `${now.getFullYear()}-01-01`, to: null };
      case 'lastYear':
        return { from: `${now.getFullYear() - 1}-01-01`, to: `${now.getFullYear() - 1}-12-31` };
      default:
        return { from: null, to: null };
    }
  };

  /**
   * Converts an amount to the display currency.
   * - When a specific region is selected, amounts are already in the local currency → no conversion needed.
   * - When "Tüm Şubeler" is selected, convert everything to baseCurrency.
   */
  const toDisplay = (amount: number, currency: string): number => {
    if (!isAllRegions) return amount; // region-specific: keep raw value
    return convertToBase(amount, currency, baseCurrency, rates);
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const dateFilter = getDateFilter();

      let incQuery = supabase.from('income').select('amount, currency, category, date, status, region, company_id, title');
      if (region !== 'all') incQuery = incQuery.eq('region', region);
      if (dateFilter.from) incQuery = incQuery.gte('date', dateFilter.from);
      if (dateFilter.to) incQuery = incQuery.lte('date', dateFilter.to);
      const { data: incomes } = await incQuery;

      let expQuery = supabase.from('expenses').select('amount, currency, category, date, status, region, company_id, title');
      if (region !== 'all') expQuery = expQuery.eq('region', region);
      if (dateFilter.from) expQuery = expQuery.gte('date', dateFilter.from);
      if (dateFilter.to) expQuery = expQuery.lte('date', dateFilter.to);
      const { data: expenses } = await expQuery;

      const inc = incomes || [];
      const exp = expenses || [];

      // --- KPI totals ---
      const incTotal = inc.reduce((s, i) => s + toDisplay(Number(i.amount), i.currency || 'TRY'), 0);
      const expTotal = exp.reduce((s, e) => s + toDisplay(Number(e.amount), e.currency || 'TRY'), 0);
      setTotalIncome(incTotal);
      setTotalExpense(expTotal);

      // --- Monthly Trend ---
      const monthly: Record<string, { name: string; income: number; expense: number; net: number; sortKey: number }> = {};
      const buildMonthly = (items: any[], type: 'income' | 'expense') => {
        items.forEach(item => {
          if (!item.date) return;
          const d = new Date(item.date);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (!monthly[key]) {
            monthly[key] = {
              name: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
              income: 0, expense: 0, net: 0,
              sortKey: new Date(d.getFullYear(), d.getMonth(), 1).getTime()
            };
          }
          monthly[key][type] += toDisplay(Number(item.amount), item.currency || 'TRY');
        });
      };
      buildMonthly(inc, 'income');
      buildMonthly(exp, 'expense');
      const sortedMonthly = Object.values(monthly)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ sortKey, ...rest }) => ({ ...rest, net: rest.income - rest.expense }));
      setMonthlyData(sortedMonthly.length > 0 ? sortedMonthly : [{ name: '-', income: 0, expense: 0, net: 0 }]);

      // --- Income by category ---
      const incCat: Record<string, number> = {};
      inc.forEach(i => {
        const cat = i.category || t('common.other', 'Diğer');
        incCat[cat] = (incCat[cat] || 0) + toDisplay(Number(i.amount), i.currency || 'TRY');
      });
      const incCatTotal = Object.values(incCat).reduce((s, v) => s + v, 0) || 1;
      setIncomeByCat(Object.entries(incCat).map(([name, value]) => ({
        name, value: Math.round(value * 100) / 100,
        percent: ((value / incCatTotal) * 100).toFixed(1)
      })).sort((a, b) => b.value - a.value));

      // --- Expense by category ---
      const expCat: Record<string, number> = {};
      exp.forEach(e => {
        const cat = e.category || t('common.other', 'Diğer');
        expCat[cat] = (expCat[cat] || 0) + toDisplay(Number(e.amount), e.currency || 'TRY');
      });
      const expCatTotal = Object.values(expCat).reduce((s, v) => s + v, 0) || 1;
      setExpenseByCat(Object.entries(expCat).map(([name, value]) => ({
        name, value: Math.round(value * 100) / 100,
        percent: ((value / expCatTotal) * 100).toFixed(1)
      })).sort((a, b) => b.value - a.value));

      // --- Region comparison (only meaningful in 'all' mode, but still show) ---
      const regionAgg: Record<string, { income: number; expense: number }> = {};
      inc.forEach(i => {
        const r = i.region || t('common.unknown', 'Bilinmiyor');
        if (!regionAgg[r]) regionAgg[r] = { income: 0, expense: 0 };
        regionAgg[r].income += toDisplay(Number(i.amount), i.currency || 'TRY');
      });
      exp.forEach(e => {
        const r = e.region || t('common.unknown', 'Bilinmiyor');
        if (!regionAgg[r]) regionAgg[r] = { income: 0, expense: 0 };
        regionAgg[r].expense += toDisplay(Number(e.amount), e.currency || 'TRY');
      });
      setRegionData(Object.entries(regionAgg).map(([name, d]) => ({
        name: name === 'Türkiye' ? t('region.turkey', 'Türkiye 🇹🇷') : name === 'Arabistan' ? t('region.saudi', 'Arabistan 🇸🇦') : name,
        income: Math.round(d.income * 100) / 100,
        expense: Math.round(d.expense * 100) / 100,
        net: Math.round((d.income - d.expense) * 100) / 100
      })));

      // --- Payment status breakdown ---
      const statAgg: Record<string, { incomeCount: number; expenseCount: number; incomeAmt: number; expenseAmt: number }> = {};
      const statusLabels: Record<string, string> = { completed: t('common.completed', 'Ödendi'), pending: t('common.pending', 'Bekliyor'), overdue: t('common.overdue', 'Gecikmiş') };
      inc.forEach(i => {
        const s = statusLabels[i.status] || i.status || t('common.other', 'Diğer');
        if (!statAgg[s]) statAgg[s] = { incomeCount: 0, expenseCount: 0, incomeAmt: 0, expenseAmt: 0 };
        statAgg[s].incomeCount++;
        statAgg[s].incomeAmt += toDisplay(Number(i.amount), i.currency || 'TRY');
      });
      exp.forEach(e => {
        const s = statusLabels[e.status] || e.status || t('common.other', 'Diğer');
        if (!statAgg[s]) statAgg[s] = { incomeCount: 0, expenseCount: 0, incomeAmt: 0, expenseAmt: 0 };
        statAgg[s].expenseCount++;
        statAgg[s].expenseAmt += toDisplay(Number(e.amount), e.currency || 'TRY');
      });
      setStatusData(Object.entries(statAgg).map(([name, d]) => ({
        name, ...d,
        total: d.incomeAmt + d.expenseAmt,
        count: d.incomeCount + d.expenseCount
      })));

      // --- Top companies ---
      const compAgg: Record<string, number> = {};
      inc.forEach(i => {
        const name = i.title || t('common.unknown', 'Bilinmiyor');
        compAgg[name] = (compAgg[name] || 0) + toDisplay(Number(i.amount), i.currency || 'TRY');
      });
      const sorted = Object.entries(compAgg).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const compTotal = sorted.reduce((s, [, v]) => s + v, 0) || 1;
      setTopCompanies(sorted.map(([name, value]) => ({
        name, value: Math.round(value * 100) / 100,
        percent: ((value / compTotal) * 100).toFixed(1)
      })));

    } catch (err) {
      console.error(t('reports.errorLoading', 'Rapor verisi yüklenirken hata:'), err);
    } finally {
      setIsLoading(false);
    }
  };

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

  const periodLabels: Record<ReportPeriod, string> = {
    thisMonth: t('common.thisMonth', 'Bu Ay'), thisYear: t('common.thisYear', 'Bu Yıl'), lastYear: t('common.lastYear', 'Geçen Yıl'), all: t('common.allTime', 'Tüm Zamanlar')
  };

  const formatVal = (v: number) => `${displaySymbol}${v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('reports.title', 'Raporlar & Analizler')}</h1>
          <p className="text-muted">{t('reports.subtitle', 'Şirketin genel finansal performansını ve bölgesel özetlerini inceleyin.')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', padding: '4px',
            borderRadius: '10px', border: '1px solid var(--border-color)'
          }}>
            {(Object.keys(periodLabels) as ReportPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: period === p ? 'var(--accent)' : 'transparent',
                  color: period === p ? '#fff' : 'var(--text-muted)'
                }}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('reports.loading', 'Rapor Yükleniyor...')}</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="dashboard-grid">
            <KPICard
              title={`${t('reports.totalIncome', 'Toplam Gelir')} (${periodLabels[period]})`}
              value={formatVal(totalIncome)}
              icon={<TrendingUp size={22} color="#10B981" />}
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5 L100,40 Z" fill="#10B981" />
              </svg>
            </KPICard>
            <KPICard
              title={`${t('reports.totalExpense', 'Toplam Gider')} (${periodLabels[period]})`}
              value={formatVal(totalExpense)}
              icon={<TrendingDown size={22} color="#EF4444" />}
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,30 Q20,20 40,35 T70,25 T100,10 L100,40 Z" fill="#EF4444" />
              </svg>
            </KPICard>
            <KPICard
              title={t('reports.netProfitLoss', 'Net Kâr / Zarar')}
              value={formatVal(netProfit)}
              trend={{ value: profitMargin, label: netProfit >= 0 ? t('reports.inProfit', 'Kârda') : t('reports.inLoss', 'Zararda'), isPositive: netProfit >= 0 }}
              icon={<Activity size={22} color={netProfit >= 0 ? '#10B981' : '#EF4444'} />}
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,25 Q15,35 30,20 T60,25 T85,15 T100,20 L100,40 Z" fill="#8B5CF6" />
              </svg>
            </KPICard>
            <KPICard
              title={t('reports.profitMargin', 'Kâr Marjı')}
              value={`%${profitMargin}`}
              icon={<Globe size={22} color="#3B82F6" />}
            >
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, borderRadius: '0 0 var(--border-radius) var(--border-radius)' }} preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,40 L0,20 Q15,30 30,10 T60,25 T80,5 T100,15 L100,40 Z" fill="#3B82F6" />
              </svg>
            </KPICard>
          </div>

          {/* Row 1: Monthly Trend + Region */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--accent)" /> {t('reports.monthlyTrend', 'Aylık Gelir / Gider Trendi')} ({displaySymbol.trim()})
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="income" name={t('common.income', 'Gelir')} stroke="#10B981" strokeWidth={2} fill="url(#incGrad)" />
                    <Area type="monotone" dataKey="expense" name={t('common.expense', 'Gider')} stroke="#EF4444" strokeWidth={2} fill="url(#expGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="var(--accent)" /> {t('reports.regionalComparison', 'Bölgesel Karşılaştırma')}
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="income" name={t('common.income', 'Gelir')} fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
                    <Bar dataKey="expense" name={t('common.expense', 'Gider')} fill="#EF4444" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Pie Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            {/* Income by Category */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={18} color="#10B981" /> {t('reports.incomeCategories', 'Gelir Kategorileri Dağılımı')}
              </h3>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '200px', height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={incomeByCat} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke="none" paddingAngle={2}>
                        {incomeByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {incomeByCat.map((cat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>{cat.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.percent}%</span>
                    </div>
                  ))}
                  {incomeByCat.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('common.noData', 'Veri bulunamadı')}</span>}
                </div>
              </div>
            </div>

            {/* Expense by Category */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={18} color="#EF4444" /> {t('reports.expenseCategories', 'Gider Kategorileri Dağılımı')}
              </h3>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '200px', height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCat} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke="none" paddingAngle={2}>
                        {expenseByCat.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {expenseByCat.map((cat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[(i + 3) % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>{cat.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.percent}%</span>
                    </div>
                  ))}
                  {expenseByCat.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('common.noData', 'Veri bulunamadı')}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Net Profit Bar + Status + Top Companies */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#8B5CF6" /> {t('reports.monthlyNetProfit', 'Aylık Net Kâr')} ({displaySymbol.trim()})
              </h3>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Bar dataKey="net" name={t('reports.netProfit', 'Net Kâr')} radius={[4, 4, 0, 0]} barSize={28}>
                      {monthlyData.map((entry, i) => <Cell key={i} fill={entry.net >= 0 ? '#10B981' : '#EF4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Payment Status */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={18} color="var(--accent)" /> {t('reports.paymentStatusDistribution', 'Ödeme Durumu Dağılımı')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {statusData.map((s, i) => {
                    const totalAll = statusData.reduce((sum, x) => sum + x.total, 0) || 1;
                    const pct = (s.total / totalAll) * 100;
                    const barColor = s.name === t('common.completed', 'Ödendi') ? '#10B981' : s.name === t('common.pending', 'Bekliyor') ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{s.name} ({t('reports.recordCount', '{{count}} kayıt', { count: s.count })})</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: barColor }}>{formatVal(s.total)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  {statusData.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('common.noData', 'Veri bulunamadı')}</span>}
                </div>
              </div>

              {/* Top Companies */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#F59E0B" /> {t('reports.topIncomeSources', 'En Yüksek Gelir Kaynakları')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topCompanies.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: COLORS[i % COLORS.length] + '20',
                        color: COLORS[i % COLORS.length],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, flexShrink: 0
                      }}>{i + 1}</div>
                      <div style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.percent}%</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>{formatVal(c.value)}</div>
                    </div>
                  ))}
                  {topCompanies.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('common.noData', 'Veri bulunamadı')}</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
