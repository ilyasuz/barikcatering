import { useTranslation } from 'react-i18next';
import { KPICard } from '../../../core/components/Card/KPICard';
import { Users, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import type { CompanyRecord } from '../types';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { convertToBase, getDisplayCurrency, getDisplaySymbol } from '../../../core/utils/currencyUtils';
import '../../income/Income.css'; 

interface CompanyKPIsProps {
  data?: CompanyRecord[];
}

export function CompanyKPIs({ data = [] }: CompanyKPIsProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const { rates, baseCurrency } = useExchangeRates();

  const displayCurrency = getDisplayCurrency(region, baseCurrency);
  const displaySymbol = getDisplaySymbol(displayCurrency);
  const isAllRegions = region === 'all';

  const toDisplay = (amount: number, currency: string): number => {
    if (!isAllRegions) return amount;
    return convertToBase(amount, currency, baseCurrency, rates);
  };

  const totalActive = data.length;
  const customers = data.filter(c => c.type === 'Müşteri');
  const suppliers = data.filter(c => c.type === 'Tedarikçi');

  const totalReceivables = customers.reduce((sum, item) => sum + toDisplay(item.balance || 0, item.currency || 'TRY'), 0);
  const totalPayables = suppliers.reduce((sum, item) => sum + toDisplay(Math.abs(item.balance || 0), item.currency || 'TRY'), 0);

  const ksaCount = data.filter(c => c.region === 'Arabistan' || c.currency === 'SAR').length;
  const ksaPercentage = totalActive > 0 ? Math.round((ksaCount / totalActive) * 100) : 0;

  const formatVal = (v: number) => `${displaySymbol}${v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="income-kpi-grid">
      <KPICard 
        title={t('companies.totalActiveCompanies', 'Toplam Aktif Cari')} 
        value={t('companies.companyCount', '{{count}} Firma', { count: totalActive })}
        icon={<Users size={20} />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,25 Q15,35 30,20 T60,25 T85,15 T100,20 L100,40 Z" fill="#6B7280" />
          <path d="M0,25 Q15,35 30,20 T60,25 T85,15 T100,20" fill="none" stroke="#6B7280" strokeWidth="2" />
        </svg>
      </KPICard>

      <KPICard 
        title={t('companies.totalReceivables', 'Toplam Alacak (Müşteriler)')} 
        value={formatVal(totalReceivables)}
        icon={<ArrowUpRight size={20} color="#10B981" />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5 L100,40 Z" fill="#10B981" />
          <path d="M0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5" fill="none" stroke="#10B981" strokeWidth="2" />
        </svg>
      </KPICard>
      
      <KPICard 
        title={t('companies.totalPayables', 'Toplam Borç (Tedarikçiler)')} 
        value={formatVal(totalPayables)}
        icon={<ArrowDownRight size={20} color="#EF4444" />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,30 Q20,20 40,35 T70,25 T100,10 L100,40 Z" fill="#EF4444" />
          <path d="M0,30 Q20,20 40,35 T70,25 T100,10" fill="none" stroke="#EF4444" strokeWidth="2" />
        </svg>
      </KPICard>

      <KPICard 
        title={t('companies.regionDistribution', 'Bölge Dağılımı')} 
        value={t('companies.trKsa', 'TR / KSA')}
        icon={<Globe size={20} color="#3B82F6" />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,20 Q15,30 30,10 T60,25 T80,5 T100,15 L100,40 Z" fill="#3B82F6" />
          <path d="M0,20 Q15,30 30,10 T60,25 T80,5 T100,15" fill="none" stroke="#3B82F6" strokeWidth="2" />
        </svg>
      </KPICard>
    </div>
  );
}
