import { forwardRef } from 'react';
import type { MealCalculation } from '../types';
import { getExcursionsFromMeal, calculateTotalPaxSums } from '../types';
import type { MealExportTemplate } from '../../../core/utils/mealExcelExport';
import { useTranslation } from 'react-i18next';

interface MealTemplatePrintViewProps {
  meal: MealCalculation;
  template?: MealExportTemplate;
}

export const MealTemplatePrintView = forwardRef<HTMLDivElement, MealTemplatePrintViewProps>(
  ({ meal, template = 'standard' }, ref) => {
    const { t } = useTranslation();

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    const excursions = getExcursionsFromMeal(meal);
    const totalExcursionDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
    const grossDays = meal.total_days + totalExcursionDays;
    const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);
    const costPerDayAllPax = meal.pax_count * dailyPrice;
    const grossAmount = grossDays * costPerDayAllPax;
    const deductionAmount = totalExcursionDays * costPerDayAllPax;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8"
        style={{
          width: '100%',
          minHeight: '100vh',
          direction: 'ltr',
          color: '#000',
          backgroundColor: '#fff',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Document Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
            {t('meals.printTitle', 'OSMANLI MUTFAĞI UMRE ACENTA GİRİŞ-ÇIKIŞ HESAP TABLOSU')}
          </h1>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '6px', margin: 0 }} dir="rtl">
            المطبخ العثماني - حاسبة وجبات وجداول دخول وخروج مجموعات العمرة
          </h2>
          {template === 'corporate' && (
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '8px', color: '#1E3A8A' }}>
              RESMİ HAKEDİŞ VE MUTABAKAT BELGESİ (وثيقة الاعتماد والمطابقة الرسمية)
            </div>
          )}
        </div>

        {/* Render Template 1 or Template 4 (Standard or Corporate) */}
        {(template === 'standard' || template === 'corporate') && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF', fontWeight: 'bold' }}>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.companyName', 'ŞİRKET ADI')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.hotelName', 'OTEL ADI')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.checkInDate', 'GİRİŞ TARİHİ')}</th>
                  <th style={{ border: '1px solid black', padding: '6px', color: '#FCA5A5' }}>{t('meals.morning', 'SABAH')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.evening', 'AKŞAM')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.checkOutDate', 'ÇIKIŞ TARİHİ')}</th>
                  <th style={{ border: '1px solid black', padding: '6px', color: '#FCA5A5' }}>{t('meals.morning', 'SABAH')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.evening', 'AKŞAM')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.paxCount', 'KİŞİ SAYISI')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.dayCount', 'BRÜT GÜN')}</th>
                  <th style={{ border: '1px solid black', padding: '6px', backgroundColor: '#991B1B', color: '#FFFFFF' }}>{t('meals.excursionHeader', 'GEZİ DÜŞÜŞÜ')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.morningPrice', 'SABAH FİYAT')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.eveningPrice', 'AKŞAM FİYAT')}</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>{t('meals.totalAmount', 'TOPLAM TUTAR')}</th>
                </tr>
                <tr style={{ backgroundColor: '#374151', color: '#E5E7EB', fontWeight: 'bold' }} dir="rtl">
                  <th style={{ border: '1px solid black', padding: '6px' }}>(اسم الشركة)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(اسم الفندق)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(تاريخ الدخول)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(صباح)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(مساء)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(تاريخ الخروج)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(صباح)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(مساء)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(عدد الأشخاص)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(عدد الأيام)</th>
                  <th style={{ border: '1px solid black', padding: '6px', backgroundColor: '#7F1D1D' }}>(خصم الرحلة)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(سعر الصباح)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(سعر المساء)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(المبلغ الإجمالي)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{meal.company_name || '-'}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{meal.hotel_name}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{formatDate(meal.entry_date)}</td>
                  <td style={{ border: '1px solid black', padding: '8px', color: '#dc2626', fontWeight: 'bold' }}>{meal.entry_morning > 0 ? '0,5' : '-'}</td>
                  <td style={{ border: '1px solid black', padding: '8px', color: '#dc2626', fontWeight: 'bold' }}>{meal.entry_evening > 0 ? '0,5' : '-'}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{formatDate(meal.exit_date)}</td>
                  <td style={{ border: '1px solid black', padding: '8px', color: '#dc2626', fontWeight: 'bold' }}>{meal.exit_morning > 0 ? '0,5' : '-'}</td>
                  <td style={{ border: '1px solid black', padding: '8px', color: '#dc2626', fontWeight: 'bold' }}>{meal.exit_evening > 0 ? '0,5' : '-'}</td>
                  <td style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                    <div style={{ fontSize: '12px', color: '#1F2937' }}>{meal.is_variable_pax ? `~${meal.pax_count} Pax` : `${meal.pax_count} Pax`}</div>
                    <div style={{ color: '#DC2626', fontSize: '10px' }}>S: {calculateTotalPaxSums(meal).totalMorningPax}</div>
                    <div style={{ color: '#4B5563', fontSize: '10px' }}>A: {calculateTotalPaxSums(meal).totalEveningPax}</div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{grossDays} Gün</td>
                  <td style={{ border: '1px solid black', padding: '8px', backgroundColor: totalExcursionDays > 0 ? '#FEF2F2' : 'transparent', color: totalExcursionDays > 0 ? '#DC2626' : 'black', fontWeight: totalExcursionDays > 0 ? 'bold' : 'normal' }}>
                    {totalExcursionDays > 0 ? `${totalExcursionDays} Gün` : '-'}
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{meal.morning_price} {meal.currency}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{meal.evening_price} {meal.currency}</td>
                  <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>
                    <div style={{ fontSize: '13px', color: '#1F2937' }}>
                      {meal.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                    </div>
                    <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '2px' }}>
                      S: {(calculateTotalPaxSums(meal).totalMorningPax * (meal.morning_price || 0)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '10px', color: '#4B5563' }}>
                      A: {(calculateTotalPaxSums(meal).totalEveningPax * (meal.evening_price || 0)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </div>
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#DBEAFE', color: '#1E3A8A', fontWeight: 'bold', fontSize: '12px' }}>
                  <td colSpan={11} style={{ border: '1px solid black', padding: '6px', textAlign: 'right' }}>
                    ÖĞÜN FİYAT TOPLAMLARI / (المبالغ الإجمالية):
                  </td>
                  <td style={{ border: '1px solid black', padding: '6px', color: '#DC2626' }}>
                    S: {(calculateTotalPaxSums(meal).totalMorningPax * (meal.morning_price || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                  </td>
                  <td style={{ border: '1px solid black', padding: '6px', color: '#1E3A8A' }}>
                    A: {(calculateTotalPaxSums(meal).totalEveningPax * (meal.evening_price || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                  </td>
                  <td style={{ border: '1px solid black', padding: '6px', fontSize: '13px', color: '#1E3A8A' }}>
                    {meal.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Excursion Notes Section */}
            {excursions.length > 0 && (
              <div style={{ marginTop: '20px', border: '1px solid #991B1B', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '8px 12px', fontWeight: 'bold', fontSize: '13px' }}>
                  GEZİ / KESİNTİ DÜŞÜŞ DETAYLARI (تفاصيل الخصومات والرحلات)
                </div>
                <div style={{ padding: '12px', fontSize: '12px' }}>
                  {excursions.map((exc, idx) => (
                    <div key={idx} style={{ marginBottom: '6px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#991B1B' }}>{idx + 1}. Gezi:</span>
                      <span>Tarih: {formatDate(exc.start_date)} - {formatDate(exc.end_date)}</span>
                      <span>Süre: <strong>{exc.days} Gün</strong></span>
                      {exc.note && <span style={{ color: '#4B5563' }}>Açıklama: <em>{exc.note}</em></span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stamp & Signature Section for Corporate Template */}
            {template === 'corporate' && (
              <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                <div style={{ border: '1px solid #374151', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginBottom: '40px' }}>
                    HAZIRLAYAN / TESLİM EDEN (إعداد وتكليف الخدمة)
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontStyle: 'italic' }}>
                    İmza & Kaşe / التوقيع والختم
                  </div>
                </div>

                <div style={{ border: '1px solid #374151', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginBottom: '40px' }}>
                    KONTROL EDEN / ACENTA ONAYI (مراجعة واعتماد الوكالة)
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontStyle: 'italic' }}>
                    İmza & Kaşe / التوقيع والختم
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Render Template 2 (Daily Variable Pax Breakdown) */}
        {template === 'daily' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', fontSize: '13px', padding: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
              <div><strong>Şirket / Acenta (الشركة):</strong> {meal.company_name || '-'}</div>
              <div><strong>Otel Adı (الفندق):</strong> {meal.hotel_name}</div>
              <div><strong>Tarih (التاريخ):</strong> {formatDate(meal.entry_date)} - {formatDate(meal.exit_date)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF', fontWeight: 'bold' }}>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GÜN NO</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>TARİH</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GÜN</th>
                  <th style={{ border: '1px solid black', padding: '6px', color: '#FCA5A5' }}>SABAH KİŞİ SAYISI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>AKŞAM KİŞİ SAYISI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>SABAH FİYAT</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>AKŞAM FİYAT</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GÜNLÜK TOPLAM TUTAR</th>
                </tr>
                <tr style={{ backgroundColor: '#374151', color: '#E5E7EB', fontWeight: 'bold' }} dir="rtl">
                  <th style={{ border: '1px solid black', padding: '6px' }}>(رقم اليوم)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(التاريخ)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(اليوم)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(عدد أشخاص الصباح)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(عدد أشخاص المساء)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(سعر الصباح)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(سعر المساء)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(المبلغ اليومي الإجمالي)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const start = new Date(meal.entry_date);
                  const end = new Date(meal.exit_date);
                  const rows = [];
                  let dayCount = 1;
                  let grandMorningPaxSum = 0;
                  let grandEveningPaxSum = 0;
                  let grandAmountSum = 0;

                  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    let mPax = meal.pax_count;
                    let ePax = meal.pax_count;

                    if (meal.is_variable_pax && meal.daily_pax && meal.daily_pax.length > 0) {
                      const found = meal.daily_pax.find(p => p.date === dateStr);
                      if (found) {
                        mPax = found.morning_pax ?? found.pax ?? meal.pax_count;
                        ePax = found.evening_pax ?? found.pax ?? meal.pax_count;
                      }
                    }

                    const dayNameTr = d.toLocaleDateString('tr-TR', { weekday: 'long' });
                    const dayNameAr = d.toLocaleDateString('ar-SA', { weekday: 'long' });
                    const dailyTotal = (mPax * (meal.morning_price || 0)) + (ePax * (meal.evening_price || 0));

                    grandMorningPaxSum += mPax;
                    grandEveningPaxSum += ePax;
                    grandAmountSum += dailyTotal;

                    rows.push(
                      <tr key={dateStr} style={{ backgroundColor: dayCount % 2 === 0 ? '#F9FAFB' : '#FFFFFF' }}>
                        <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>{dayCount}. Gün</td>
                        <td style={{ border: '1px solid black', padding: '6px' }}>{formatDate(dateStr)}</td>
                        <td style={{ border: '1px solid black', padding: '6px' }}>{dayNameTr} / {dayNameAr}</td>
                        <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', color: '#DC2626' }}>{mPax}</td>
                        <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>{ePax}</td>
                        <td style={{ border: '1px solid black', padding: '6px' }}>{meal.morning_price} {meal.currency}</td>
                        <td style={{ border: '1px solid black', padding: '6px' }}>{meal.evening_price} {meal.currency}</td>
                        <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>
                          {dailyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                        </td>
                      </tr>
                    );
                    dayCount++;
                  }

                  const mPriceSub = grandMorningPaxSum * (meal.morning_price || 0);
                  const ePriceSub = grandEveningPaxSum * (meal.evening_price || 0);

                  rows.push(
                    <tr key="total-pax" style={{ backgroundColor: '#1F2937', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px' }}>
                      <td colSpan={3} style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>
                        TOPLAM KİŞİ SAYILARI / (عدد الأشخاص)
                      </td>
                      <td style={{ border: '1px solid black', padding: '8px', color: '#FCA5A5' }}>{grandMorningPaxSum}</td>
                      <td style={{ border: '1px solid black', padding: '8px' }}>{grandEveningPaxSum}</td>
                      <td colSpan={2} style={{ border: '1px solid black', padding: '8px' }}>-</td>
                      <td style={{ border: '1px solid black', padding: '8px', fontSize: '14px' }}>
                        {grandAmountSum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                      </td>
                    </tr>
                  );

                  rows.push(
                    <tr key="total-prices" style={{ backgroundColor: '#DBEAFE', color: '#1E3A8A', fontWeight: 'bold', fontSize: '12px' }}>
                      <td colSpan={3} style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>
                        ÖĞÜN FİYAT TOPLAMLARI / (المبالغ الإجمالية)
                      </td>
                      <td style={{ border: '1px solid black', padding: '8px', color: '#DC2626' }}>
                        {mPriceSub.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                      </td>
                      <td style={{ border: '1px solid black', padding: '8px', color: '#1E3A8A' }}>
                        {ePriceSub.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                      </td>
                      <td colSpan={2} style={{ border: '1px solid black', padding: '8px' }}>-</td>
                      <td style={{ border: '1px solid black', padding: '8px', fontSize: '13px', color: '#1E3A8A' }}>
                        {grandAmountSum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                      </td>
                    </tr>
                  );

                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Render Template 3 (Excursion Deductions Breakdown) */}
        {template === 'excursion' && (
          <div>
            <div style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '14px', color: '#1E3A8A' }}>
              1. BRÜT KONAKLAMA BİLGİLERİ (معلومات الإقامة الإجمالية)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', fontSize: '12px', marginBottom: '24px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF', fontWeight: 'bold' }}>
                  <th style={{ border: '1px solid black', padding: '6px' }}>ŞİRKET ADI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>OTEL ADI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GİRİŞ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>ÇIKIŞ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>BRÜT GÜN</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KİŞİ SAYISI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GÜNLÜK KİŞİ BAŞI FİYAT</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>BRÜT TOPLAM TUTAR</th>
                </tr>
                <tr style={{ backgroundColor: '#374151', color: '#E5E7EB', fontWeight: 'bold' }} dir="rtl">
                  <th style={{ border: '1px solid black', padding: '6px' }}>(اسم الشركة)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(اسم الفندق)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(تاريخ الدخول)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(تاريخ الخروج)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(عدد الأيام الإجمالي)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(عدد الأشخاص)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(السعر اليومي للشخص)</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>(المبلغ الإجمالي قبل الخصم)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{meal.company_name || '-'}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{meal.hotel_name}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{formatDate(meal.entry_date)}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{formatDate(meal.exit_date)}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{grossDays} Gün</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{meal.pax_count}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{dailyPrice} {meal.currency}</td>
                  <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>
                    {grossAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '14px', color: '#991B1B' }}>
              2. GEZİ VE YEMEK KESİNTİSİ DÖKÜM DETAYLARI (تفاصيل خصومات الرحلات والوجبات)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #991B1B', textAlign: 'center', fontSize: '12px', marginBottom: '24px' }}>
              <thead>
                <tr style={{ backgroundColor: '#991B1B', color: '#FFFFFF', fontWeight: 'bold' }}>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GEZİ NO</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>BAŞLANGIÇ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>BİTİŞ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KESİNTİ GÜN SAYISI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>ETKİLENEN KİŞİ SAYISI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GÜNLÜK KESİNTİ TUTARI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KESİNTİ AÇIKLAMASI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>TOPLAM KESİNTİ TUTARI</th>
                </tr>
              </thead>
              <tbody>
                {excursions.length > 0 ? (
                  excursions.map((exc, idx) => {
                    const dAmount = (exc.days || 0) * costPerDayAllPax;
                    return (
                      <tr key={idx}>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{idx + 1}. Gezi / Düşüş</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{formatDate(exc.start_date)}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{formatDate(exc.end_date)}</td>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{exc.days} Gün</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{meal.pax_count}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{costPerDayAllPax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{exc.note || '-'}</td>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', color: '#DC2626' }}>
                          -{dAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '12px', color: '#6B7280' }}>
                      Gezi veya kesinti kaydı bulunmamaktadır. (لا توجد خصومات رحلات)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Net Total Summary Card */}
            <div style={{ marginLeft: 'auto', width: '380px', border: '2px solid #065F46', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #E5E7EB', fontSize: '12px' }}>
                <span>BRÜT TUTAR (الإجمالي قبل الخصم):</span>
                <strong>{grossAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', color: '#DC2626' }}>
                <span>TOPLAM KESİNTİ (إجمالي الخصم):</span>
                <strong>-{deductionAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '14px', fontWeight: 'bold' }}>
                <span>NET ÖDENECEK TUTAR (الصافي):</span>
                <span>{(Math.max(0, grossAmount - deductionAmount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
