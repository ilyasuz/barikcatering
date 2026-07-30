import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Using open.er-api.com for free daily exchange rates
const API_URL = 'https://open.er-api.com/v6/latest/USD';

interface ExchangeRatesContextType {
  rates: Record<string, number>;
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
  isLoading: boolean;
  error: string | null;
  refreshRates: () => Promise<void>;
}

const ExchangeRatesContext = createContext<ExchangeRatesContextType | undefined>(undefined);

export function ExchangeRatesProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrencyState] = useState<string>(
    localStorage.getItem('barik_base_currency') || 'USD'
  );
  
  const setBaseCurrency = (currency: string) => {
    setBaseCurrencyState(currency);
    localStorage.setItem('barik_base_currency', currency);
  };

  // Default fallbacks in case API fails
  const [rates, setRates] = useState<Record<string, number>>({
    TRY: 33.50,
    SAR: 3.75,
    EUR: 0.92,
    USD: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      const data = await response.json();
      if (data && data.rates) {
        setRates(prev => ({
          ...prev,
          ...data.rates
        }));
      }
    } catch (err: any) {
      console.error('Error fetching rates:', err);
      setError(err.message || 'Kurlar alınamadı, varsayılan kurlar kullanılıyor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Refresh rates every 12 hours
    const interval = setInterval(fetchRates, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ExchangeRatesContext.Provider value={{ rates, baseCurrency, setBaseCurrency, isLoading, error, refreshRates: fetchRates }}>
      {children}
    </ExchangeRatesContext.Provider>
  );
}

export function useExchangeRates() {
  const context = useContext(ExchangeRatesContext);
  if (context === undefined) {
    throw new Error('useExchangeRates must be used within an ExchangeRatesProvider');
  }
  return context;
}
