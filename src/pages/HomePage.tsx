import { useNavigate } from 'react-router-dom';
import { Package, Users, FileText, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../hooks/useAssets';
import { useLocale } from '../hooks/useLocale';
import { formatCurrency } from '../lib/currency';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../lib/routes';

export function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { assets } = useAssets();
  const { currentCurrency } = useLocale();

  const totalValue = assets.reduce((sum, asset) => sum + (asset.estimated_value || 0), 0);
  const recentAssets = assets.slice(0, 5);

  const stats = [
    { name: t('home.stats.totalAssets'), value: '1,000+' },
    { name: t('home.stats.activeUsers'), value: '50,000+' },
    { name: t('home.stats.documentSecured'), value: '100,000+' },
    { name: t('home.stats.satisfaction'), value: '99%' },
  ];

  const features = [
    { name: t('common.navigation.assets'), icon: Package, route: ROUTES.ASSETS, description: t('home.features.assets') },
    { name: t('common.navigation.beneficiaries'), icon: Users, route: ROUTES.BENEFICIARIES, description: t('home.features.beneficiaries') },
    { name: t('common.navigation.documents'), icon: FileText, route: ROUTES.ASSETS, description: t('home.features.documents') },
    { name: t('common.navigation.subscription'), icon: CreditCard, route: ROUTES.SUBSCRIPTION, description: t('home.features.subscription') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl mb-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative px-8 py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('home.hero.title')}
            </h1>
            <p className="mt-6 text-xl text-indigo-100">
              {t('home.hero.description')}
              {t('home.hero.features', { returnObjects: true }).map((feature, index) => (
                <span key={index} className="block">• {feature}</span>
              ))}
            </p>
            <div className="mt-10">
              <Button
                onClick={() => navigate(ROUTES.ASSETS)}
                size="lg"
                className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg"
              >
                {t('home.hero.cta')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-16">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6 text-center">
            <dt className="text-sm font-medium text-gray-500">{stat.name}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-indigo-600">{stat.value}</dd>
          </div>
        ))}
      </div>

      {/* User's Asset Dashboard */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('home.stats.dashboard.title')}
        </h2>
        
        {assets.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-indigo-600 font-medium">
                  {t('home.stats.dashboard.totalValue')}
                </div>
                <div className="text-2xl font-bold text-indigo-900">
                  {formatCurrency(totalValue, currentCurrency)}
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-indigo-600 font-medium">
                  {t('home.stats.dashboard.assetCount')}
                </div>
                <div className="text-2xl font-bold text-indigo-900">
                  {assets.length}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('home.stats.dashboard.recentActivity')}
              </h3>
              <div className="space-y-2">
                {recentAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{asset.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{asset.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {asset.estimated_value 
                          ? formatCurrency(asset.estimated_value, currentCurrency)
                          : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {t('home.stats.dashboard.noAssets')}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('home.features.title')}</h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <feature.icon className="h-12 w-12 text-indigo-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">{feature.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
              <Button
                onClick={() => navigate(feature.route)}
                className="mt-4 w-full"
              >
                View {feature.name}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}