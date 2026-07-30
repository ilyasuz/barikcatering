import { KPICard } from '../../../core/components/Card/KPICard';
import { Landmark, Wallet, Globe, ArrowRightLeft } from 'lucide-react';
import type { AccountRecord } from '../types';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { convertToBase, getDisplayCurrency, getDisplaySymbol } from '../../../core/utils/currencyUtils';
import { useTranslation } from 'react-i18next';
import '../../income/Income.css'; 

interface AccountKPIsProps {
  data?: AccountRecord[];
}

export function AccountKPIs({ data = [] }: AccountKPIsProps) {
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

  const bankAccounts = data.filter(a => a.type === 'Banka');
  const cashAccounts = data.filter(a => a.type === 'Kasa');

  const totalBank = bankAccounts.reduce((sum, item) => sum + toDisplay(item.balance || 0, item.currency || 'TRY'), 0);
  const totalCash = cashAccounts.reduce((sum, item) => sum + toDisplay(item.balance || 0, item.currency || 'TRY'), 0);
  const totalVolume = data.reduce((sum, item) => sum + toDisplay(item.balance || 0, item.currency || 'TRY'), 0);

  const trCount = data.filter(a => a.region === 'Türkiye').length;
  const totalCount = data.length;
  const trPercentage = totalCount > 0 ? Math.round((trCount / totalCount) * 100) : 0;

  const formatVal = (v: number) => `${displaySymbol}${v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="income-kpi-grid">
      <KPICard 
        title={t('accounts.totalBankAsset', 'Toplam Banka Varlığı')}
        value={formatVal(totalBank)}
        icon={<Landmark size={20} color="#3B82F6" />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,25 Q15,35 30,20 T60,25 T85,15 T100,20 L100,40 Z" fill="#3B82F6" />
          <path d="M0,25 Q15,35 30,20 T60,25 T85,15 T100,20" fill="none" stroke="#3B82F6" strokeWidth="2" />
        </svg>
      </KPICard>

      <KPICard 
        title={t('accounts.totalCash', 'Toplam Kasa (Nakit)')}
        value={formatVal(totalCash)}
        icon={<Wallet size={20} color="#10B981" />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5 L100,40 Z" fill="#10B981" />
          <path d="M0,20 Q10,15 20,25 T40,15 T60,25 T80,10 T100,5" fill="none" stroke="#10B981" strokeWidth="2" />
        </svg>
      </KPICard>
      
      <KPICard 
        title={t('accounts.regionalCashDist', 'Bölgesel Nakit Dağılımı')}
        value="TR / KSA"
        icon={<Globe size={20} color="#8B5CF6" />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,20 Q15,30 30,10 T60,25 T80,5 T100,15 L100,40 Z" fill="#8B5CF6" />
          <path d="M0,20 Q15,30 30,10 T60,25 T80,5 T100,15" fill="none" stroke="#8B5CF6" strokeWidth="2" />
        </svg>
      </KPICard>

      <KPICard 
        title={t('accounts.totalVolume', 'Toplam İşlem Hacmi')}
        value={formatVal(totalVolume)}
        icon={<ArrowRightLeft size={20} color="#F59E0B" />}
      >
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15 }} preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d="M0,40 L0,30 Q20,20 40,35 T70,25 T100,10 L100,40 Z" fill="#F59E0B" />
          <path d="M0,30 Q20,20 40,35 T70,25 T100,10" fill="none" stroke="#F59E0B" strokeWidth="2" />
        </svg>
      </KPICard>
    </div>
  );
}
