import { Globe } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { Button } from '../ui/Button';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
];

export function LanguageSelector() {
  const { currentLanguage, changeLanguage } = useLocale();

  return (
    <div className="relative w-full">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
      <Globe className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}