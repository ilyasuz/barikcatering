import './Typography.css';

interface CurrencyDisplayProps {
  amount: number;
  currency?: 'TRY' | 'USD' | 'EUR' | 'SAR';
  showSymbol?: boolean;
  className?: string;
}

const currencySymbols: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  SAR: 'SAR'
};

import { useRegion } from '../../contexts/RegionContext';

export function CurrencyDisplay({ 
  amount, 
  currency, 
  showSymbol = true,
  className = ''
}: CurrencyDisplayProps) {
  const { region } = useRegion();
  const actualCurrency = currency || (region === 'Arabistan' ? 'SAR' : 'TRY');
  const isPositive = amount >= 0;
  
  const formattedAmount = Math.abs(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const symbol = showSymbol ? currencySymbols[actualCurrency] || actualCurrency : '';

  return (
    <span className={`currency-display ${isPositive ? 'positive' : 'negative'} ${className}`}>
      {isPositive ? '' : '-'}
      {symbol && <span className="currency-symbol">{symbol}</span>}
      {formattedAmount}
      {!showSymbol && <span className="currency-code"> {actualCurrency}</span>}
    </span>
  );
}
