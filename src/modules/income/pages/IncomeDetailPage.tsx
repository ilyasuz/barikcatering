import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, FileText, Calendar, Building, CreditCard, Tag, Wallet, User, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { PrintPreviewModal } from '../../../core/components/Print/PrintPreviewModal';
import type { IncomeRecord } from '../types';
import { StatusBadge } from '../../../core/components/Typography/StatusBadge';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { accountsApi } from '../../accounts/api';
import type { AccountRecord } from '../../accounts/types';

export function IncomeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [record, setRecord] = useState<IncomeRecord | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      supabase
        .from('income')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) {
            const mappedRecord = {
              ...data,
              systemNo: data.system_no,
              invoiceNo: data.invoice_no,
              companyId: data.company_id,
              companyName: data.title,
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
  if (!record) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.recordNotFound', 'Kayıt bulunamadı.')}</div>;

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const percent = record.amount > 0 ? Math.min(100, Math.round(((record.paidAmount || 0) / record.amount) * 100)) : 0;
  
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
            <h1 style={{ margin: 0 }}>{t('income.detailTitle', 'Gelir Detayı')}</h1>
            <p className="text-muted" style={{ margin: 0, marginTop: '4px' }}>{t('income.detailSubtitle', 'Fatura ve ödeme bilgileri')}</p>
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
              {t('income.receiptTitle', 'TAHSİLAT MAKBUZU')}
            </h2>
            <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>{t('common.systemName', 'Barik Muhasebe Sistemi')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.systemNo', 'Sistem No')}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)', marginBottom: '12px' }}>{record.systemNo || '-'}</div>
            
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('income.receiptNo', 'Makbuz No')}</div>
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
                  <Building size={16} /> <span style={{ fontWeight: 500 }}>{t('income.customerInfo', 'Müşteri Bilgileri')}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.companyName}</div>
              </div>
              
              {(record.payer || record.payee) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px dashed var(--border-color)', paddingLeft: '20px' }}>
                  {record.payer && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {t('income.form.payer', 'Ödeme Yapan (Payer)')}</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{record.payer}</div>
                    </div>
                  )}
                  {record.payee && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {t('income.form.payee', 'Ödeme Alan (Payee)')}</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{record.payee}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><Calendar size={14} /> {t('income.invoiceDate', 'Fatura Tarihi')}</div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{record.date}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><Calendar size={14} /> {t('income.dueDate', 'Son Ödeme')}</div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{record.dueDate || '-'}</div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={16} /> {t('income.descAndDetail', 'Açıklama & Detay')}</div>
            <div style={{ fontSize: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', minHeight: '80px', border: '1px solid var(--border-color)' }}>
              {record.description || '-'}
            </div>
          </div>

          <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>{t('income.totalAmount', 'Toplam Tutar')}</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <CurrencyDisplay amount={record.amount} currency={record.currency} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('income.paidAmount', 'Ödenen:')}</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}><CurrencyDisplay amount={record.paidAmount || 0} currency={record.currency} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('income.remainingAmount', 'Kalan:')}</span>
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
                {t('income.paymentHistoryTitle', 'Ödeme Geçmişi (Tahsilatlar)')}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px', fontWeight: 500 }}>{t('common.date', 'Tarih')}</th>
                      <th style={{ padding: '12px', fontWeight: 500 }}>{t('income.methodNote', 'Yöntem / Not')}</th>
                      <th style={{ padding: '12px', fontWeight: 500, textAlign: 'right' }}>{t('income.amount', 'Tutar')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(record.paymentHistory || []).map((payment, i) => (
                      <tr key={i} style={{ borderBottom: i === record.paymentHistory.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px' }}>{formatDateTime(payment.date)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 500 }}>{payment.method === 'cash' ? t('income.methods.cash', 'Nakit') : payment.method === 'bank_transfer' ? t('income.methods.bankTransfer', 'Banka Transferi') : payment.method === 'credit_card' ? t('income.methods.creditCard', 'Kredi Kartı') : t('income.methods.check', 'Çek')}</div>
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
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}>
              <Info size={14} />
              {t('income.recordSource', 'Kayıt Kaynağı:')} {record.createdBy?.includes('Excel') ? t('common.excelImport', 'Excel Aktarımı') : (record.createdBy?.includes('Sistem (Otomatik)') ? t('common.autoAccrual', 'Otomatik Tahakkuk') : t('common.manualRecord', 'Manuel Kayıt'))}
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
      titleTR={t('income.receiptTitle', 'TAHSİLAT MAKBUZU')}
      titleAR="إيصال التحصيل"
      headerNode={
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid black', paddingBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>{t('income.customerCompany', 'Müşteri')}: {record.companyName}</div>
            <div>{t('common.description', 'Açıklama')}: {record.description || '-'}</div>
            <div>{t('income.invoiceNo', 'Fatura No')}: {record.invoiceNo || '-'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>{t('common.date', 'Tarih')}: {record.date}</div>
            <div>{t('income.totalAmount', 'Toplam Tutar')}: {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(record.amount)} {record.currency}</div>
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
      totalsLabelTR={t('income.totalPaid', 'TOPLAM ÖDENEN')}
      totalsLabelAR="إجمالي المدفوع"
    />
    </>
  );
}
