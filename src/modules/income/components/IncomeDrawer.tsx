import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../core/components/Drawer/Drawer';
import { FileUpload } from '../../../core/components/FileUpload/FileUpload';
import { useRegion } from '../../../core/contexts/RegionContext';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import type { IncomeRecord } from '../types';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';

import { accountsApi } from '../../accounts/api';
import type { AccountRecord } from '../../accounts/types';
import { companiesApi } from '../../companies/api';
import type { CompanyRecord } from '../../companies/types';
import { useCategories } from '../../../core/hooks/useCategories';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useNotifications } from '../../../core/contexts/NotificationContext';

interface IncomeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<IncomeRecord>) => void;
  initialData?: Partial<IncomeRecord> | null;
}

export function IncomeDrawer({ isOpen, onClose, onSave, initialData }: IncomeDrawerProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const { rates } = useExchangeRates();
  const { incomeCategories } = useCategories();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [customers, setCustomers] = useState<CompanyRecord[]>([]);

  const [formData, setFormData] = useState<Partial<IncomeRecord>>({
    currency: 'TRY',
    status: 'completed',
    paymentMethod: 'bank_transfer',
    isRecurring: false,
    recurringInterval: 'monthly',
    region: 'Türkiye'
  });

  const groupedAccounts = useMemo(() => {
    const groups: { baseName: string, id: string }[] = [];
    accounts.forEach(acc => {
      const baseName = acc.name.replace(/ \([A-Z]{3}\)$/, '').trim();
      if (!groups.find(g => g.baseName === baseName)) {
        groups.push({ baseName, id: baseName });
      }
    });
    return groups;
  }, [accounts]);

  const selectedBaseAccount = useMemo(() => {
    if (!formData.accountId) return '';
    const acc = accounts.find(a => a.id === formData.accountId);
    if (acc) return acc.name.replace(/ \([A-Z]{3}\)$/, '').trim();
    return formData.accountId;
  }, [formData.accountId, accounts]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      accountsApi.getAll().then(setAccounts);
      companiesApi.getAll().then(comps => {
        setCustomers(comps.filter(c => c.type === 'Müşteri' || c.type === 'Personel'));
      });
      if (initialData) {
        setFormData(initialData);
      } else {
        const defaultRegion = region !== 'all' ? region : 'Türkiye';
        const defaultCurrency = defaultRegion === 'Arabistan' ? 'SAR' : 'TRY';
        
        setFormData({
          currency: defaultCurrency,
          status: 'completed',
          paymentMethod: 'bank_transfer',
          isRecurring: false,
          recurringInterval: 'monthly',
          region: defaultRegion as any
        });
      }
      setSelectedFile(null);
    }
  }, [isOpen, initialData, region]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let attachments: string[] = formData.attachments || [];
    let hasAttachment = formData.hasAttachment || false;

    if (selectedFile) {
      // Import filesApi from relative path (we'll add import at top)
      const { filesApi } = await import('../../files/api');
      const uploaded = await filesApi.uploadFile(selectedFile, 'Fatura', formData.createdBy || 'Admin', false);
      if (uploaded && uploaded.url) {
        attachments = [...attachments, uploaded.url];
        hasAttachment = true;
      }
    }

    let finalAccountId = formData.accountId;
    if (finalAccountId) {
      let baseName = finalAccountId;
      const existingAcc = accounts.find(a => a.id === finalAccountId);
      if (existingAcc) {
        baseName = existingAcc.name.replace(/ \([A-Z]{3}\)$/, '').trim();
      }

      const matchingAccount = accounts.find(a => 
        a.name.replace(/ \([A-Z]{3}\)$/, '').trim() === baseName && 
        a.currency === formData.currency
      );
      
      if (matchingAccount) {
        finalAccountId = matchingAccount.id;
      } else if (existingAcc) {
        finalAccountId = existingAcc.id;
      } else {
        const firstMatch = accounts.find(a => a.name.replace(/ \([A-Z]{3}\)$/, '').trim() === baseName);
        if (firstMatch) finalAccountId = firstMatch.id;
      }
    }

    const currentRate = formData.currency ? rates[formData.currency] : 1;
    onSave({
      ...formData,
      accountId: finalAccountId,
      usd_rate: currentRate,
      attachments,
      hasAttachment,
      createdBy: formData.createdBy || user?.name || t('common.system', 'Sistem')
    });
    
    setIsUploading(false);
    onClose();
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('income.form.newRecordTitle')}
      width="500px"
    >
      <form onSubmit={handleSubmit} className="form-layout">
        {formData.systemNo && (
          <div className="form-group" style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <label className="form-label" style={{ marginBottom: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>{t('common.systemNo', 'Sistem No')}</label>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
              {formData.systemNo}
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">{t('income.form.companyCustomer')}</label>
          <SearchableSelect 
            options={customers
              .filter(c => !formData.region || c.region === formData.region)
              .map(c => ({ value: c.id, label: c.name }))}
            value={formData.companyId || ''}
            onChange={(selectedId) => {
              const selectedCompany = customers.find(c => c.id === selectedId);
              setFormData({
                ...formData, 
                companyId: selectedId,
                companyName: selectedCompany ? selectedCompany.name : ''
              });
            }}
            placeholder={t('income.form.selectCustomer', '-- Müşteri Seçin --')}
          />
        </div>


        <div className="form-group">
          <label className="form-label">{t('income.form.invoiceNoOptional', 'Makbuz / Fatura No (İsteğe Bağlı)')}</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t('income.form.invoiceNoPlaceholder', 'Örn: FAT-2026-001')}
            value={formData.invoiceNo || ''}
            onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('income.form.description')}</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t('income.form.descPlaceholder')}
            value={formData.description || ''}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('income.form.payer', 'Ödeme Yapan (Payer)')}</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder={t('income.form.payerPlaceholder', 'Parayı getiren / ödeyen kişi')}
              value={formData.payer || ''}
              onChange={(e) => setFormData({...formData, payer: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('income.form.payee', 'Ödeme Alan (Payee)')}</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder={t('income.form.payeePlaceholder', 'Parayı teslim alan kişi')}
              value={formData.payee || ''}
              onChange={(e) => setFormData({...formData, payee: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('common.category', 'Kategori')}</label>
          <SearchableSelect 
            options={incomeCategories.map(c => ({ value: c, label: c }))}
            value={formData.category || ''} 
            onChange={(val) => setFormData({...formData, category: val as any})} 
            placeholder={t('common.select', 'Seçiniz...')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('income.form.amount')}</label>
            <FormattedNumberInput 
              className="form-control" 
              placeholder="0.00" 
              value={formData.amount || 0}
              onChange={(val) => setFormData({
                ...formData, 
                amount: val,
                ...(formData.status === 'completed' ? { paidAmount: val } : {})
              })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('income.form.downPayment', 'Alınan Peşinat (Ödenen)')}</label>
            <FormattedNumberInput 
              className="form-control" 
              placeholder="0.00" 
              value={formData.paidAmount || 0}
              onChange={(val) => setFormData({...formData, paidAmount: val})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('income.form.currency')}</label>
            <SearchableSelect 
              options={[
                { value: 'TRY', label: 'TRY (₺)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'SAR', label: 'SAR (ر.س)' }
              ]}
              value={formData.currency as string}
              onChange={(val) => setFormData({...formData, currency: val as any})}
              hideSearch
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('income.form.invoiceDate')}</label>
            <input 
              type="date" 
              className="form-control" 
              max={todayStr}
              value={formData.date || ''}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('income.form.dueDate')}</label>
            <input 
              type="date" 
              className="form-control" 
              value={formData.dueDate || ''}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('income.form.paymentStatus')}</label>
            <SearchableSelect 
              options={[
                { value: 'completed', label: t('common.completed') },
                { value: 'pending', label: t('common.pending') },
                { value: 'overdue', label: t('common.overdue') }
              ]}
              value={formData.status as string}
              onChange={(val) => {
                const newStatus = val as any;
                setFormData({
                  ...formData, 
                  status: newStatus,
                  ...(newStatus === 'completed' ? { paidAmount: formData.amount || 0 } : {})
                });
              }}
              hideSearch
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('income.form.paymentMethod')}</label>
            <SearchableSelect 
              options={[
                { value: 'bank_transfer', label: t('income.form.methods.bankTransfer') },
                { value: 'credit_card', label: t('income.form.methods.creditCard') },
                { value: 'cash', label: t('income.form.methods.cash') },
                { value: 'check', label: t('income.form.methods.check') }
              ]}
              value={formData.paymentMethod as string}
              onChange={(val) => setFormData({...formData, paymentMethod: val as any})}
              hideSearch
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.branchRegion', 'Şube / Bölge')}</label>
            <SearchableSelect 
              options={[
                { value: '', label: t('common.select', 'Seçiniz...') },
                { value: 'Türkiye', label: `${t('common.turkey', 'Türkiye')} 🇹🇷` },
                { value: 'Arabistan', label: `${t('common.saudiArabia', 'Arabistan')} 🇸🇦` }
              ]}
              value={formData.region || ''}
              onChange={(val) => setFormData({...formData, region: val as any})}
              hideSearch
            />
          </div>
        </div>
        {(formData.status === 'completed' || (formData.paidAmount || 0) > 0) && (
          <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
            <label className="form-label">{t('income.form.targetAccount', 'Para Girişi Yapılacak Kasa / Banka')}</label>
            <SearchableSelect 
              options={[
                { value: '', label: t('income.form.selectAccount', 'Hesap Seçiniz') },
                ...groupedAccounts.map(acc => ({ value: acc.id, label: acc.baseName }))
              ]}
              value={selectedBaseAccount}
              onChange={(val) => setFormData({...formData, accountId: val})}
            />
          </div>
        )}

        {formData.category?.toLowerCase().includes('kira') && (
          <>
            <div className="form-row" style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('income.form.recurringIncome', 'Düzenli Gelir (Tekrarlayan)')}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('income.form.recurringIncomeDesc', 'Örn: Her ay düzenli alınan kira gelirleri.')}</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.isRecurring} 
                  onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '13px' }}>{t('common.active', 'Aktif')}</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
                <label className="form-label">{t('income.form.recurringInterval', 'Tekrarlama Periyodu')}</label>
                <SearchableSelect 
                  options={[
                    { value: 'monthly', label: t('common.intervals.monthly', 'Her Ay') },
                    { value: 'yearly', label: t('common.intervals.yearly', 'Her Yıl') },
                    { value: 'weekly', label: t('common.intervals.weekly', 'Her Hafta') }
                  ]}
                  value={formData.recurringInterval as string}
                  onChange={(val) => setFormData({...formData, recurringInterval: val as any})}
                  hideSearch
                />
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label className="form-label">{t('income.form.uploadTitle')}</label>
          <FileUpload 
            onFileSelect={(file) => setSelectedFile(file)} 
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeMB={5}
          />
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isUploading}>
            {t('common.cancel', 'İptal')}
          </button>
          <button type="submit" className="btn-primary" disabled={isUploading}>
            {isUploading ? t('common.loading', 'Yükleniyor...') : t('income.form.saveIncome', 'Geliri Kaydet')}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
