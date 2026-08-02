import { Modal } from '../../../core/components/Modal/Modal';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import type { MealCalculation } from '../types';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { useTranslation } from 'react-i18next';
import { Calendar, Compass, Printer, Building2, Hotel, Users, DollarSign, FileText } from 'lucide-react';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealCalculation | null;
  onPrint: (meal: MealCalculation) => void;
  onEditExcursion: (meal: MealCalculation) => void;
}

export function MealDetailModal({ isOpen, onClose, meal, onPrint, onEditExcursion }: MealDetailModalProps) {
  const { t } = useTranslation();
  const { rates } = useExchangeRates();

  if (!meal) return null;

  const formatDate = (dStr?: string) => {
    if (!dStr) return '-';
    return new Date(dStr).toLocaleDateString('tr-TR');
  };

  const rate = rates['SAR'] || 3.75;
  let eqAmount = 0;
  let eqCurrency = '';
  if (meal.currency === 'SAR') { eqAmount = meal.total_amount / rate; eqCurrency = 'USD'; }
  else if (meal.currency === 'USD') { eqAmount = meal.total_amount * rate; eqCurrency = 'SAR'; }

  const excursionDays = meal.excursion_days || 0;
  const grossDays = meal.total_days + excursionDays;
  const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);
  const costPerDayAllPax = meal.pax_count * dailyPrice;
  const grossAmount = grossDays * costPerDayAllPax;
  const deductionAmount = excursionDays * costPerDayAllPax;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText className="text-accent" size={22} />
          <span>{t('meals.detailTitle', 'Yemek Hesabı Detayı')}</span>
        </div>
      }
      width="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Top Header Card */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('meals.company', 'Şirket')}:</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{meal.company_name || '-'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Hotel size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('meals.hotel', 'Otel')}:</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{meal.hotel_name}</div>
            </div>
          </div>
        </div>

        {/* Stay Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          fontSize: '13px'
        }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('meals.checkIn', 'Giriş Tarihi')}</span>
            <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{formatDate(meal.entry_date)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Sabah: {meal.entry_morning > 0 ? '0,5' : '-'} | Akşam: {meal.entry_evening > 0 ? '0,5' : '-'}
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('meals.checkOut', 'Çıkış Tarihi')}</span>
            <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{formatDate(meal.exit_date)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Sabah: {meal.exit_morning > 0 ? '0,5' : '-'} | Akşam: {meal.exit_evening > 0 ? '0,5' : '-'}
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('meals.paxAndPrice', 'Kişi & Fiyat')}</span>
            <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{meal.pax_count} Pax</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              S: {meal.morning_price} | A: {meal.evening_price} {meal.currency}
            </div>
          </div>
        </div>

        {/* Excursion Card (If present) */}
        {excursionDays > 0 ? (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700, fontSize: '14px' }}>
                <Compass size={18} />
                <span>⛺ {t('meals.excursionDetailsTitle', 'Gezi / Gün Düşüş Detayı')}</span>
              </div>
              <button
                type="button"
                className="btn-text"
                style={{ fontSize: '12px', color: '#8B5CF6', padding: '2px 8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}
                onClick={() => { onClose(); onEditExcursion(meal); }}
              >
                {t('meals.editExcursion', 'Geziyi Düzenle')}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{t('meals.excursionDates', 'Gezi Tarih Aralığı')}:</span>
                <div style={{ fontWeight: 600 }}>
                  {formatDate(meal.excursion_start_date)} - {formatDate(meal.excursion_end_date)}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>{t('meals.deductedDays', 'Düşülen Gün Sayısı')}:</span>
                <div style={{ fontWeight: 700, color: '#DC2626' }}>
                  -{excursionDays} {t('meals.daysUnit', 'gün')}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('meals.excursionNote', 'Gezi Notu / Açıklama')}:</span>
                <div style={{ fontWeight: 500, fontStyle: meal.excursion_note ? 'normal' : 'italic' }}>
                  {meal.excursion_note || t('common.none', 'Belirtilmedi')}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>{t('meals.totalDeductedAmount', 'Düşülen Tutar')}:</span>
                <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '15px' }}>
                  -{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(deductionAmount)} {meal.currency}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('meals.noExcursionAdded', 'Bu kayıtta henüz bir gezi düşüşü yok.')}</span>
            <button
              type="button"
              className="btn-text"
              style={{ fontSize: '12px', color: '#8B5CF6', padding: '4px 10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px' }}
              onClick={() => { onClose(); onEditExcursion(meal); }}
            >
              + {t('meals.addExcursion', 'Gezi Ekle')}
            </button>
          </div>
        )}

        {/* Financial Calculation Breakdown Card */}
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} />
            <span>{t('meals.calculationBreakdown', 'Hesaplama Detayı')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('meals.grossDays', 'Brüt Konaklama Süresi')}:</span>
            <span><strong>{grossDays}</strong> gün ({new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(grossAmount)} {meal.currency})</span>
          </div>

          {excursionDays > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#DC2626' }}>
              <span>{t('meals.excursionDeduction', 'Gezi Düşüşü')}:</span>
              <span><strong>-{excursionDays}</strong> gün (-{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(deductionAmount)} {meal.currency})</span>
            </div>
          )}

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>{t('meals.netPayableTotal', 'Ödenecek Net Tutar')}:</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '18px' }}>
                <CurrencyDisplay amount={meal.total_amount} currency={meal.currency} />
              </div>
              {eqAmount > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ~ {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(eqAmount)} {eqCurrency}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3B82F6' }}
            onClick={() => { onClose(); onPrint(meal); }}
          >
            <Printer size={16} />
            <span>{t('meals.printInvoice', 'Faturayı / Hesabı Yazdır')}</span>
          </button>

          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('common.close', 'Kapat')}
          </button>
        </div>

      </div>
    </Modal>
  );
}
