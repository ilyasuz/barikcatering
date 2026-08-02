import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';
import { expensesApi } from '../../expenses/api';
import { accountsApi } from '../../accounts/api';
import type { AccountRecord } from '../../accounts/types';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useAuth } from '../../../core/contexts/AuthContext';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  personelId: string;
  personelName: string;
  currency: string;
  personelRegion?: string;
}

export function AdvanceModal({ isOpen, onClose, onSuccess, personelId, personelName, currency, personelRegion }: AdvanceModalProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);

  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>('');
  const [description, setDescription] = useState(t('companies.personnelAdvancePayment', 'Personel Avans / Ödeme'));
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'bank_transfer'>('cash');

  useEffect(() => {
    if (isOpen) {
      accountsApi.getAll().then(accs => {
        const filteredAccs = region === 'all' ? accs : accs.filter(a => a.region === region);
        setAccounts(filteredAccs);
        if (filteredAccs.length > 0) {
          setAccountId(filteredAccs[0].id);
        }
      });
      // reset form
      setAmount(0);
      setSelectedCurrency(currency);
      setDate(new Date().toISOString().split('T')[0]);
      setDescription(t('companies.personnelAdvancePayment', 'Personel Avans / Ödeme'));
      setPaymentMethod('cash');
    }
  }, [isOpen, currency]);

  // When selectedCurrency changes, auto-select the first matching account
  useEffect(() => {
    const matchingAccounts = accounts.filter(a => a.currency === selectedCurrency);
    if (matchingAccounts.length > 0 && !matchingAccounts.find(a => a.id === accountId)) {
      setAccountId(matchingAccounts[0].id);
    } else if (matchingAccounts.length === 0) {
      setAccountId('');
    }
  }, [selectedCurrency, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert(t('common.pleaseEnterValidAmount', 'Lütfen geçerli bir tutar girin.'));
      return;
    }

    try {
      setLoading(true);
      // Determine USD rate
      let usdRate = 1;
      const { data: sData } = await supabase.from('settings').select('usd_rate, usd_rate_sar').maybeSingle();
      if (sData) {
        if (selectedCurrency === 'TRY') usdRate = sData.usd_rate || 1;
        else if (selectedCurrency === 'SAR') usdRate = sData.usd_rate_sar || 1;
      }

      const createdRes = await expensesApi.create({
        companyId: personelId,
        supplierName: personelName,
        payee: personelName,
        category: 'Personel Avans / Ödeme',
        amount: amount,
        paidAmount: amount, // Since it's an advance given immediately, it's fully "paid" out of the safe
        currency: selectedCurrency as any,
        date: date,
        dueDate: date,
        status: 'completed',
        paymentMethod: paymentMethod,
        accountId: accountId || undefined,
        description: description,
        region: region === 'all' ? (personelRegion || 'Türkiye') : region,
        usd_rate: usdRate,
        createdBy: user?.name || 'Sistem',
        paymentHistory: [{
          id: Math.random().toString(36).substring(7),
          amount: amount,
          date: date,
          method: paymentMethod,
          notes: description
        }]
      });

      if (!createdRes) {
        throw new Error('Veritabanına kaydedilemedi.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Avans verilirken hata:', err);
      alert(t('companies.errorSavingAdvance', 'Avans kaydedilirken bir hata oluştu.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div className={`modal-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-primary)',
        width: '450px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} color="var(--accent)" /> {t('companies.giveAdvance', 'Avans Ver')}
          </h2>
          <button onClick={onClose} className="icon-button" style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('companies.personnel', 'Personel')}</div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{personelName}</div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">{t('common.amount', 'Tutar')}</label>
              <FormattedNumberInput 
                className="form-control" 
                value={amount}
                onChange={(val) => setAmount(val)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('common.currency', 'Birim')}</label>
              <SearchableSelect 
                options={[
                  { value: 'TRY', label: 'TRY' },
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'SAR', label: 'SAR' }
                ]}
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                hideSearch
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('common.paymentDate', 'Ödeme Tarihi')}</label>
            <input 
              type="date" 
              className="form-control" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('common.paymentMethod', 'Ödeme Yöntemi')}</label>
            <SearchableSelect 
              options={[
                { value: 'cash', label: t('common.cash', 'Nakit (Kasa)') },
                { value: 'bank_transfer', label: t('common.bankTransfer', 'Banka Transferi / EFT') }
              ]}
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as any)}
              hideSearch
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('companies.safeBankSelection', 'Kasa / Banka Seçimi')}</label>
            <SearchableSelect 
              options={[
                { value: '', label: t('common.select', 'Seçiniz...') },
                ...accounts.filter(a => a.currency === selectedCurrency).map(a => ({
                  value: a.id,
                  label: `${a.name} (${a.balance.toLocaleString('tr-TR')} ${a.currency})`
                }))
              ]}
              value={accountId}
              onChange={setAccountId}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('common.description', 'Açıklama')}</label>
            <input 
              type="text" 
              className="form-control" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'İptal')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? t('common.saving', 'Kaydediliyor...') : t('companies.saveAdvance', 'Avansı Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
