import { useState, useEffect } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { mealApi } from '../api';
import { getExcursionsFromMeal } from '../types';
import type { MealCalculation, MealExcursion } from '../types';
import { useTranslation } from 'react-i18next';
import { Calendar, Compass, Trash2, Plus, ArrowRight } from 'lucide-react';

interface ExcursionModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealCalculation | null;
  onSuccess: () => void;
}

export function ExcursionModal({ isOpen, onClose, meal, onSuccess }: ExcursionModalProps) {
  const { t } = useTranslation();
  const [excursions, setExcursions] = useState<MealExcursion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meal && isOpen) {
      const existing = getExcursionsFromMeal(meal);
      if (existing.length > 0) {
        setExcursions(existing);
      } else {
        // Initialize with one default excursion row
        setExcursions([{
          id: Date.now().toString(),
          start_date: meal.entry_date || '',
          end_date: meal.entry_date || '',
          days: 1,
          note: ''
        }]);
      }
      setError(null);
    }
  }, [meal, isOpen]);

  if (!meal) return null;

  // Calculate gross days before any excursion deductions
  const currentExcursions = getExcursionsFromMeal(meal);
  const currentTotalExcursionDays = currentExcursions.reduce((sum, item) => sum + (item.days || 0), 0);
  const grossDays = meal.total_days + currentTotalExcursionDays;

  const dailyPricePerPax = (meal.morning_price || 0) + (meal.evening_price || 0);
  const costPerDayAllPax = (meal.pax_count || 0) * dailyPricePerPax;

  // Total excursion days currently entered in form
  const newTotalExcursionDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
  const newNetDays = Math.max(0, grossDays - newTotalExcursionDays);
  const totalDeductionAmount = newTotalExcursionDays * costPerDayAllPax;
  const newTotalAmount = newNetDays * costPerDayAllPax;

  const handleAddExcursionRow = () => {
    setExcursions(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString().substring(2, 6),
        start_date: meal.entry_date || '',
        end_date: meal.entry_date || '',
        days: 1,
        note: ''
      }
    ]);
  };

  const handleRemoveExcursionRow = (id: string) => {
    setExcursions(prev => prev.filter(item => item.id !== id));
  };

  const handleExcursionChange = (id: string, field: keyof MealExcursion, value: any) => {
    setExcursions(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };

      // Auto calculate days when dates change
      if (field === 'start_date' || field === 'end_date') {
        const sDate = field === 'start_date' ? value : item.start_date;
        const eDate = field === 'end_date' ? value : item.end_date;
        if (sDate && eDate) {
          const d1 = new Date(sDate);
          const d2 = new Date(eDate);
          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            const diffTime = d2.getTime() - d1.getTime();
            if (diffTime >= 0) {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              updated.days = diffDays === 0 ? 1 : diffDays;
            }
          }
        }
      }

      return updated;
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meal) return;
    setError(null);
    setLoading(true);

    try {
      const validExcursions = excursions.filter(ex => ex.days > 0);
      const totalDays = validExcursions.reduce((sum, ex) => sum + (ex.days || 0), 0);
      const netDays = Math.max(0, grossDays - totalDays);
      const totalAmt = netDays * costPerDayAllPax;

      const earliestDate = validExcursions[0]?.start_date || '';
      const latestDate = validExcursions[validExcursions.length - 1]?.end_date || earliestDate;
      const noteSummary = JSON.stringify(validExcursions);

      await mealApi.update(meal.id, {
        excursion_start_date: earliestDate,
        excursion_end_date: latestDate,
        excursion_days: totalDays,
        excursion_note: noteSummary,
        total_days: netDays,
        total_amount: totalAmt
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving excursions:', err);
      setError(err.message || t('meals.excursionSaveError', 'Geziler kaydedilirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllExcursions = async () => {
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
      console.error('Error removing excursions:', err);
      setError(err.message || t('meals.excursionRemoveError', 'Geziler silinirken bir hata oluştu'));
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
      width="680px"
    >
      <form onSubmit={handleSave} className="form-layout">
        {error && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#EF4444', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Meal Info Header */}
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

        {/* Excursions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>
              ⛺ {t('meals.excursionListTitle', 'Geziler / Düşüşler')} ({excursions.length})
            </span>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '4px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleAddExcursionRow}
            >
              <Plus size={16} />
              <span>{t('meals.addNewExcursionRow', '+ Başka Gezi Ekle')}</span>
            </button>
          </div>

          {excursions.map((ex, idx) => (
            <div
              key={ex.id || idx}
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {idx + 1}. {t('meals.excursionItem', 'Gezi')}
                </span>
                {excursions.length > 1 && (
                  <button
                    type="button"
                    className="btn-text"
                    style={{ color: '#EF4444', padding: '2px 6px' }}
                    title={t('common.delete', 'Sil')}
                    onClick={() => handleRemoveExcursionRow(ex.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="form-row" style={{ marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>{t('meals.excursionStartDate', 'Başlangıç Tarihi')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={ex.start_date}
                    min={meal.entry_date}
                    max={meal.exit_date}
                    onChange={e => handleExcursionChange(ex.id, 'start_date', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>{t('meals.excursionEndDate', 'Bitiş Tarihi')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={ex.end_date}
                    min={ex.start_date || meal.entry_date}
                    max={meal.exit_date}
                    onChange={e => handleExcursionChange(ex.id, 'end_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>{t('meals.excursionDays', 'Düşülecek Gün Sayısı')}</label>
                  <FormattedNumberInput
                    className="form-control"
                    value={ex.days}
                    onChange={val => handleExcursionChange(ex.id, 'days', val)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>{t('meals.excursionNote', 'Gezi Açıklaması / Notu')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('meals.excursionNotePlaceholder', 'Örn: Mekke Gezisi veya Medine Ziyareti')}
                    value={ex.note || ''}
                    onChange={e => handleExcursionChange(ex.id, 'note', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
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
            <span>{t('meals.excursionDeductionTotal', 'Geziler Nedeniyle Toplam Düşülen')}:</span>
            <span><strong>-{newTotalExcursionDays}</strong> {t('meals.daysUnit', 'gün')} (-{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalDeductionAmount)} {meal.currency})</span>
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
          {currentTotalExcursionDays > 0 ? (
            <button
              type="button"
              className="btn-text"
              style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              onClick={handleClearAllExcursions}
              disabled={loading}
            >
              <Trash2 size={16} />
              {t('meals.removeAllExcursions', 'Tüm Gezileri Sil')}
            </button>
          ) : <div></div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'İptal')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading || newTotalExcursionDays <= 0}>
              {loading ? t('common.saving', 'Kaydediliyor...') : t('meals.saveExcursionDeduction', 'Gezileri Kaydet ve Düş')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
