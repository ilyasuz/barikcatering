import { useTranslation } from 'react-i18next';
import { X, FileText, Calendar, Building, CreditCard, Tag, Image as ImageIcon, Wallet } from 'lucide-react';
import type { IncomeRecord } from '../types';
import { StatusBadge } from '../../../core/components/Typography/StatusBadge';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { useState, useEffect } from 'react';
import { accountsApi } from '../../accounts/api';
import type { AccountRecord } from '../../accounts/types';

interface IncomeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IncomeRecord | null;
}

export function IncomeDetailModal({ isOpen, onClose, record }: IncomeDetailModalProps) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      accountsApi.getAll().then(setAccounts);
    }
  }, [isOpen]);

  if (!isOpen || !record) return null;

  const percent = record.amount > 0 ? Math.min(100, Math.round(((record.paidAmount || 0) / record.amount) * 100)) : 0;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div className={`modal-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-primary)',
        width: '500px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--accent)" />
            {t('income.invoiceDetail', 'Fatura Detayı')}
          </h2>
          <button className="icon-button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('income.invoiceNo', 'Fatura No')}</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{record.invoiceNo}</div>
            </div>
            <StatusBadge status={record.status} label={t(`common.${record.status}` as any)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', alignItems: 'center' }}>
            <Building size={24} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('income.customerCompany', 'Müşteri / Firma')}</div>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{record.companyName}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {t('income.invoiceDate', 'Fatura Tarihi')}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>{record.date}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {t('income.dueDate', 'Son Ödeme Tarihi')}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>{record.dueDate || '-'}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> {t('income.descAndCategory', 'Açıklama & Kategori')}</div>
            <div style={{ fontSize: '14px' }}>{record.description}</div>
            <div style={{ marginTop: '8px' }}>
              <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)' }}>
                {record.category || t('common.noCategory', 'Kategori Yok')}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={14} /> {t('income.paymentSummary', 'Ödeme Özeti')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('income.paidAmount', 'Ödenen:')}</span>
                  <span>{new Intl.NumberFormat('tr-TR').format(record.paidAmount || 0)} {record.currency}</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', backgroundColor: percent === 100 ? '#10b981' : 'var(--accent)' }} />
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('income.totalAmount', 'Toplam Tutar')}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <CurrencyDisplay amount={record.amount} currency={record.currency} />
              </div>
            </div>
          </div>

          {record.paymentHistory && record.paymentHistory.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={16} color="#10b981" /> {t('income.collectionHistory', 'Tahsilat Geçmişi')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {record.paymentHistory.map((payment, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {payment.method === 'cash' ? t('income.methods.cash', 'Nakit') : payment.method === 'bank_transfer' ? t('income.methods.bankTransfer', 'Banka Transferi') : payment.method === 'credit_card' ? t('income.methods.creditCard', 'Kredi Kartı') : t('income.methods.check', 'Çek')}
                          {payment.accountId && accounts.find(a => a.id === payment.accountId) && ` (${accounts.find(a => a.id === payment.accountId)?.name})`}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{payment.date} {payment.notes ? `• ${payment.notes}` : ''}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                        +<CurrencyDisplay amount={payment.amount} currency={record.currency} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Attachments Preview */}
        {record.attachments && record.attachments.length > 0 && (
          <div style={{ padding: '0 24px 24px 24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ImageIcon size={14} /> {t('income.attachedFiles', 'Ekli Dosyalar (Dekont / Fatura)')}
            </div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {record.attachments.map((att, idx) => (
                <div key={idx} style={{
                  width: '100px', height: '100px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }} title={att}>
                  <ImageIcon size={32} color="var(--text-muted)" opacity={0.5} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {att}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>{t('common.close', 'Kapat')}</button>
        </div>

      </div>
    </div>
  );
}
