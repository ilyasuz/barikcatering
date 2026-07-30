import { useState, useEffect } from 'react';
import { AccountTable } from '../components/AccountTable';
import { AccountKPIs } from '../components/AccountKPIs';
import { AccountDrawer } from '../components/AccountDrawer';
import { AccountTransferModal } from '../components/AccountTransferModal';
import { useNavigate } from 'react-router-dom';
import type { AccountRecord, AccountGroup } from '../types';
import { accountsApi } from '../api';
import { useTranslation } from 'react-i18next';

import { useRegion } from '../../../core/contexts/RegionContext';

export function AccountsPage() {
  const { t } = useTranslation();
  const { region } = useRegion();
  const [data, setData] = useState<AccountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    let accounts = await accountsApi.getAll();
    if (region !== 'all') {
      accounts = accounts.filter(a => a.region === region);
    }
    setData(accounts);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [region]);

  const handleSave = async (newRecord: Partial<AccountRecord>, balances?: Record<string, number>) => {
    if (balances && Object.keys(balances).length > 0) {
      const currencies = Object.keys(balances);
      const createdAccounts: AccountRecord[] = [];
      for (const curr of currencies) {
        const nameSuffix = currencies.length > 1 ? ` (${curr})` : '';
        const created = await accountsApi.create({
          ...newRecord,
          name: `${newRecord.name}${nameSuffix}`,
          currency: curr as any,
          balance: balances[curr] || 0
        });
        if (created) {
          createdAccounts.push(created);
        }
      }
      if (createdAccounts.length > 0) {
        setData(prev => [...createdAccounts, ...prev]);
      }
    } else {
      const created = await accountsApi.create(newRecord);
      if (created) {
        setData(prev => [created, ...prev]);
      }
    }
  };

  const handleRowClick = (record: AccountGroup) => {
    navigate(`/accounts/group/${encodeURIComponent(record.baseName)}`);
  };

  const groupedData: AccountGroup[] = [];
  data.forEach(account => {
    const baseName = account.name.replace(/ \([A-Z]{3}\)$/, '').trim();
    let group = groupedData.find(g => g.baseName === baseName);
    if (!group) {
      group = {
        id: baseName,
        baseName,
        type: account.type,
        region: account.region,
        status: account.status,
        subAccounts: [],
        balances: {},
        bankName: account.bankName,
        iban: account.iban,
        accountNumber: account.accountNumber,
        swiftCode: account.swiftCode
      };
      groupedData.push(group);
    }
    group.subAccounts.push(account);
    group.balances[account.currency] = (group.balances[account.currency] || 0) + account.balance;
  });

  const handleDeleteMultiple = async (baseNames: string[]) => {
    const idsToDelete = data
      .filter(account => {
        const baseName = account.name.replace(/ \([A-Z]{3}\)$/, '').trim();
        return baseNames.includes(baseName);
      })
      .map(account => account.id);

    const success = await accountsApi.deleteMultiple(idsToDelete);
    if (success) {
      setData(prev => prev.filter(a => !idsToDelete.includes(a.id)));
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>{t('accounts.title', 'Kasalar & Bankalar')}</h1>
          <p className="text-muted">{t('accounts.description', 'Şirketinizin tüm nakit ve banka varlıklarını bölgesel olarak yönetin.')}</p>
        </div>
      </div>

      <AccountKPIs data={data} />

      <div style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading', 'Yükleniyor...')}</div>
        ) : (
          <AccountTable 
            data={groupedData} 
            onAddNew={() => setIsDrawerOpen(true)}
            onRowClick={handleRowClick}
            onTransferClick={() => setIsTransferModalOpen(true)}
            onDeleteMultiple={handleDeleteMultiple}
          />
        )}
      </div>

      <AccountDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSave}
      />

      <AccountTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={data}
        onTransferComplete={loadData}
      />
    </div>
  );
}
