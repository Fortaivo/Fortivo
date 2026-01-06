import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { type Asset } from '../../types/database';
import { Button } from '../ui/Button';
import { useLocale } from '../../hooks/useLocale';
import { formatCurrency } from '../../lib/currency';

type FilterType = 'all' | 'financial' | 'physical' | 'digital' | 'other';

interface AssetListProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onAdd: () => void;
}

export function AssetList({ assets, onEdit, onDelete, onAdd }: AssetListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentCurrency } = useLocale();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>('all');

  const beneficiaries = useMemo(() => {
    const unique = new Set(assets.map(asset => asset.beneficiary?.full_name).filter(Boolean));
    return Array.from(unique);
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = search.toLowerCase() === '' ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.location?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      
      const matchesBeneficiary = beneficiaryFilter === 'all' ||
        (beneficiaryFilter === 'none' && !asset.beneficiary) ||
        asset.beneficiary?.full_name === beneficiaryFilter;

      return matchesSearch && matchesType && matchesBeneficiary;
    });
  }, [assets, search, typeFilter, beneficiaryFilter]);

  if (assets.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <Plus className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('assets.empty.title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('assets.empty.description')}</p>
        <div className="mt-6">
          <Button onClick={onAdd}>
            <Plus className="h-5 w-5 mr-2" />
            {t('common.actions.add')} {t('assets.title')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('assets.filters.search')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{t('assets.filters.allTypes')}</option>
            <option value="financial">{t('assets.types.financial')}</option>
            <option value="physical">{t('assets.types.physical')}</option>
            <option value="digital">{t('assets.types.digital')}</option>
            <option value="other">{t('assets.types.other')}</option>
          </select>

          <select
            value={beneficiaryFilter}
            onChange={(e) => setBeneficiaryFilter(e.target.value)}
            className="border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{t('assets.filters.allBeneficiaries')}</option>
            <option value="none">{t('assets.filters.noBeneficiary')}</option>
            {beneficiaries.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-1/4 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('assets.table.name')}</th>
            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('assets.table.type')}</th>
            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('assets.table.value')}</th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('assets.table.location')}</th>
            <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('assets.table.beneficiary')}</th>
            <th className="w-1/4 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('assets.table.actions')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAssets.map((asset) => (
            <tr key={asset.id}>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.name}</td>
              <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{asset.type}</td>
              <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {asset.estimated_value ? formatCurrency(asset.estimated_value, currentCurrency) : '-'}
              </td>
              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location || '-'}</td>
              <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.beneficiary?.full_name || '-'}</td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(asset)}
                    >
                      {t('common.actions.edit')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/assets/${asset.id}/documents`)}
                    >
                      {t('common.navigation.documents')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(t('assets.table.confirmDelete'))) {
                          onDelete(asset);
                        }
                      }}
                    >
                      {t('common.actions.delete')}
                    </Button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </div>
    </div>
  );
}