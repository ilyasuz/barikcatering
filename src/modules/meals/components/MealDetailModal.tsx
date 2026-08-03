import { Modal } from '../../../core/components/Modal/Modal';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { getExcursionsFromMeal, calculateTotalPaxSums } from '../types';
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

  const excursions = getExcursionsFromMeal(meal);
  const excursionDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
  const grossDays = meal.total_days + excursionDays;
  const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);
  const paxSums = calculateTotalPaxSums(meal);
  const mp = meal.morning_price || 0;
  const ep = meal.evening_price || 0;
  const grossAmount = (paxSums.totalMorningPax * mp) + (paxSums.totalEveningPax * ep);
  const deductionAmount = excursionDays * meal.pax_count * dailyPrice;

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
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('meals.paxAndPrice', 'Toplam Kişi Sayıları')}</span>
            <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', display: 'flex', gap: '6px' }}>
              <span style={{ color: '#DC2626' }}>🌅 S: {calculateTotalPaxSums(meal).totalMorningPax.toLocaleString('tr-TR')}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--text-primary)' }}>🌃 A: {calculateTotalPaxSums(meal).totalEveningPax.toLocaleString('tr-TR')}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fiyat: S: {meal.morning_price} | A: {meal.evening_price} {meal.currency}
            </div>
          </div>
        </div>

        {/* Excursions List Card */}
        {excursions.length > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700, fontSize: '14px' }}>
                <Compass size={18} />
                <span>⛺ {t('meals.excursionDetailsTitle', 'Eklenen Geziler / Gün Düşüşleri')} ({excursions.length})</span>
              </div>
              <button
                type="button"
                className="btn-text"
                style={{ fontSize: '12px', color: '#8B5CF6', padding: '2px 8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}
                onClick={() => { onClose(); onEditExcursion(meal); }}
              >
                {t('meals.editExcursions', 'Gezileri Yönet / Düzenle')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {excursions.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#991B1B' }}>
                      {ex.note || `${idx + 1}. Gezi`}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDate(ex.start_date)} - {formatDate(ex.end_date)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#DC2626' }}>
                      -{ex.days} gün
                    </div>
                    <div style={{ fontSize: '11px', color: '#DC2626' }}>
                      -{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(ex.days * costPerDayAllPax)} {meal.currency}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#DC2626', fontWeight: 600 }}>{t('meals.totalDeductedAmount', 'Toplam Düşülen Tutar')}:</span>
              <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '15px' }}>
                -{excursionDays} gün (-{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(deductionAmount)} {meal.currency})
              </span>
            </div>
          </div>
        )}

        {/* Daily Variable Pax Breakdown Card */}
        {meal.is_variable_pax && meal.daily_pax && meal.daily_pax.length > 0 && (
          <div style={{
            padding: '14px',
            backgroundColor: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '10px'
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#8B5CF6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🟣 {t('meals.variablePaxDetailTitle', 'Gün Gün Değişken Kişi Sayıları (Sabah / Akşam)')}</span>
            </div>
            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {meal.daily_pax.map((d, idx) => {
                const mPax = d.morning_pax ?? d.pax ?? meal.pax_count;
                const ePax = d.evening_pax ?? d.pax ?? meal.pax_count;
                return (
                  <div key={d.date || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '4px 8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <span><strong>{idx + 1}. Gün</strong> ({formatDate(d.date)})</span>
                    <span>🌅 Sabah: <strong>{mPax}</strong> | 🌃 Akşam: <strong>{ePax}</strong></span>
                  </div>
                );
              })}
            </div>
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
              <span>{t('meals.excursionDeduction', 'Geziler Düşüşü')}:</span>
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
            <span>{t('meals.selectTemplateExport', 'Şablonlu İndir & Yazdır')}</span>
          </button>

          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('common.close', 'Kapat')}
          </button>
        </div>

      </div>
    </Modal>
  );
}
