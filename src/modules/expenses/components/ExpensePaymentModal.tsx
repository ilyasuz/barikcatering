import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Wallet } from 'lucide-react';
import type { ExpenseRecord, PaymentMethod } from '../types';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { accountsApi } from '../../accounts/api';
import type { AccountRecord } from '../../accounts/types';
import { useRegion } from '../../../core/contexts/RegionContext';

interface ExpensePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ExpenseRecord | null;
  onSavePayment: (recordId: string, addedAmount: number, method: PaymentMethod, date: string, notes: string, accountId?: string, exchangeRate?: number, payer?: string, payee?: string) => void;
}

export function ExpensePaymentModal({ isOpen, onClose, record, onSavePayment }: ExpensePaymentModalProps) {
  const { t } = useTranslation();
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number | ''>('');
  const [payer, setPayer] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const { region } = useRegion();

  useEffect(() => {
    if (isOpen) {
      accountsApi.getAll().then(accs => {
        setAccounts(region === 'all' ? accs : accs.filter(a => a.region === region));
      });
    }
  }, [isOpen, region]);

  useEffect(() => {
    if (isOpen && record) {
      const remaining = record.amount - (record.paidAmount || 0);
      setPaymentAmount(remaining > 0 ? remaining : '');
      setPaymentMethod('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setAccountId('');
      setExchangeRate('');
      setPayer(record.payer || '');
      setPayee(record.payee || '');
    } else {
      setPaymentAmount('');
      setPayer('');
      setPayee('');
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof paymentAmount === 'number' && paymentAmount > 0 && paymentMethod) {
      const rate = typeof exchangeRate === 'number' ? exchangeRate : undefined;
      onSavePayment(record.id, paymentAmount, paymentMethod as PaymentMethod, paymentDate, notes, accountId || undefined, rate, payer, payee);
      onClose();
    }
  };

  const remainingAmount = record.amount - (record.paidAmount || 0);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const isDifferentCurrency = selectedAccount && record && selectedAccount.currency !== record.currency;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div className={`modal-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-primary)',
        width: '550px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="#F59E0B" />
            {t('expenses.payment.title', 'Ödeme Yap')}
          </h2>
          <button className="icon-button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('expenses.payment.invoiceNo', 'Fatura/Belge:')} <strong>{record.invoiceNo}</strong></div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('expenses.payment.supplier', 'Tedarikçi:')} {record.supplierName}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('expenses.payment.totalDebt', 'Toplam Borç')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}><CurrencyDisplay amount={record.amount} currency={record.currency} /></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('expenses.payment.remainingDebt', 'Kalan Borç')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: remainingAmount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    <CurrencyDisplay amount={remainingAmount} currency={record.currency} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{t('expenses.payment.paidAmountLabel', 'Ödenen Tutar')} ({record.currency}) <span style={{color: 'var(--error)'}}>*</span></label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="0.00" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                  max={remainingAmount}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
                <label className="form-label">{t('expenses.payment.accountLabel', 'Para Çıkışı Yapılacak Kasa / Banka')} <span style={{color: 'var(--error)'}}>*</span></label>
                <SearchableSelect 
                  options={[
                    { value: '', label: t('expenses.payment.selectAccount', 'Hesap Seçiniz') },
                    ...accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.currency})` }))
                  ]}
                  value={accountId}
                  onChange={setAccountId}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{t('expenses.payment.payerLabel', 'Ödeyen (Payer)')}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={t('expenses.payment.payerPlaceholder', 'Ödeyen kişi/kurum')}
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('expenses.payment.payeeLabel', 'Ödenen (Payee)')}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={t('expenses.payment.payeePlaceholder', 'Ödeme alan kişi/kurum')}
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{t('expenses.payment.paymentMethodLabel', 'Ödeme Yöntemi')} <span style={{color: 'var(--error)'}}>*</span></label>
                <SearchableSelect 
                  options={[
                    { value: '', label: t('expenses.payment.selectMethod', 'Ödeme yöntemi seçiniz') },
                    { value: 'bank_transfer', label: t('common.bankTransfer', 'Banka Transferi') },
                    { value: 'credit_card', label: t('common.creditCard', 'Kredi Kartı') },
                    { value: 'cash', label: t('common.cash', 'Nakit') },
                    { value: 'check', label: t('common.check', 'Çek') }
                  ]}
                  value={paymentMethod} 
                  onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                  hideSearch
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.date', 'Tarih')} <span style={{color: 'var(--error)'}}>*</span></label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>



            {isDifferentCurrency && (
              <div className="form-group" style={{ animation: 'fadeIn 0.3s', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)' }}>
                <label className="form-label" style={{ color: 'var(--accent)' }}>{t('expenses.payment.exchangeRate', 'Uygulanan Kur')} ({record.currency} ➔ {selectedAccount.currency}) <span style={{color: 'var(--error)'}}>*</span></label>
                <input 
                  type="number"
                  step="0.0001"
                  className="form-control"
                  placeholder={t('expenses.payment.exchangeRatePlaceholder', 'Örn: 32.50')}
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value ? Number(e.target.value) : '')}
                  required
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {t('expenses.payment.currencyConversionHelp1', 'Fatura tahsilatı')} <strong>{record.currency}</strong> {t('expenses.payment.currencyConversionHelp2', 'olarak düşülecek, Kasadan ise')} <strong>{selectedAccount.currency}</strong> {t('expenses.payment.currencyConversionHelp3', 'kur çarpımı ile çıkacaktır.')}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('common.description', 'Açıklama')} <span style={{color: 'var(--error)'}}>*</span></label>
              <input 
                type="text" 
                className="form-control" 
                placeholder={t('expenses.payment.notesPlaceholder', 'Örn: Dekont no veya tahsilat detayı')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </div>

          </div>

          <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel', 'İptal')}</button>
            <button type="submit" className="btn-primary" style={{ backgroundColor: '#F59E0B' }}>{t('expenses.payment.save', 'Ödemeyi Kaydet')}</button>
          </div>
        </form>

      </div>
    </div>
  );
}
