import { useState, useEffect } from 'react';
import { Drawer } from '../../../core/components/Drawer/Drawer';
import { FormattedNumberInput } from '../../../core/components/Form/FormattedNumberInput';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { supabase } from '../../../lib/supabase';
import { mealApi } from '../api';
import type { CreateMealCalculationDTO } from '../types';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { useTranslation } from 'react-i18next';

interface MealDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRegion: string;
}

export function MealDrawer({ isOpen, onClose, onSuccess, initialRegion }: MealDrawerProps) {
  const { t } = useTranslation();
  const { rates } = useExchangeRates();
  const [customRate, setCustomRate] = useState<number>(0);
  const [companies, setCompanies] = useState<{ id: string, name: string, region: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isVariablePax, setIsVariablePax] = useState(false);
  const [dailyPaxList, setDailyPaxList] = useState<{ date: string; pax?: number; morning_pax: number; evening_pax: number }[]>([]);
  const [bulkPaxVal, setBulkPaxVal] = useState<number>(50);

  const currentRate = customRate > 0 ? customRate : (rates['SAR'] || 3.75);

  const [formData, setFormData] = useState<CreateMealCalculationDTO>({
    company_id: '',
    hotel_name: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_morning: 0.5,
    entry_evening: 0.5,
    exit_date: new Date().toISOString().split('T')[0],
    exit_morning: 0.5,
    exit_evening: 0,
    pax_count: 0,
    morning_price: 0,
    evening_price: 0,
    total_days: 0,
    total_amount: 0,
    currency: 'USD',
    region: initialRegion
  });

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      setIsVariablePax(false);
      setDailyPaxList([]);
      setFormData({
        company_id: '',
        hotel_name: '',
        entry_date: new Date().toISOString().split('T')[0],
        entry_morning: 0.5,
        entry_evening: 0.5,
        exit_date: new Date().toISOString().split('T')[0],
        exit_morning: 0.5,
        exit_evening: 0,
        pax_count: 0,
        morning_price: 0,
        evening_price: 0,
        total_days: 0,
        total_amount: 0,
        currency: 'USD',
        region: initialRegion
      });
      setCustomRate(0);
      setError(null);
    }
  }, [isOpen, initialRegion]);

  // Generate date list whenever dates change
  useEffect(() => {
    if (!formData.entry_date || !formData.exit_date) return;
    const sDate = new Date(formData.entry_date);
    const eDate = new Date(formData.exit_date);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || eDate < sDate) return;

    const dates: string[] = [];
    let cur = new Date(sDate);
    while (cur <= eDate) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    setDailyPaxList(prev => {
      const prevMap = new Map(prev.map(p => [p.date, p]));
      const defaultPax = formData.pax_count > 0 ? formData.pax_count : 50;
      return dates.map(d => {
        const existing = prevMap.get(d);
        return {
          date: d,
          morning_pax: existing ? (existing.morning_pax ?? existing.pax ?? defaultPax) : defaultPax,
          evening_pax: existing ? (existing.evening_pax ?? existing.pax ?? defaultPax) : defaultPax
        };
      });
    });
  }, [formData.entry_date, formData.exit_date]);

  useEffect(() => {
    calculateTotals();
  }, [
    formData.entry_date, formData.exit_date, 
    formData.entry_morning, formData.entry_evening, 
    formData.exit_morning, formData.exit_evening,
    formData.pax_count, formData.morning_price, formData.evening_price,
    formData.excursion_days, isVariablePax, dailyPaxList
  ]);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, region')
      .order('name');
    if (data) setCompanies(data);
  };

  const calculateTotals = () => {
    if (!formData.entry_date || !formData.exit_date) return;
    
    const entryDate = new Date(formData.entry_date);
    const exitDate = new Date(formData.exit_date);
    const diffTime = Math.abs(exitDate.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    let baseDays = diffDays - 1;
    let grossDays = baseDays 
               + formData.entry_morning + formData.entry_evening 
               + formData.exit_morning + formData.exit_evening;

    const mp = formData.morning_price || 0;
    const ep = formData.evening_price || 0;
    const dailyPrice = mp + ep;
    const excursionDays = formData.excursion_days || 0;
    const netDays = Math.max(0, grossDays - excursionDays);

    let totalAmount = 0;
    let effectivePax = formData.pax_count || 0;

    if (isVariablePax && dailyPaxList.length > 0) {
      let grossAmount = 0;
      let totalPaxSum = 0;

      dailyPaxList.forEach(d => {
        const mPax = d.morning_pax ?? d.pax ?? formData.pax_count ?? 0;
        const ePax = d.evening_pax ?? d.pax ?? formData.pax_count ?? 0;
        totalPaxSum += (mPax + ePax);
        grossAmount += (mPax * mp) + (ePax * ep);
      });

      effectivePax = Math.round(totalPaxSum / (2 * dailyPaxList.length));
      const avgPaxCost = effectivePax * dailyPrice;
      const deductionAmount = excursionDays * avgPaxCost;
      totalAmount = Math.max(0, grossAmount - deductionAmount);
    } else {
      totalAmount = netDays * effectivePax * dailyPrice;
    }

    setFormData(prev => ({
      ...prev,
      pax_count: effectivePax,
      total_days: netDays,
      total_amount: totalAmount,
      is_variable_pax: isVariablePax,
      daily_pax: isVariablePax ? dailyPaxList : undefined
    }));
  };

  const handleApplyFirstDayPaxToAll = () => {
    if (dailyPaxList.length === 0) return;
    const firstMPax = dailyPaxList[0].morning_pax ?? dailyPaxList[0].pax ?? 50;
    const firstEPax = dailyPaxList[0].evening_pax ?? dailyPaxList[0].pax ?? 50;
    setDailyPaxList(prev => prev.map(p => ({ ...p, morning_pax: firstMPax, evening_pax: firstEPax })));
  };

  const handleSyncMorningToEvening = () => {
    setDailyPaxList(prev => prev.map(p => ({ ...p, evening_pax: p.morning_pax })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await mealApi.create(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t('meals.saveError', 'Kayıt sırasında bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('meals.newMealCalculation', 'Yeni Yemek Hesabı')}
      width="600px"
    >
      <form onSubmit={handleSubmit} className="form-layout">
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          {error && (
            <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#EF4444', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('common.branchRegion', 'Şube / Bölge')}</label>
            <SearchableSelect
              options={[
                { value: 'Türkiye', label: t('common.turkey', 'Türkiye') },
                { value: 'Arabistan', label: t('common.saudiArabia', 'Arabistan') }
              ]}
              value={formData.region}
              onChange={val => setFormData({ ...formData, region: val as string, company_id: '' })}
              hideSearch
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('meals.agencyCompany', 'Acenta / Şirket')}</label>
            <SearchableSelect
              options={[
                { value: '', label: t('meals.selectCompany', '-- Şirket Seçin --') },
                ...companies
                  .filter(c => !formData.region || c.region === formData.region)
                  .map(c => ({ value: c.id, label: c.name }))
              ]}
              value={formData.company_id}
              onChange={val => setFormData({ ...formData, company_id: val as string })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('meals.hotelName', 'Otel Adı')}</label>
            <input
              type="text"
              className="form-control"
              value={formData.hotel_name}
              onChange={e => setFormData({ ...formData, hotel_name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('meals.checkInDate', 'Giriş Tarihi')}</label>
              <input
                type="date"
                className="form-control"
                value={formData.entry_date}
                onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
                required
              />
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.entry_morning > 0}
                    onChange={e => setFormData({ ...formData, entry_morning: e.target.checked ? 0.5 : 0 })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {t('meals.morningHalf', 'Sabah (0.5)')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.entry_evening > 0}
                    onChange={e => setFormData({ ...formData, entry_evening: e.target.checked ? 0.5 : 0 })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {t('meals.eveningHalf', 'Akşam (0.5)')}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('meals.checkOutDate', 'Çıkış Tarihi')}</label>
              <input
                type="date"
                className="form-control"
                value={formData.exit_date}
                onChange={e => setFormData({ ...formData, exit_date: e.target.value })}
                required
              />
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.exit_morning > 0}
                    onChange={e => setFormData({ ...formData, exit_morning: e.target.checked ? 0.5 : 0 })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {t('meals.morningHalf', 'Sabah (0.5)')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.exit_evening > 0}
                    onChange={e => setFormData({ ...formData, exit_evening: e.target.checked ? 0.5 : 0 })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {t('meals.eveningHalf', 'Akşam (0.5)')}
                </label>
              </div>
            </div>
          </div>

          {/* Pax Mode Selection (Fixed vs Daily Variable) */}
          <div style={{ marginTop: '16px', marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>
              {t('meals.paxModeTitle', 'Kişi Sayısı Modu')}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={!isVariablePax ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}
                onClick={() => setIsVariablePax(false)}
              >
                🔵 {t('meals.fixedPax', 'Sabit Kişi Sayısı')}
              </button>
              <button
                type="button"
                className={isVariablePax ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px', fontWeight: 600, backgroundColor: isVariablePax ? '#8B5CF6' : undefined, borderColor: isVariablePax ? '#8B5CF6' : undefined }}
                onClick={() => setIsVariablePax(true)}
              >
                🟣 {t('meals.variablePax', 'Günlük Değişken Kişi')}
              </button>
            </div>

            {!isVariablePax ? (
              <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                <label className="form-label">{t('meals.paxCount', 'Kişi Sayısı')}</label>
                <FormattedNumberInput
                  className="form-control"
                  value={formData.pax_count}
                  onChange={val => setFormData({ ...formData, pax_count: val })}
                />
              </div>
            ) : (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.08)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#8B5CF6' }}>
                    ⚡ {t('meals.bulkApplyTitle', 'Pratik Doldurma')}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={handleSyncMorningToEvening}
                      title="Sabah sayılarını Akşam sayılarına kopyalar"
                    >
                      🔗 {t('meals.syncMorningToEvening', 'Sabah\'ı Akşam\'a Eşitle')}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={handleApplyFirstDayPaxToAll}
                      title={t('meals.applyFirstDayTooltip', '1. günün kişi sayılarını tüm günlere kopyalar')}
                    >
                      {t('meals.applyFirstDay', '1. Günü Tümüne Uygula')}
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {dailyPaxList.map((item, idx) => (
                    <div
                      key={item.date || idx}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ minWidth: '120px' }}>
                        <strong>{idx + 1}. Gün</strong> <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({new Date(item.date).toLocaleDateString('tr-TR')})</span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🌅 Sabah:</span>
                          <div style={{ width: '80px' }}>
                            <FormattedNumberInput
                              className="form-control"
                              style={{ padding: '4px 6px', fontSize: '13px', textAlign: 'right' }}
                              value={item.morning_pax}
                              onChange={val => {
                                setDailyPaxList(prev => prev.map((p, i) => i === idx ? { ...p, morning_pax: val } : p));
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🌃 Akşam:</span>
                          <div style={{ width: '80px' }}>
                            <FormattedNumberInput
                              className="form-control"
                              style={{ padding: '4px 6px', fontSize: '13px', textAlign: 'right' }}
                              value={item.evening_pax}
                              onChange={val => {
                                setDailyPaxList(prev => prev.map((p, i) => i === idx ? { ...p, evening_pax: val } : p));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('meals.morningPrice', 'Sabah Fiyatı')}</label>
              <FormattedNumberInput
                className="form-control"
                value={formData.morning_price}
                onChange={val => setFormData({ ...formData, morning_price: val })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('meals.eveningPrice', 'Akşam Fiyatı')}</label>
              <FormattedNumberInput
                className="form-control"
                value={formData.evening_price}
                onChange={val => setFormData({ ...formData, evening_price: val })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('common.currency', 'Para Birimi')}</label>
            <SearchableSelect
              options={[
                { value: 'SAR', label: 'SAR (ر.س)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'TRY', label: 'TRY (₺)' }
              ]}
              value={formData.currency}
              onChange={val => setFormData({ ...formData, currency: val as string })}
              hideSearch
            />
          </div>

          {/* Custom Exchange Rate Field for SAR <-> USD */}
          {(formData.currency === 'SAR' || formData.currency === 'USD') && (
            <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('common.exchangeRateUsdSar', 'Kur (USD ↔ SAR)')}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('common.defaultRate', 'Varsayılan:')} {rates['SAR']?.toFixed(2) || '3.75'}</span>
              </label>
              <FormattedNumberInput
                className="form-control"
                value={customRate || ''}
                onChange={val => setCustomRate(val)}
              />
            </div>
          )}

          {/* Excursion Section */}
          <div style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>
                ⛺ {t('meals.excursionSectionTitle', 'Gezi / Gün Düşüşü')}
              </span>
              {(formData.excursion_days || 0) > 0 && (
                <button
                  type="button"
                  className="btn-text"
                  style={{ fontSize: '12px', color: '#EF4444' }}
                  onClick={() => setFormData({
                    ...formData,
                    excursion_start_date: '',
                    excursion_end_date: '',
                    excursion_days: 0,
                    excursion_note: ''
                  })}
                >
                  {t('meals.removeExcursion', 'Geziyi Kaldır')}
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('meals.excursionStartDate', 'Gezi Başlangıç Tarihi')}</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.excursion_start_date || ''}
                  onChange={e => {
                    const sDate = e.target.value;
                    const eDate = formData.excursion_end_date || sDate;
                    let days = formData.excursion_days || 0;
                    if (sDate && eDate) {
                      const diffTime = new Date(eDate).getTime() - new Date(sDate).getTime();
                      if (diffTime >= 0) {
                        days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                      }
                    }
                    setFormData({
                      ...formData,
                      excursion_start_date: sDate,
                      excursion_end_date: eDate,
                      excursion_days: days
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('meals.excursionEndDate', 'Gezi Bitiş Tarihi')}</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.excursion_end_date || ''}
                  onChange={e => {
                    const eDate = e.target.value;
                    const sDate = formData.excursion_start_date || eDate;
                    let days = formData.excursion_days || 0;
                    if (sDate && eDate) {
                      const diffTime = new Date(eDate).getTime() - new Date(sDate).getTime();
                      if (diffTime >= 0) {
                        days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                      }
                    }
                    setFormData({
                      ...formData,
                      excursion_end_date: eDate,
                      excursion_days: days
                    });
                  }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('meals.excursionDays', 'Düşülecek Gün Sayısı')}</label>
                <FormattedNumberInput
                  className="form-control"
                  value={formData.excursion_days || 0}
                  onChange={val => setFormData({ ...formData, excursion_days: val })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('meals.excursionNote', 'Gezi Notu / Açıklama')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('meals.excursionNotePlaceholder', 'Örn: Mekke Gezisi')}
                  value={formData.excursion_note || ''}
                  onChange={e => setFormData({ ...formData, excursion_note: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('meals.calculatedDays', 'Hesaplanan Gün Sayısı:')}</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{formData.total_days} {t('meals.daySuffix', 'Gün')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('meals.totalAmount', 'Toplam Tutar:')}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)' }}>
                  {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(formData.total_amount)} {formData.currency}
                </div>
                {formData.currency === 'SAR' && currentRate ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ~ {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(formData.total_amount / currentRate)} USD
                  </div>
                ) : formData.currency === 'USD' && currentRate ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ~ {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(formData.total_amount * currentRate)} SAR
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel', 'İptal')}
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? t('common.saving', 'Kaydediliyor...') : t('common.save', 'Kaydet')}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
