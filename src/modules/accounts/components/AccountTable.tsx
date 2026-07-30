import { useState } from 'react';
import { Eye, Landmark, Wallet, Plus, ArrowRightLeft, Trash2 } from 'lucide-react';
import { DataTable } from '../../../core/components/DataTable/DataTable';
import type { Column } from '../../../core/components/DataTable/DataTable';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { FilterBar } from '../../../core/components/FilterBar/FilterBar';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import type { AccountGroup } from '../types';
import { useTranslation } from 'react-i18next';

interface AccountTableProps {
  data: AccountGroup[];
  onAddNew: () => void;
  onRowClick?: (item: AccountGroup) => void;
  onTransferClick?: () => void;
  onDeleteMultiple?: (ids: string[]) => void;
}

export function AccountTable({ data, onAddNew, onRowClick, onTransferClick, onDeleteMultiple }: AccountTableProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const columns: Column<AccountGroup>[] = [
    {
      key: 'typeIcon',
      header: '',
      width: '50px',
      render: (item) => (
        <div style={{ 
          width: '36px', height: '36px', borderRadius: '8px',
          backgroundColor: item.type === 'Banka' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {item.type === 'Banka' ? <Landmark size={18} color="#3B82F6" /> : <Wallet size={18} color="#10B981" />}
        </div>
      )
    },
    { 
      key: 'name', 
      header: t('accounts.accountName', 'Hesap Adı'),
      width: '250px',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.baseName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.bankName || t('accounts.physicalCash', 'Fiziksel Kasa')}</div>
        </div>
      )
    },
    { 
      key: 'region', 
      header: t('common.region', 'Bölge'), 
      width: '120px',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {item.region === 'Türkiye' ? '🇹🇷' : '🇸🇦'}
          <span style={{ fontSize: '13px' }}>{item.region}</span>
        </div>
      )
    },
    { 
      key: 'details', 
      header: t('accounts.accountDetails', 'Hesap Bilgileri'),
      width: '200px',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {item.iban ? (
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{item.iban}</div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</div>
          )}
          {item.accountNumber && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('accounts.accountNo', 'Hesap No')}: {item.accountNumber}</div>
          )}
        </div>
      )
    },
    { 
      key: 'balance', 
      header: t('accounts.balances', 'Bakiyeler'), 
      align: 'right',
      width: '200px',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
          {Object.entries(item.balances).map(([curr, amount]) => (
            <div key={curr} style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '2px 8px', borderRadius: '12px', 
              backgroundColor: 'var(--bg-secondary)', fontSize: '13px',
              fontWeight: 500
            }}>
              <CurrencyDisplay amount={amount} currency={curr as any} />
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button 
            className="btn-icon" 
            onClick={(e) => {
              e.stopPropagation();
              if (onRowClick) onRowClick(item);
            }} 
            title={t('accounts.accountMovements', 'Hesap Hareketleri')}
            style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Eye size={18} />
          </button>
        </div>
      )
    }
  ];

  const filteredData = data.filter(item => {
    const matchesSearch = item.baseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.iban || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter ? item.type === typeFilter : true;
    const matchesRegion = regionFilter ? item.region === regionFilter : true;
    
    return matchesSearch && matchesType && matchesRegion;
  });

  const rightActions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      {selectedIds.length > 0 && onDeleteMultiple && (
        <button 
          className="btn-primary" 
          style={{ backgroundColor: 'var(--danger)', padding: '0 12px' }}
          onClick={() => {
            if (window.confirm(t('accounts.deleteConfirm', 'Seçili {{count}} hesabı silmek istediğinize emin misiniz?', { count: selectedIds.length }))) {
              onDeleteMultiple(selectedIds);
              setSelectedIds([]);
            }
          }}
        >
          <Trash2 size={16} />
          <span>{t('accounts.deleteSelected', 'Seçilenleri Sil ({{count}})', { count: selectedIds.length })}</span>
        </button>
      )}
      {onTransferClick && (
        <button 
          className="btn btn-secondary" 
          onClick={onTransferClick}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px', border: '1px solid var(--accent)', color: 'var(--accent)' }}
        >
          <ArrowRightLeft size={16} />
          {t('accounts.transfer', 'Transfer (Virman)')}
        </button>
      )}
    </div>
  );

  return (
    <div className="account-table-section">
      <FilterBar 
        onSearch={setSearchTerm} 
        onAdd={onAddNew} 
        addLabel={t('accounts.addNew', 'Yeni Kasa/Banka Ekle')}
        actionsRight={rightActions}
      >
        <div style={{ width: '150px' }}>
          <SearchableSelect 
            value={regionFilter}
            onChange={setRegionFilter}
            options={[
              { value: '', label: t('accounts.allRegions', 'Tüm Bölgeler') },
              { value: 'Türkiye', label: t('accounts.turkey', 'Türkiye 🇹🇷') },
              { value: 'Arabistan', label: t('accounts.saudi', 'Arabistan 🇸🇦') }
            ]}
          />
        </div>

        <div style={{ width: '150px' }}>
          <SearchableSelect 
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: '', label: t('accounts.allAccounts', 'Tüm Hesaplar') },
              { value: 'Banka', label: t('accounts.banks', 'Bankalar') },
              { value: 'Kasa', label: t('accounts.cashRegisters', 'Nakit Kasalar') }
            ]}
          />
        </div>
        
        <div style={{ flex: 1 }}></div>
      </FilterBar>

      <DataTable 
        data={filteredData} 
        columns={columns} 
        onRowClick={onRowClick}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}
