import { useState, useEffect } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { mealApi } from '../api';
import type { MealCalculation } from '../types';
import { useTranslation } from 'react-i18next';
import { Calendar, Compass, Trash2, ArrowRight } from 'lucide-react';

interface ExcursionModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealCalculation | null;
  onSuccess: () => void;
}

export function ExcursionModal({ isOpen, onClose, meal, onSuccess }: ExcursionModalProps) {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [excursionDays, setExcursionDays] = useState<number>(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meal && isOpen) {
      setStartDate(meal.excursion_start_date || meal.entry_date || '');
      setEndDate(meal.excursion_end_date || meal.entry_date || '');
      setExcursionDays(meal.excursion_days || 0);
      setNote(meal.excursion_note || '');
      setError(null);
    }
  }, [meal, isOpen]);

  // Calculate days when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffTime = d2.getTime() - d1.getTime();
        if (diffTime >= 0) {
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setExcursionDays(diffDays === 0 ? 1 : diffDays);
        }
      }
    }
  }, [startDate, endDate]);

  if (!meal) return null;

  // Base calculations
  const currentExcursionDays = meal.excursion_days || 0;
  // Restore gross days if excursion already exists
  const grossDays = meal.total_days + currentExcursionDays;
  const dailyPricePerPax = (meal.morning_price || 0) + (meal.evening_price || 0);
  const costPerDayAllPax = (meal.pax_count || 0) * dailyPricePerPax;

  const newNetDays = Math.max(0, grossDays - (excursionDays || 0));
  const totalDeductionAmount = (excursionDays || 0) * costPerDayAllPax;
  const newTotalAmount = newNetDays * costPerDayAllPax;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meal) return;
    setError(null);
    setLoading(true);

    try {
      await mealApi.update(meal.id, {
        excursion_start_date: startDate,
        excursion_end_date: endDate,
        excursion_days: excursionDays,
        excursion_note: note,
        total_days: newNetDays,
        total_amount: newTotalAmount
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving excursion:', err);
      setError(err.message || t('meals.excursionSaveError', 'Gezi kaydedilirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExcursion = async () => {
    if (!meal) return;
    setError(null);
    setLoading(true);

    try {
      await mealApi.update(meal.id, {
        excursion_start_date: '',
        excursion_end_date: '',
        excursion_days: 0,
        excursion_note: '',
        total_days: grossDays,
        total_amount: grossDays * costPerDayAllPax
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error removing excursion:', err);
      setError(err.message || t('meals.excursionRemoveError', 'Gezi silinirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass className="text-accent" size={20} />
          <span>{t('meals.excursionModalTitle', 'Gezi Ekle / Gün Düşüşü')}</span>
        </div>
      }
      width="600px"
    >
      <form onSubmit={handleSave} className="form-layout">
        {error && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#EF4444', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('meals.company', 'Şirket')}:</span>
            <div style={{ fontWeight: 600 }}>{meal.company_name || '-'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('meals.hotel', 'Otel')}:</span>
            <div style={{ fontWeight: 600 }}>{meal.hotel_name}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('meals.paxCount', 'Kişi Sayısı')}:</span>
            <div style={{ fontWeight: 600 }}>{meal.pax_count} pax</div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('meals.excursionStartDate', 'Gezi Başlangıç Tarihi')}</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              min={meal.entry_date}
              max={meal.exit_date}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('meals.excursionEndDate', 'Gezi Bitiş Tarihi')}</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              min={startDate || meal.entry_date}
              max={meal.exit_date}
              onChange={e => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('meals.excursionDays', 'Düşülecek Gezi Gün Sayısı')}</label>
            <FormattedNumberInput
              className="form-control"
              value={excursionDays}
              onChange={val => setExcursionDays(val)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('meals.excursionNote', 'Gezi Açıklaması / Notu')}</label>
            <input
              type="text"
              className="form-control"
              placeholder={t('meals.excursionNotePlaceholder', 'Örn: Mekke / Medine Gezisi')}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Calculation Summary Box */}
        <div style={{
          marginTop: '12px',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} />
            <span>{t('meals.calculationSummary', 'Hesaplama Özeti')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('meals.grossDays', 'Toplam Konaklama Süresi')}:</span>
            <span><strong>{grossDays}</strong> {t('meals.daysUnit', 'gün')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
            <span>{t('meals.excursionDeduction', 'Gezi Nedeniyle Düşülen')}:</span>
            <span><strong>-{excursionDays}</strong> {t('meals.daysUnit', 'gün')} (-{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalDeductionAmount)} {meal.currency})</span>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <span style={{ fontWeight: 600 }}>{t('meals.netDaysAndTotal', 'Net Yemek Süresi & Tutar')}:</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '16px' }}>
                {newNetDays} {t('meals.daysUnit', 'gün')} → {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(newTotalAmount)} {meal.currency}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          {currentExcursionDays > 0 ? (
            <button
              type="button"
              className="btn-text"
              style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              onClick={handleRemoveExcursion}
              disabled={loading}
            >
              <Trash2 size={16} />
              {t('meals.removeExcursion', 'Geziyi Kaldır')}
            </button>
          ) : <div></div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'İptal')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading || excursionDays <= 0}>
              {loading ? t('common.saving', 'Kaydediliyor...') : t('meals.saveExcursionDeduction', 'Geziyi Kaydet ve Düş')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
