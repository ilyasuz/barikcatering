import { useState, useEffect } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { mealApi } from '../api';
import { getExcursionsFromMeal } from '../types';
import type { MealCalculation, MealExcursion } from '../types';
import { useTranslation } from 'react-i18next';
import { Calendar, Compass, Trash2, Plus, Edit2, ArrowLeft, Check, AlertCircle } from 'lucide-react';

interface ExcursionModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealCalculation | null;
  onSuccess: () => void;
}

export function ExcursionModal({ isOpen, onClose, meal, onSuccess }: ExcursionModalProps) {
  const { t } = useTranslation();
  
  // List of saved excursions
  const [excursions, setExcursions] = useState<MealExcursion[]>([]);
  
  // Active editing state: null = viewing saved list; 'new' = adding a new trip; string ID = editing specific trip
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Current active form state
  const [activeForm, setActiveForm] = useState<MealExcursion>({
    id: '',
    start_date: '',
    end_date: '',
    days: 1,
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meal && isOpen) {
      const existing = getExcursionsFromMeal(meal);
      setExcursions(existing);
      setError(null);

      if (existing.length === 0) {
        // If no excursions exist, open directly in 'new trip' form mode
        setEditingId('new');
        setActiveForm({
          id: Date.now().toString(),
          start_date: meal.entry_date || '',
          end_date: meal.entry_date || '',
          days: 1,
          note: ''
        });
      } else {
        // If excursions exist, show list view
        setEditingId(null);
      }
    }
  }, [meal, isOpen]);

  if (!meal) return null;

  // Base financial & day calculations
  const currentTotalExcursionDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
  const grossDays = meal.total_days + getExcursionsFromMeal(meal).reduce((sum, item) => sum + (item.days || 0), 0);

  const dailyPricePerPax = (meal.morning_price || 0) + (meal.evening_price || 0);
  const costPerDayAllPax = (meal.pax_count || 0) * dailyPricePerPax;

  // Open form for a new trip
  const handleOpenNewForm = () => {
    setActiveForm({
      id: Date.now().toString() + Math.random().toString().substring(2, 6),
      start_date: meal.entry_date || '',
      end_date: meal.entry_date || '',
      days: 1,
      note: ''
    });
    setEditingId('new');
    setError(null);
  };

  // Open form to edit an existing trip
  const handleOpenEditForm = (item: MealExcursion) => {
    setActiveForm({ ...item });
    setEditingId(item.id);
    setError(null);
  };

  // Save current active form into excursions list and update database
  const handleSaveActiveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meal) return;
    if (activeForm.days <= 0) {
      setError(t('meals.invalidExcursionDays', 'Lütfen geçerli bir gün sayısı giriniz'));
      return;
    }

    setLoading(true);
    setError(null);

    let updatedList: MealExcursion[] = [];
    if (editingId === 'new') {
      updatedList = [...excursions, activeForm];
    } else {
      updatedList = excursions.map(ex => ex.id === editingId ? activeForm : ex);
    }

    await saveExcursionsToDb(updatedList);
  };

  // Delete a single excursion
  const handleDeleteExcursion = async (id: string) => {
    const updatedList = excursions.filter(ex => ex.id !== id);
    setLoading(true);
    await saveExcursionsToDb(updatedList);
  };

  // Core helper to save updated excursions list to Supabase
  const saveExcursionsToDb = async (updatedList: MealExcursion[]) => {
    try {
      const validExcursions = updatedList.filter(ex => ex.days > 0);
      const totalDays = validExcursions.reduce((sum, ex) => sum + (ex.days || 0), 0);
      const netDays = Math.max(0, grossDays - totalDays);
      const totalAmt = netDays * costPerDayAllPax;

      const earliestDate = validExcursions[0]?.start_date || '';
      const latestDate = validExcursions[validExcursions.length - 1]?.end_date || earliestDate;
      const noteSummary = validExcursions.length > 0 ? JSON.stringify(validExcursions) : '';

      await mealApi.update(meal.id, {
        excursion_start_date: earliestDate,
        excursion_end_date: latestDate,
        excursion_days: totalDays,
        excursion_note: noteSummary,
        total_days: netDays,
        total_amount: totalAmt
      });

      setExcursions(validExcursions);
      setEditingId(null);
      onSuccess();
      if (validExcursions.length === 0) {
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving excursions:', err);
      setError(err.message || t('meals.excursionSaveError', 'Geziler kaydedilirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  // Date range change handler for active form
  const handleDateChange = (field: 'start_date' | 'end_date', val: string) => {
    const sDate = field === 'start_date' ? val : activeForm.start_date;
    const eDate = field === 'end_date' ? val : activeForm.end_date;
    let days = activeForm.days;

    if (sDate && eDate) {
      const d1 = new Date(sDate);
      const d2 = new Date(eDate);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffTime = d2.getTime() - d1.getTime();
        if (diffTime >= 0) {
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          days = diffDays === 0 ? 1 : diffDays;
        }
      }
    }

    setActiveForm({
      ...activeForm,
      [field]: val,
      days
    });
  };

  // Preview calculations for overall status
  const previewNetDays = Math.max(0, grossDays - currentTotalExcursionDays);
  const previewTotalDeduction = currentTotalExcursionDays * costPerDayAllPax;
  const previewNetTotal = previewNetDays * costPerDayAllPax;

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
      width="640px"
    >
      <div className="form-layout">
        {error && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#EF4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Meal Info Header Card */}
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

        {/* VIEW MODE 1: Saved Excursions List */}
        {editingId === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ⛺ {t('meals.savedExcursionsList', 'Kayıtlı Geziler')} ({excursions.length})
              </span>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleOpenNewForm}
              >
                <Plus size={16} />
                <span>{t('meals.addNewExcursionBtn', '+ Yeni Bir Gezi Daha Ekle')}</span>
              </button>
            </div>

            {/* List of Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {excursions.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>
                      ⛺ {ex.note || `${idx + 1}. Gezi`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Tarih: {ex.start_date || '-'} - {ex.end_date || '-'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '14px' }}>
                        -{ex.days} gün
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        -{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(ex.days * costPerDayAllPax)} {meal.currency}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-text"
                        style={{ padding: '6px', color: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                        title={t('common.edit', 'Düzenle')}
                        onClick={() => handleOpenEditForm(ex)}
                        disabled={loading}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-text"
                        style={{ padding: '6px', color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        title={t('common.delete', 'Sil')}
                        onClick={() => handleDeleteExcursion(ex.id)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Calculation Summary Box */}
            <div style={{
              marginTop: '8px',
              padding: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('meals.grossDays', 'Toplam Konaklama Süresi')}:</span>
                <span><strong>{grossDays}</strong> gün</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#DC2626' }}>
                <span>{t('meals.excursionDeductionTotal', 'Geziler Nedeniyle Toplam Düşülen')}:</span>
                <span><strong>-{currentTotalExcursionDays}</strong> gün (-{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(previewTotalDeduction)} {meal.currency})</span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '2px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{t('meals.netDaysAndTotal', 'Net Yemek Süresi & Tutar')}:</span>
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '16px' }}>
                  {previewNetDays} gün → {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(previewNetTotal)} {meal.currency}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t('common.close', 'Kapat')}
              </button>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: Form Mode (Adding New or Editing Single Excursion) */}
        {editingId !== null && (
          <form onSubmit={handleSaveActiveForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={18} />
                <span>
                  {editingId === 'new'
                    ? (excursions.length > 0 ? `+ Yeni Gezi Ekle (${excursions.length + 1}. Gezi)` : t('meals.addNewExcursionTitle', 'Yeni Gezi Ekle'))
                    : t('meals.editExcursionTitle', 'Geziyi Düzenle')}
                </span>
              </span>

              {excursions.length > 0 && (
                <button
                  type="button"
                  className="btn-text"
                  style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
                  onClick={() => setEditingId(null)}
                >
                  <ArrowLeft size={16} />
                  <span>{t('meals.backToList', 'Kayıtlı Gezilere Dön')}</span>
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('meals.excursionStartDate', 'Gezi Başlangıç Tarihi')}</label>
                <input
                  type="date"
                  className="form-control"
                  value={activeForm.start_date}
                  min={meal.entry_date}
                  max={meal.exit_date}
                  onChange={e => handleDateChange('start_date', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('meals.excursionEndDate', 'Gezi Bitiş Tarihi')}</label>
                <input
                  type="date"
                  className="form-control"
                  value={activeForm.end_date}
                  min={activeForm.start_date || meal.entry_date}
                  max={meal.exit_date}
                  onChange={e => handleDateChange('end_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('meals.excursionDays', 'Düşülecek Gün Sayısı')}</label>
                <FormattedNumberInput
                  className="form-control"
                  value={activeForm.days}
                  onChange={val => setActiveForm({ ...activeForm, days: val })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('meals.excursionNote', 'Gezi Açıklaması / Notu')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('meals.excursionNotePlaceholder', 'Örn: Mekke Gezisi veya Medine Ziyareti')}
                  value={activeForm.note || ''}
                  onChange={e => setActiveForm({ ...activeForm, note: e.target.value })}
                />
              </div>
            </div>

            {/* Live deduction summary for this active trip */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('meals.tripDeductionSummary', 'Bu Gezi İle Düşülecek Tutar')}:</span>
              <span style={{ fontWeight: 700, color: '#DC2626', fontSize: '15px' }}>
                -{activeForm.days || 0} gün → -{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format((activeForm.days || 0) * costPerDayAllPax)} {meal.currency}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              {excursions.length > 0 ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingId(null)}
                  disabled={loading}
                >
                  {t('common.cancel', 'İptal')}
                </button>
              ) : <div></div>}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                  {t('common.close', 'Kapat')}
                </button>
                <button type="submit" className="btn-primary" disabled={loading || activeForm.days <= 0}>
                  <Check size={16} />
                  <span>{loading ? t('common.saving', 'Kaydediliyor...') : t('meals.saveExcursionDeduction', 'Geziyi Kaydet ve Düş')}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
