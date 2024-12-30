import { DollarSign } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import type { Currency } from '../../lib/currency';

const CURRENCIES: { code: Currency; name: string }[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'COP', name: 'Colombian Peso' },
];

export function CurrencySelector() {
  const { currentCurrency, changeCurrency } = useLocale();

  return (
    <div className="relative w-full">
      <select
        value={currentCurrency}
        onChange={(e) => changeCurrency(e.target.value as Currency)}
        className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.name}
          </option>
        ))}
      </select>
      <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}