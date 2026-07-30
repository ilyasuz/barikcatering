import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, FileText, Calendar, Building, CreditCard, Tag, Wallet, User, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { PrintPreviewModal } from '../../../core/components/Print/PrintPreviewModal';
import type { ExpenseRecord } from '../types';
import { StatusBadge } from '../../../core/components/Typography/StatusBadge';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { accountsApi } from '../../accounts/api';
import type { AccountRecord } from '../../accounts/types';

export function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [record, setRecord] = useState<ExpenseRecord | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          // Map DB keys to ExpenseRecord keys just like api.ts does
          if (data) {
            const mappedRecord = {
              ...data,
              supplierName: data.supplier_name || data.title,
              invoiceNo: data.invoice_no,
              dueDate: data.due_date,
              paidAmount: data.paid_amount !== undefined ? data.paid_amount : data.amount,
              paymentMethod: data.payment_method,
              paymentHistory: Array.isArray(data.payment_history) ? data.payment_history : [],
              accountId: data.account_id,
              usd_rate: data.usd_rate,
              createdBy: data.created_by,
              createdAt: data.created_at,
              hasAttachment: data.has_attachment,
              isRecurring: data.is_recurring,
              recurringInterval: data.recurring_interval
            } as any;
            setRecord(mappedRecord);
          } else {
            setRecord(null);
          }
          accountsApi.getAll().then(accs => {
            setAccounts(accs);
            setLoading(false);
          });
        });
    }
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading', 'Yükleniyor...')}</div>;
  if (!record) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.noRecord', 'Kayıt bulunamadı.')}</div>;

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const percent = record.amount > 0 ? Math.min(100, Math.round(((record.paidAmount || 0) / record.amount) * 100)) : 0;
  const account = accounts.find(a => a.id === record.accountId);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
    <div className="page-container fade-in screen-only">
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="icon-button" onClick={() => navigate(-1)} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0 }}>{t('expenses.page.title', 'Gider Detayı')}</h1>
            <p className="text-muted" style={{ margin: 0, marginTop: '4px' }}>{t('expenses.page.description', 'Fatura ve ödeme bilgileri')}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={18} />
          {t('common.printPdf', 'Yazdır / PDF')}
        </button>
      </div>

      <div className="invoice-print-container" style={{ 
        maxWidth: '800px', 
        margin: '32px auto', 
        backgroundColor: 'var(--bg-primary)',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid var(--border-color)'
      }}>
        
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '24px', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <FileText size={28} color="var(--accent)" />
              {t('expenses.receipt.title', 'ÖDEME MAKBUZU')}
            </h2>
            <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>{t('common.systemName', 'Barik Muhasebe Sistemi')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.systemNo', 'Sistem No')}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)', marginBottom: '12px' }}>{record.systemNo || '-'}</div>
            
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('expenses.receipt.invoiceNo', 'Fatura / Belge No')}</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>{record.invoiceNo || t('common.notSpecified', 'Belirtilmemiş')}</div>
            <div style={{ marginTop: '8px' }} className="no-print">
              <StatusBadge status={record.status} label={t(`common.${record.status}` as any)} />
            </div>
          </div>
        </div>

        {/* Invoice Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '13px' }}>
                  <Building size={16} /> <span style={{ fontWeight: 500 }}>{t('expenses.receipt.supplier', 'Tedarikçi / Ödenen Kurum')}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.supplierName}</div>
              </div>
              
              {(record.payer || record.payee) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px dashed var(--border-color)', paddingLeft: '20px' }}>
                  {record.payer && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {t('expenses.receipt.payer', 'Ödeme Yapan (Payer)')}</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{record.payer}</div>
                    </div>
                  )}
                  {record.payee && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {t('expenses.receipt.payee', 'Ödeme Alan (Payee)')}</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{record.payee}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><Calendar size={14} /> {t('common.recordDate', 'Kayıt Tarihi')}</div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{record.date}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><Calendar size={14} /> {t('expenses.receipt.dueDate', 'Son Ödeme')}</div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{record.dueDate || '-'}</div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={16} /> {t('expenses.receipt.description', 'Açıklama & Detay')}</div>
            <div style={{ fontSize: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', minHeight: '80px', border: '1px solid var(--border-color)' }}>
              {record.description || '-'}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }} className="no-print">
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', backgroundColor: 'rgba(244,63,94,0.1)', color: 'var(--danger)', border: '1px solid rgba(244,63,94,0.2)' }}>
                {t('common.category', 'Kategori')}: {record.category || t('expenses.detail.noCategory', 'Kategori Yok')}
              </span>
              {record.region && (
                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {t('common.region', 'Bölge')}: {record.region}
                </span>
              )}
              {record.usd_rate != null && (
                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#D97706', border: '1px solid rgba(245,158,11,0.2)' }}>
                  {t('expenses.receipt.exchangeRate', 'Kayıt Anındaki Kur:')} 1 USD = {record.usd_rate.toFixed(4)} {record.currency}
                </span>
              )}
            </div>
          </div>

          {record.attachments && record.attachments.length > 0 && (
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="no-print">
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                {t('expenses.receipt.attachments', 'Ekli Dosyalar')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {record.attachments.map((url, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('common.attachment', 'Ek')} {index + 1}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', color: 'var(--text-primary)', display: 'flex', border: '1px solid var(--border-color)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </a>
                      <a href={url} download target="_blank" rel="noopener noreferrer" style={{ padding: '6px', backgroundColor: 'var(--success)', borderRadius: '6px', color: '#fff', display: 'flex' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>{t('expenses.receipt.totalAmount', 'Toplam Tutar')}</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <CurrencyDisplay amount={record.amount} currency={record.currency} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('expenses.receipt.paidAmount', 'Ödenen:')}</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}><CurrencyDisplay amount={record.paidAmount || 0} currency={record.currency} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('expenses.receipt.remainingAmount', 'Kalan:')}</span>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}><CurrencyDisplay amount={Math.max(0, record.amount - (record.paidAmount || 0))} currency={record.currency} /></span>
              </div>
              
              <div style={{ marginTop: '12px', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent}%`, backgroundColor: percent === 100 ? 'var(--success)' : 'var(--accent)', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          </div>

          {record.paymentHistory && record.paymentHistory.length > 0 && (
            <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} color="var(--accent)" />
                {t('expenses.receipt.paymentHistory', 'Ödeme Geçmişi (Yapılan Ödemeler)')}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px', fontWeight: 500 }}>{t('common.date', 'Tarih')}</th>
                      <th style={{ padding: '12px', fontWeight: 500 }}>{t('common.methodNotes', 'Yöntem / Not')}</th>
                      <th style={{ padding: '12px', fontWeight: 500, textAlign: 'right' }}>{t('common.amount', 'Tutar')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(record.paymentHistory || []).map((payment, i) => (
                      <tr key={i} style={{ borderBottom: i === record.paymentHistory.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px' }}>{formatDateTime(payment.date)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 500 }}>{payment.method === 'cash' ? t('common.cash', 'Nakit') : payment.method === 'bank_transfer' ? t('common.bankTransfer', 'Banka Transferi') : payment.method === 'credit_card' ? t('common.creditCard', 'Kredi Kartı') : t('common.check', 'Çek')}</div>
                          {payment.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{payment.notes}</div>}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                          +<CurrencyDisplay amount={payment.amount} currency={record.currency} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* User Info (Hidden on Print) */}
        <div className="no-print" style={{ 
          marginTop: '40px', 
          padding: '16px', 
          borderTop: '1px dashed var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              padding: '4px 10px', 
              borderRadius: '12px', 
              backgroundColor: record.createdBy?.includes('Excel') ? 'rgba(16,185,129,0.1)' : (record.createdBy?.includes('Sistem') ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)'),
              color: record.createdBy?.includes('Excel') ? '#10B981' : (record.createdBy?.includes('Sistem') ? '#3B82F6' : 'var(--text-primary)'),
              border: `1px solid ${record.createdBy?.includes('Excel') ? 'rgba(16,185,129,0.2)' : (record.createdBy?.includes('Sistem') ? 'rgba(59,130,246,0.2)' : 'var(--border-color)')}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}>
              <Info size={14} />
              {t('common.recordSource', 'Kayıt Kaynağı:')} {record.createdBy?.includes('Excel') ? t('common.sourceExcel', 'Excel Aktarımı') : (record.createdBy?.includes('Sistem (Otomatik)') ? t('common.sourceAuto', 'Otomatik Tahakkuk') : t('common.sourceManual', 'Manuel Kayıt'))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><strong>{t('common.createdBy', 'Oluşturan:')}</strong> {record.createdBy || t('common.unknown', 'Bilinmiyor')}</div>
            <div><strong>{t('common.createdAt', 'Oluşturulma Tarihi:')}</strong> {formatDateTime(record.createdAt)}</div>
          </div>
        </div>
      </div>
    </div>
    
    <PrintPreviewModal
      isOpen={showPrintPreview}
      onClose={() => setShowPrintPreview(false)}
      titleTR="ÖDEME MAKBUZU"
      titleAR="سند صرف"
      headerNode={
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid black', paddingBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>{t('expense.receipt.supplier', 'Tedarikçi')}: {record.supplierName}</div>
            <div>{t('common.description', 'Açıklama')}: {record.description || '-'}</div>
            <div>{t('expense.detail.invoiceNo', 'Fatura No')}: {record.invoiceNo || '-'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>{t('common.date', 'Tarih')}: {record.date}</div>
            <div>{t('expense.detail.totalAmount', 'Toplam Tutar')}: {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(record.amount)} {record.currency}</div>
          </div>
        </div>
      }
      columns={[
        { key: 'date', headerTR: 'TARİH', headerAR: 'التاريخ', render: (item: any) => new Date(item.date || record.date).toLocaleDateString('tr-TR') },
        { key: 'amount', headerTR: 'ÖDENEN TUTAR', headerAR: 'المبلغ المدفوع', render: (item: any) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(item.amount)} ${record.currency}` },
        { 
          key: 'remaining', 
          headerTR: 'KALAN TUTAR', 
          headerAR: 'المبلغ المتبقي', 
          render: (item: any, index: number) => {
            const history = record.paymentHistory && record.paymentHistory.length > 0 
              ? record.paymentHistory 
              : (record.paidAmount && record.paidAmount > 0 ? [{ amount: record.paidAmount }] : []);
            const paymentsSoFar = history.slice(0, index + 1).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            const remaining = Math.max(0, record.amount - paymentsSoFar);
            return `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(remaining)} ${record.currency}`;
          }
        }
      ]}
      data={
        record.paymentHistory && record.paymentHistory.length > 0 
          ? record.paymentHistory 
          : (record.paidAmount && record.paidAmount > 0 ? [{ id: 'p1', date: record.date, amount: record.paidAmount, accountName: 'Merkez Kasa' }] : [])
      }
      totalAmount={record.paidAmount || 0}
      totalCurrency={record.currency}
      totalsLabelTR="TOPLAM ÖDENEN"
      totalsLabelAR="إجمالي المدفوع"
    />
    </>
  );
}
