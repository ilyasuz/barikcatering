export const convertToBase = (
  amount: number, 
  currency: string, 
  baseCurrency: string, 
  rates: Record<string, number>
): number => {
  if (!amount) return 0;
  if (currency === baseCurrency) return amount;
  
  // The API returns rates as 1 USD = X Currency.
  // First convert to USD
  let amountInUSD = amount;
  if (currency !== 'USD') {
    const rate = rates[currency];
    if (!rate) return 0;
    amountInUSD = amount / rate;
  }
  
  // Then convert from USD to baseCurrency
  if (baseCurrency === 'USD') {
    return amountInUSD;
  }
  
  const baseRate = rates[baseCurrency];
  if (!baseRate) return 0;
  return amountInUSD * baseRate;
};

export const calculateTotalBase = (
  items: { amount?: number; currency?: string; paidAmount?: number }[],
  baseCurrency: string,
  rates: Record<string, number>,
  usePaidAmount = false
): number => {
  return items.reduce((sum, item) => {
    const val = usePaidAmount ? (item.paidAmount || 0) : (item.amount || 0);
    const curr = item.currency || 'TRY'; // fallback
    return sum + convertToBase(val, curr, baseCurrency, rates);
  }, 0);
};

export const formatCurrencyValue = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Determines which currency to use for display based on region selection.
 * - 'all' (Tüm Şubeler) → baseCurrency (e.g. USD)
 * - 'Türkiye' → TRY
 * - 'Arabistan' → SAR
 */
export const getDisplayCurrency = (region: string, baseCurrency: string): string => {
  if (region === 'all') return baseCurrency;
  if (region === 'Arabistan') return 'SAR';
  return 'TRY';
};

export const getDisplaySymbol = (currency: string): string => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'TRY': return '₺';
    case 'SAR': return 'SAR ';
    default: return currency + ' ';
  }
};
