import { useState } from 'react';
import { Drawer } from '../../../core/components/Drawer/Drawer';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import type { AccountRecord } from '../types';
import { useTranslation } from 'react-i18next';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AccountRecord>, balances?: Record<string, number>) => void;
}

export function AccountDrawer({ isOpen, onClose, onSave }: AccountDrawerProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<AccountRecord>>({
    type: 'Banka',
    region: 'Türkiye',
    status: 'active',
    balance: 0
  });

  const [balances, setBalances] = useState<Record<string, string>>({ 'TRY': '' });

  const toggleCurrency = (currency: string) => {
    setBalances(prev => {
      const newBalances = { ...prev };
      if (newBalances[currency] !== undefined) {
        delete newBalances[currency];
      } else {
        newBalances[currency] = '';
      }
      return newBalances;
    });
  };

  const handleBalanceChange = (currency: string, value: string) => {
    setBalances(prev => ({ ...prev, [currency]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCurrencies = Object.keys(balances);
    
    if (selectedCurrencies.length === 0) {
      alert(t('accounts.selectAtLeastOneCurrency', "Lütfen en az bir para birimi seçin."));
      return;
    }
    
    const parsedBalances: Record<string, number> = {};
    selectedCurrencies.forEach(curr => {
      parsedBalances[curr] = Number(balances[curr]) || 0;
    });
    
    onSave({
      ...formData,
      balance: parsedBalances[selectedCurrencies[0]],
      currency: selectedCurrencies[0] as any
    }, parsedBalances);
    
    // Reset form
    setBalances({ 'TRY': '' });
    setFormData({
      type: 'Banka',
      region: 'Türkiye',
      status: 'active',
      balance: 0
    });
    
    onClose();
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('accounts.openNewAccount', 'Yeni Kasa / Banka Hesabı Aç')}
      width="450px"
    >
      <form onSubmit={handleSubmit} className="drawer-form">
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('accounts.accountType', 'Hesap Tipi')}</label>
            <SearchableSelect 
              options={[
                { value: 'Banka', label: t('accounts.bankAccount', 'Banka Hesabı') },
                { value: 'Kasa', label: t('accounts.cashAccount', 'Nakit Kasa') }
              ]}
              value={formData.type as string}
              onChange={(val) => setFormData({...formData, type: val as any})}
              hideSearch
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.region', 'Bölge')}</label>
            <SearchableSelect 
              options={[
                { value: 'Türkiye', label: t('accounts.turkey', 'Türkiye 🇹🇷') },
                { value: 'Arabistan', label: t('accounts.saudi', 'Arabistan 🇸🇦') }
              ]}
              value={formData.region as string}
              onChange={(val) => setFormData({...formData, region: val as any})}
              hideSearch
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('accounts.accountName', 'Hesap Adı')}</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder={formData.type === 'Banka' ? t('accounts.bankPlaceholder', 'Örn: Garanti BBVA Şirket Hesabı') : t('accounts.cashPlaceholder', 'Örn: Merkez Ofis Nakit Kasası')}
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        {formData.type === 'Banka' && (
          <>
            <div className="form-group">
              <label className="form-label">{t('accounts.bankName', 'Banka Adı')}</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder={t('accounts.bankNamePlaceholder', 'Örn: Garanti BBVA')}
                value={formData.bankName || ''}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={formData.iban || ''}
                onChange={(e) => setFormData({...formData, iban: e.target.value})}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('accounts.accountNo', 'Hesap No')}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('accounts.swiftCode', 'SWIFT Kodu')}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.swiftCode || ''}
                  onChange={(e) => setFormData({...formData, swiftCode: e.target.value})}
                />
              </div>
            </div>
          </>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0' }}></div>

        <h3 style={{ fontSize: '14px', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>{t('accounts.openingBalance', 'Açılış (Devir) Bakiyesi')}</h3>
        
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">{t('accounts.currencySelection', 'Para Birimi Seçimi')}</label>
            <div style={{ display: 'flex', gap: '16px', padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              {['TRY', 'SAR', 'USD', 'EUR'].map(curr => (
                <label key={curr} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={balances[curr] !== undefined}
                    onChange={() => toggleCurrency(curr)}
                  />
                  {curr}
                </label>
              ))}
            </div>
          </div>
        </div>

        {Object.keys(balances).length > 0 && (
          <div className="form-row" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className="form-label">{t('accounts.currentBalances', 'Mevcut Bakiyeler')}</label>
            {Object.keys(balances).map(curr => (
              <div key={curr} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '40px', fontWeight: 'bold', fontSize: '13px' }}>{curr}:</span>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder={t('accounts.exampleBalance', 'Örn: 25000')}
                  value={balances[curr]}
                  onChange={(e) => handleBalanceChange(curr, e.target.value)}
                  step="0.01"
                  required
                />
              </div>
            ))}
          </div>
        )}

        <div className="drawer-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('common.cancel', 'İptal')}
          </button>
          <button type="submit" className="btn-primary">
            {t('accounts.saveAccount', 'Hesabı Kaydet')}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
