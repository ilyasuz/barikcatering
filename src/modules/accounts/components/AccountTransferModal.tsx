import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowRightLeft } from 'lucide-react';
import type { AccountRecord } from '../types';
import { accountsApi } from '../api';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { supabase } from '../../../lib/supabase';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { convertToBase } from '../../../core/utils/currencyUtils';

interface AccountTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountRecord[];
  onTransferComplete: () => void;
}

export function AccountTransferModal({ isOpen, onClose, accounts, onTransferComplete }: AccountTransferModalProps) {
  const { t } = useTranslation();
  const { rates } = useExchangeRates();
  
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState(t('accounts.transferDefaultDesc', 'Hesaplar arası transfer (Virman)'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const sourceAccount = accounts.find(a => a.id === sourceAccountId);
  const targetAccount = accounts.find(a => a.id === targetAccountId);

  let targetAmount = amount ? Number(amount) : 0;
  
  // Eğer farklı kurlarsa çeviri yap
  if (sourceAccount && targetAccount && amount && sourceAccount.currency !== targetAccount.currency) {
    targetAmount = convertToBase(Number(amount), sourceAccount.currency, targetAccount.currency, rates);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || !targetAccountId || !amount || Number(amount) <= 0) return;
    if (sourceAccountId === targetAccountId) {
      alert(t('accounts.sourceTargetSameError', 'Kaynak ve hedef hesap aynı olamaz.'));
      return;
    }
    if (!sourceAccount || !targetAccount) return;

    if (sourceAccount.balance < Number(amount)) {
      if (!window.confirm(t('accounts.insufficientBalanceConfirm', 'Kaynak hesapta yeterli bakiye yok. Yine de transfer yapmak istiyor musunuz? (Bakiye eksiye düşecek)'))) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Kaynak hesaptan düş
      await accountsApi.update(sourceAccountId, {
        balance: sourceAccount.balance - Number(amount)
      });

      // 2. Hedef hesaba ekle
      await accountsApi.update(targetAccountId, {
        balance: targetAccount.balance + targetAmount
      });

      // 3. Transferi logla (İleride DB'de transfers tablosuna da atılabilir)
      const activityLog = JSON.parse(localStorage.getItem('barik_activity_log') || '[]');
      activityLog.unshift({
        action: t('accounts.transferLogMessage', '{{source}} hesabından {{target}} hesabına {{amount}} {{currency}} transfer edildi.', {
          source: sourceAccount.name,
          target: targetAccount.name,
          amount,
          currency: sourceAccount.currency
        }),
        timestamp: new Date().toISOString(),
        user: localStorage.getItem('currentUser') || 'Admin'
      });
      localStorage.setItem('barik_activity_log', JSON.stringify(activityLog.slice(0, 50)));

      // DB'ye transfer kaydı ekle (eğer transfers tablosu varsa)
      try {
        await supabase.from('transfers').insert([{
          source_account_id: sourceAccountId,
          target_account_id: targetAccountId,
          amount: Number(amount),
          target_amount: targetAmount,
          currency: sourceAccount.currency,
          target_currency: targetAccount.currency,
          description: description,
          created_by: localStorage.getItem('currentUser') || 'Admin',
          date: new Date().toISOString().split('T')[0]
        }]);
      } catch (err) {
        // Tablo yoksa sessizce geç
        console.log('Transfer tablosu henüz yok, sadece bakiye güncellendi.');
      }

      onTransferComplete();
      onClose();
    } catch (error) {
      console.error('Transfer hatası:', error);
      alert(t('accounts.transferError', 'Transfer işlemi sırasında bir hata oluştu.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content open" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRightLeft size={20} color="var(--accent)" />
            {t('accounts.transferModalTitle', 'Hesaplar Arası Transfer (Virman)')}
          </h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label>{t('accounts.sourceAccountLabel', 'Kaynak Hesap (Çıkış Yapılacak)')}</label>
            <SearchableSelect 
              options={[
                { value: '', label: t('common.select', 'Seçiniz...') },
                ...accounts.map(acc => {
                  const baseName = acc.name.replace(/ \([A-Z]{3}\)$/, '').trim();
                  return {
                    value: acc.id,
                    label: `${baseName} (${acc.currency}) - ${t('accounts.balanceLabel', 'Bakiye:')} ${new Intl.NumberFormat('tr-TR').format(acc.balance)} ${acc.currency}`
                  };
                })
              ]}
              value={sourceAccountId} 
              onChange={setSourceAccountId}
            />
          </div>

          <div className="form-group">
            <label>{t('accounts.targetAccountLabel', 'Hedef Hesap (Giriş Yapılacak)')}</label>
            <SearchableSelect 
              options={[
                { value: '', label: t('common.select', 'Seçiniz...') },
                ...accounts.filter(acc => acc.id !== sourceAccountId).map(acc => {
                  const baseName = acc.name.replace(/ \([A-Z]{3}\)$/, '').trim();
                  return {
                    value: acc.id,
                    label: `${baseName} (${acc.currency})`
                  };
                })
              ]}
              value={targetAccountId} 
              onChange={setTargetAccountId}
            />
          </div>

          <div className="form-group">
            <label>{t('accounts.transferAmountLabel', 'Transfer Tutarı')} ({sourceAccount ? sourceAccount.currency : '...'})</label>
            <FormattedNumberInput
              value={amount as number}
              onChange={setAmount as any}
              className="form-control"
              placeholder="0.00"
              required
            />
          </div>

          {sourceAccount && targetAccount && sourceAccount.currency !== targetAccount.currency && amount && (
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('accounts.exchangeResultLabel', 'Kur Çevirisi Sonucu Hedef Hesaba Geçecek:')}</span>
              <strong style={{ color: 'var(--success)' }}>
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(targetAmount)} {targetAccount.currency}
              </strong>
            </div>
          )}

          <div className="form-group">
            <label>{t('accounts.descriptionLabel', 'Açıklama')}</label>
            <input 
              type="text" 
              className="form-control" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              {t('common.cancel', 'İptal')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? t('common.processing', 'İşleniyor...') : t('accounts.completeTransfer', 'Transferi Tamamla')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
