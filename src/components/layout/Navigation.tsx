import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, NavLink } from 'react-router-dom';
import { Home, User, Package, Users, FileText, CreditCard } from 'lucide-react';
import { Menu, X } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { CurrencySelector } from './CurrencySelector';
import { ROUTES } from '../../lib/routes';
import { cn } from '../../lib/utils';

export function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: t('common.navigation.home'), href: ROUTES.HOME, icon: Home },
    { name: t('common.navigation.profile'), href: ROUTES.PROFILE, icon: User },
    { name: t('common.navigation.assets'), href: ROUTES.ASSETS, icon: Package },
    { name: t('common.navigation.beneficiaries'), href: ROUTES.BENEFICIARIES, icon: Users },
    { name: t('common.navigation.documents'), href: ROUTES.ASSETS, icon: FileText },
    { name: t('common.navigation.subscription'), href: ROUTES.SUBSCRIPTION, icon: CreditCard },
  ];

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
      >
        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      
      <div className={cn(
        "space-y-6 lg:block",
        isMenuOpen ? "block" : "hidden"
      )}>      
      <nav className="space-y-1">
        {navigation.map((item) => {
        const isActive = location.pathname === item.href ||
          (item.name === t('common.navigation.documents') && location.pathname.includes('/documents'));

        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
              isActive
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon
              className={cn(
                'flex-shrink-0 -ml-1 mr-3 h-6 w-6',
                isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
              )}
            />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
      </nav>

      <div className="mt-auto pt-6 border-t">
        <div className="space-y-2 px-3">
          <LanguageSelector />
          <CurrencySelector />
        </div>
      </div>
    </div>
    </>
  );
}