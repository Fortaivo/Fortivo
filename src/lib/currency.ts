import { supabase } from './supabase';

export type Currency = 'USD' | 'EUR' | 'BRL' | 'MXN' | 'ARS' | 'COP';

interface ExchangeRate {
  currency: Currency;
  rate: number;
  last_updated: string;
}

export async function getExchangeRates(): Promise<Record<Currency, number>> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('last_updated', { ascending: false })
    .limit(1);

  if (error) throw error;
  
  const rates = data[0]?.rates || {};
  return {
    USD: 1, // Base currency
    ...rates
  };
}

export function formatCurrency(
  amount: number,
  currency: Currency = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: Record<Currency, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  
  return (amount / fromRate) * toRate;
}