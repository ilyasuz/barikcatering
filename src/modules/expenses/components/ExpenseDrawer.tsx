import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { Drawer } from '../../../core/components/Drawer/Drawer';
import { FileUpload } from '../../../core/components/FileUpload/FileUpload';
import { useRegion } from '../../../core/contexts/RegionContext';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import type { ExpenseRecord } from '../types';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { accountsApi } from '../../accounts/api';
import type { AccountRecord } from '../../accounts/types';
import { companiesApi } from '../../companies/api';
import type { CompanyRecord } from '../../companies/types';
import { useCategories } from '../../../core/hooks/useCategories';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useNotifications } from '../../../core/contexts/NotificationContext';

interface ExpenseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ExpenseRecord>) => void;
  initialData?: Partial<ExpenseRecord> | null;
}

export function ExpenseDrawer({ isOpen, onClose, onSave, initialData }: ExpenseDrawerProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const { rates } = useExchangeRates();
  const { expenseCategories } = useCategories();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [suppliers, setSuppliers] = useState<CompanyRecord[]>([]);

  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({
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
  const [previousPayments, setPreviousPayments] = useState(0);
  const [salaryExceededBy, setSalaryExceededBy] = useState(0);

  useEffect(() => {
    const checkSalaryStatus = async () => {
      const { companyId, category, date, amount } = formData;
      if (!companyId || !date || !['Personel Ödemesi / Avans'].includes(category || '')) {
        setPreviousPayments(0);
        setSalaryExceededBy(0);
        return;
      }
      
      const supplier = suppliers.find(s => s.id === companyId);
      if (!supplier || supplier.type !== 'Personel' || !supplier.monthlySalary) {
        setPreviousPayments(0);
        setSalaryExceededBy(0);
        return;
      }

      const dateObj = new Date(date);
      const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0];

      try {
        const { data } = await supabase
          .from('expenses')
          .select('amount')
          .eq('company_id', companyId)
          .in('category', ['Personel Ödemesi / Avans'])
          .gte('date', startOfMonth)
          .lte('date', endOfMonth);

        let sum = 0;
        if (data) {
          sum = data.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
          if (initialData?.id) {
            sum -= (Number(initialData.amount) || 0);
          }
        }
        
        setPreviousPayments(Math.max(0, sum));
        
        const currentAmount = Number(amount) || 0;
        const total = Math.max(0, sum) + currentAmount;
        
        if (total > supplier.monthlySalary) {
          setSalaryExceededBy(total - supplier.monthlySalary);
        } else {
          setSalaryExceededBy(0);
        }
      } catch (err) {
        console.error('Error fetching previous payments', err);
      }
    };

    checkSalaryStatus();
  }, [formData.companyId, formData.category, formData.date, formData.amount, suppliers, initialData]);

  useEffect(() => {
    if (isOpen) {
      accountsApi.getAll().then(setAccounts);
      companiesApi.getAll().then(comps => {
        setSuppliers(comps.filter(c => c.type === 'Tedarikçi' || c.type === 'Personel' || (c.type as string) === 'Kurum'));
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
      // Import filesApi from relative path
      const { filesApi } = await import('../../files/api');
      const uploaded = await filesApi.uploadFile(selectedFile, 'Gider', formData.createdBy || 'Admin', false);
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
      createdBy: formData.createdBy || user?.name || 'Sistem'
    });
    
    setIsUploading(false);
    onClose();
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('expenses.drawer.title', 'Yeni Gider Kaydı')}
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
          <label className="form-label">{t('expenses.drawer.supplierLabel', 'Tedarikçi / Kurum / Personel')}</label>
          <SearchableSelect 
            options={suppliers
              .filter(c => !formData.region || c.region === formData.region)
              .map(c => ({ value: c.id, label: c.name }))}
            value={formData.companyId || ''}
            onChange={(selectedId) => {
              const selectedCompany = suppliers.find(c => c.id === selectedId);
              setFormData({
                ...formData, 
                companyId: selectedId,
                supplierName: selectedCompany ? selectedCompany.name : ''
              });
            }}
            placeholder={t('expenses.drawer.selectSupplierPlaceholder', '-- Müşteri/Tedarikçi Seçin --')}
          />
        </div>


        <div className="form-group">
          <label className="form-label">{t('expenses.drawer.invoiceNoLabel', 'Makbuz / Fatura No (İsteğe Bağlı)')}</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t('expenses.drawer.invoiceNoPlaceholder', 'Örn: FAT-2026-001')}
            value={formData.invoiceNo || ''}
            onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('common.description', 'Açıklama')}</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t('expenses.drawer.descriptionPlaceholder', 'Örn: Mayıs Ayı Elektrik Faturası')}
            value={formData.description || ''}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('expenses.drawer.payerLabel', 'Ödeme Yapan (Payer)')}</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder={t('expenses.drawer.payerPlaceholder', 'Parayı veren / ödeyen kişi')}
              value={formData.payer || ''}
              onChange={(e) => setFormData({...formData, payer: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('expenses.drawer.payeeLabel', 'Ödeme Alan (Payee)')}</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder={t('expenses.drawer.payeePlaceholder', 'Parayı teslim alan kişi')}
              value={formData.payee || ''}
              onChange={(e) => setFormData({...formData, payee: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('common.category', 'Kategori')}</label>
          <SearchableSelect 
            options={expenseCategories.filter(c => (!c.toLowerCase().includes('avans') && !c.toLowerCase().includes('maaş')) || c === formData.category).map(c => ({ value: c, label: c }))}
            value={formData.category || ''} 
            onChange={(val) => setFormData({...formData, category: val as any})} 
            placeholder={t('common.select', 'Seçiniz...')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.totalAmount', 'Toplam Tutar')}</label>
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
            <label className="form-label">{t('expenses.drawer.paidAmountLabel', 'Ödenen Tutar')}</label>
            <FormattedNumberInput 
              className="form-control" 
              placeholder="0.00" 
              value={formData.paidAmount || 0}
              onChange={(val) => setFormData({...formData, paidAmount: val})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.currency', 'Para Birimi')}</label>
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

        {salaryExceededBy > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: '4px', animation: 'fadeIn 0.3s' }}>
            <div style={{ color: '#991b1b', fontWeight: 600, fontSize: '13px' }}>{t('expenses.drawer.salaryExceededWarningTitle', 'Dikkat: Maaş / Avans Aşımı')}</div>
            <div style={{ color: '#b91c1c', fontSize: '12.5px' }}>
              {t('expenses.drawer.salaryExceededWarningMessage1', 'Bu ödeme ile personelin bu ayki toplam avans/maaş ödemesi, aylık maaşını aşmaktadır.')} <br/>
              {t('expenses.drawer.salaryExceededWarningMessage2', 'Personel kurumunuza')} <strong>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(salaryExceededBy)} {formData.currency}</strong> {t('expenses.drawer.salaryExceededWarningMessage3', 'tutarında borçlanacaktır.')}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('expenses.drawer.dateLabel', 'İşlem / Fatura Tarihi')}</label>
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
            <label className="form-label">{t('expenses.drawer.dueDateLabel', 'Son Ödeme Tarihi')}</label>
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
            <label className="form-label">{t('common.status', 'Durum')}</label>
            <SearchableSelect 
              options={[
                { value: 'completed', label: t('common.completed', 'Ödendi') },
                { value: 'pending', label: t('common.pending', 'Bekliyor') },
                { value: 'overdue', label: t('common.overdue', 'Gecikmiş') }
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
            <label className="form-label">{t('expenses.drawer.paymentMethodLabel', 'Ödeme Yöntemi')}</label>
            <SearchableSelect 
              options={[
                { value: 'bank_transfer', label: t('common.bankTransfer', 'Banka Transferi') },
                { value: 'credit_card', label: t('common.creditCard', 'Kredi Kartı') },
                { value: 'cash', label: t('common.cash', 'Nakit') },
                { value: 'check', label: t('common.check', 'Çek') }
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
                { value: '', label: t('common.select', 'Seçiniz') },
                { value: 'Türkiye', label: 'Türkiye 🇹🇷' },
                { value: 'Arabistan', label: 'Arabistan 🇸🇦' }
              ]}
              value={formData.region || ''}
              onChange={(val) => setFormData({...formData, region: val as any})}
              hideSearch
            />
          </div>
        </div>

        {(formData.status === 'completed' || (formData.paidAmount || 0) > 0) && (
          <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
            <label className="form-label">{t('expenses.drawer.accountLabel', 'Para Çıkışı Yapılacak Kasa / Banka')}</label>
            <SearchableSelect 
              options={[
                { value: '', label: t('expenses.drawer.selectAccount', 'Hesap Seçiniz') },
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
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('expenses.drawer.recurringTitle', 'Düzenli Gider (Tekrarlayan)')}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('expenses.drawer.recurringDesc', 'Örn: Her ay düzenli ödenen maaş veya kira.')}</div>
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
                <label className="form-label">{t('expenses.drawer.recurringIntervalLabel', 'Tekrarlama Periyodu')}</label>
                <SearchableSelect 
                  options={[
                    { value: 'monthly', label: t('common.monthly', 'Her Ay') },
                    { value: 'yearly', label: t('common.yearly', 'Her Yıl') },
                    { value: 'weekly', label: t('common.weekly', 'Her Hafta') }
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
          <label className="form-label">{t('expenses.drawer.uploadLabel', 'Dekont / Fatura Yükle')}</label>
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
            {isUploading ? t('common.loading', 'Yükleniyor...') : t('expenses.drawer.save', 'Gideri Kaydet')}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
