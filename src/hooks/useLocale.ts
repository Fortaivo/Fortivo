import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import type { Currency } from '../lib/currency';

export function useLocale() {
  const { i18n } = useTranslation();
  const [currency, setCurrency] = useLocalStorage<Currency>('preferred-currency', 'USD');

  const changeLanguage = async (language: string) => {
    await i18n.changeLanguage(language);
  };

  const changeCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
  };

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    currentCurrency: currency,
    changeCurrency,
  };
}