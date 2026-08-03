import { forwardRef } from 'react';
import type { MealCalculation } from '../types';
import { getExcursionsFromMeal, calculateTotalPaxSums } from '../types';
import type { MealExportTemplate } from '../../../core/utils/mealExcelExport';
import { useTranslation } from 'react-i18next';

interface BatchMealPrintViewProps {
  meals: MealCalculation[];
  template?: MealExportTemplate;
}

export const BatchMealPrintView = forwardRef<HTMLDivElement, BatchMealPrintViewProps>(
  ({ meals, template = 'standard' }, ref) => {
    const { t } = useTranslation();

    const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('tr-TR');
    };

    // Calculate Grand Totals across all meals in batch
    let grandPaxSum = 0;
    let grandGrossDaysSum = 0;
    let grandExcursionDaysSum = 0;
    const totalsByCurrency: Record<string, number> = {};

    meals.forEach(meal => {
      const excursions = getExcursionsFromMeal(meal);
      const excDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
      const grossDays = meal.total_days + excDays;

      grandPaxSum += meal.pax_count;
      grandGrossDaysSum += grossDays;
      grandExcursionDaysSum += excDays;

      if (!totalsByCurrency[meal.currency]) totalsByCurrency[meal.currency] = 0;
      totalsByCurrency[meal.currency] += meal.total_amount;
    });

    return (
      <div
        ref={ref}
        className="bg-white text-black p-6"
        style={{
          width: '100%',
          direction: 'ltr',
          color: '#000',
          backgroundColor: '#fff',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Document Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid black', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
            {t('meals.batchPrintTitle', 'OSMANLI MUTFAĞI UMRE ACENTA GİRİŞ-ÇIKIŞ HESAP TABLOSU (TOPLU DÖKÜM)')}
          </h1>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '6px', margin: 0 }} dir="rtl">
            المطبخ العثماني - حاسبة وجبات وجداول دخول وخروج مجموعات العمرة (كشف جماعي - {meals.length} مجموعات)
          </h2>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '6px', color: '#4B5563' }}>
            {template === 'standard' && 'STANDART ÖZET TOPLU DÖKÜM TABLOSU (جدول الملخص الجماعي)'}
            {template === 'daily' && 'GÜNLÜK PAX DETAYLI TOPLU DÖKÜM TABLOSU (الكشف التفصيلي اليومي)'}
            {template === 'excursion' && 'GEZİ DÜŞÜŞLERİ DETAYLI TOPLU DÖKÜM TABLOSU (تفاصيل خصومات الرحلات الجماعية)'}
            {template === 'corporate' && 'KURUMSAL RESMİ HAKEDİŞ VE MUTABAKAT BELGESİ (وثيقة الاعتماد والمطابقة الرسمية)'}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TEMPLATE 1 & TEMPLATE 4: STANDARD & CORPORATE BATCH TABLES */}
        {/* ------------------------------------------------------------- */}
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
                  <th style={{ border: '1px solid black', padding: '4px' }}>(اسم الشركة)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(اسم الفندق)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(تاريخ الدخول)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(صباح)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(مساء)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(تاريخ الخروج)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(صباح)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(مساء)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(عدد الأشخاص)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(عدد الأيام)</th>
                  <th style={{ border: '1px solid black', padding: '4px', backgroundColor: '#7F1D1D' }}>(خصم الرحلة)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(سعر الصباح)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(سعر المساء)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>(المبلغ الإجمالي)</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((meal, index) => {
                  const excursions = getExcursionsFromMeal(meal);
                  const excDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
                  const grossDays = meal.total_days + excDays;

                  return (
                    <tr key={meal.id || index} style={{ backgroundColor: index % 2 === 1 ? '#F9FAFB' : '#FFFFFF' }}>
                      <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>{meal.company_name || '-'}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{meal.hotel_name}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{formatDate(meal.entry_date)}</td>
                      <td style={{ border: '1px solid black', padding: '6px', color: '#dc2626', fontWeight: 'bold' }}>{meal.entry_morning > 0 ? '0,5' : '-'}</td>
                      <td style={{ border: '1px solid black', padding: '6px', color: '#dc2626', fontWeight: 'bold' }}>{meal.entry_evening > 0 ? '0,5' : '-'}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{formatDate(meal.exit_date)}</td>
                      <td style={{ border: '1px solid black', padding: '6px', color: '#dc2626', fontWeight: 'bold' }}>{meal.exit_morning > 0 ? '0,5' : '-'}</td>
                      <td style={{ border: '1px solid black', padding: '6px', color: '#dc2626', fontWeight: 'bold' }}>{meal.exit_evening > 0 ? '0,5' : '-'}</td>
                      <td style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                        <div style={{ color: '#DC2626' }}>S: {calculateTotalPaxSums(meal).totalMorningPax}</div>
                        <div>A: {calculateTotalPaxSums(meal).totalEveningPax}</div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{grossDays} Gün</td>
                      <td style={{ border: '1px solid black', padding: '6px', backgroundColor: excDays > 0 ? '#FEF2F2' : 'transparent', color: excDays > 0 ? '#DC2626' : 'black', fontWeight: excDays > 0 ? 'bold' : 'normal' }}>
                        {excDays > 0 ? `${excDays} Gün` : '-'}
                      </td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{meal.morning_price} {meal.currency}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{meal.evening_price} {meal.currency}</td>
                      <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>
                        <div>{meal.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}</div>
                        <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '2px' }}>
                          S: {(calculateTotalPaxSums(meal).totalMorningPax * (meal.morning_price || 0)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '10px', color: '#4B5563' }}>
                          A: {(calculateTotalPaxSums(meal).totalEveningPax * (meal.evening_price || 0)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Footer Row */}
                <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px' }}>
                  <td colSpan={8} style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>
                    GENEL TOPLAM / الإجمالي الكلي ({meals.length} Kayıt):
                  </td>
                  <td style={{ border: '1px solid black', padding: '10px' }}>{grandPaxSum}</td>
                  <td style={{ border: '1px solid black', padding: '10px' }}>{grandGrossDaysSum} Gün</td>
                  <td style={{ border: '1px solid black', padding: '10px', backgroundColor: '#991B1B' }}>
                    {grandExcursionDaysSum > 0 ? `${grandExcursionDaysSum} Gün` : '-'}
                  </td>
                  <td colSpan={2} style={{ border: '1px solid black', padding: '10px' }}>-</td>
                  <td style={{ border: '1px solid black', padding: '10px', fontSize: '14px' }}>
                    {Object.entries(totalsByCurrency).map(([curr, amt]) => (
                      <div key={curr}>
                        {amt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {curr}
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Corporate Stamp/Signature Approval Section */}
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

        {/* ------------------------------------------------------------- */}
        {/* TEMPLATE 2: DAILY VARIABLE PAX BATCH TABLE */}
        {/* ------------------------------------------------------------- */}
        {template === 'daily' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {meals.map((meal, mIdx) => {
              const start = new Date(meal.entry_date);
              const end = new Date(meal.exit_date);
              const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);
              let mealPaxSum = 0;
              let mealAmountSum = 0;

              return (
                <div key={meal.id || mIdx} style={{ border: '1px solid #374151', borderRadius: '6px', padding: '12px', backgroundColor: '#FFFFFF' }}>
                  {/* Header Banner for Meal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', color: '#FFFFFF', padding: '8px 12px', borderRadius: '4px', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                    <span>{mIdx + 1}. Kayıt: {meal.company_name || '-'} — {meal.hotel_name}</span>
                    <span>Tarih: {formatDate(meal.entry_date)} - {formatDate(meal.exit_date)}</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D1D5DB', textAlign: 'center', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#374151', color: '#FFFFFF', fontWeight: 'bold' }}>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>GÜN NO</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>TARİH</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>GÜN</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px', color: '#FCA5A5' }}>SABAH KİŞİ SAYISI</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>AKŞAM KİŞİ SAYISI</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>SABAH FİYAT</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>AKŞAM FİYAT</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>GÜNLÜK TOPLAM TUTAR</th>
                      </tr>
                      <tr style={{ backgroundColor: '#4B5563', color: '#E5E7EB', fontWeight: 'bold' }} dir="rtl">
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(رقم اليوم)</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(التاريخ)</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(اليوم)</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(عدد أشخاص الصباح)</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(عدد أشخاص المساء)</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(سعر الصباح)</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(سعر المساء)</th>
                        <th style={{ border: '1px solid #D1D5DB', padding: '4px' }}>(المبلغ اليومي الإجمالي)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows = [];
                        let dayCount = 1;
                        let mealMorningPaxSum = 0;
                        let mealEveningPaxSum = 0;

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

                          mealMorningPaxSum += mPax;
                          mealEveningPaxSum += ePax;
                          mealAmountSum += dailyTotal;

                          rows.push(
                            <tr key={dateStr} style={{ backgroundColor: dayCount % 2 === 0 ? '#F9FAFB' : '#FFFFFF' }}>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px', fontWeight: 'bold' }}>{dayCount}. Gün</td>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px' }}>{formatDate(dateStr)}</td>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px' }}>{dayNameTr} / {dayNameAr}</td>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px', fontWeight: 'bold', color: '#DC2626' }}>{mPax}</td>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px', fontWeight: 'bold' }}>{ePax}</td>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px' }}>{meal.morning_price} {meal.currency}</td>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px' }}>{meal.evening_price} {meal.currency}</td>
                              <td style={{ border: '1px solid #D1D5DB', padding: '4px', fontWeight: 'bold' }}>
                                {dailyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                              </td>
                            </tr>
                          );
                          dayCount++;
                        }

                        rows.push(
                          <tr key="subtotal" style={{ backgroundColor: '#F3F4F6', fontWeight: 'bold', fontSize: '12px' }}>
                            <td colSpan={3} style={{ border: '1px solid #D1D5DB', padding: '6px', textAlign: 'right' }}>
                              HESAP TOPLAMI / إجمالي المجموعة:
                            </td>
                            <td style={{ border: '1px solid #D1D5DB', padding: '6px', color: '#DC2626' }}>{mealMorningPaxSum}</td>
                            <td style={{ border: '1px solid #D1D5DB', padding: '6px' }}>{mealEveningPaxSum}</td>
                            <td colSpan={2} style={{ border: '1px solid #D1D5DB', padding: '6px' }}>-</td>
                            <td style={{ border: '1px solid #D1D5DB', padding: '6px', color: '#059669', fontSize: '13px' }}>
                              {meal.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                            </td>
                          </tr>
                        );

                        return rows;
                      })()}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Grand Summary Footer Card */}
            <div style={{ border: '2px solid #1F2937', borderRadius: '6px', padding: '14px', backgroundColor: '#1F2937', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              <span>TÜM GRUPLAR GENEL TOPLAMI / الإجمالي الكلي لجميع المجموعات ({meals.length} Kayıt):</span>
              <span>
                {Object.entries(totalsByCurrency).map(([curr, amt]) => (
                  <span key={curr} style={{ marginLeft: '16px', color: '#34D399' }}>
                    {amt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {curr}
                  </span>
                ))}
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TEMPLATE 3: EXCURSION DEDUCTIONS BATCH TABLE */}
        {/* ------------------------------------------------------------- */}
        {template === 'excursion' && (
          <div>
            <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '13px', color: '#1E3A8A' }}>
              1. BRÜT KONAKLAMA VE HESAP ÖZETLERİ (معلومات الإقامة الإجمالية)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', fontSize: '12px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF', fontWeight: 'bold' }}>
                  <th style={{ border: '1px solid black', padding: '6px' }}>ŞİRKET ADI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>OTEL ADI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GİRİŞ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>ÇIKIŞ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>BRÜT GÜN</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KİŞİ SAYISI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GÜNLÜK KİŞİ BAŞI FİYAT</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>NET TUTAR</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((meal, idx) => {
                  const excursions = getExcursionsFromMeal(meal);
                  const excDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
                  const grossDays = meal.total_days + excDays;
                  const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);

                  return (
                    <tr key={meal.id || idx} style={{ backgroundColor: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF' }}>
                      <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>{meal.company_name || '-'}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{meal.hotel_name}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{formatDate(meal.entry_date)}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{formatDate(meal.exit_date)}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{grossDays} Gün</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{meal.pax_count}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{dailyPrice} {meal.currency}</td>
                      <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', color: '#059669' }}>
                        {meal.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '13px', color: '#991B1B' }}>
              2. TOPLU GEZİ VE YEMEK KESİNTİSİ DÖKÜM DETAYLARI (تفاصيل خصومات الرحلات والوجبات)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #991B1B', textAlign: 'center', fontSize: '11px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#991B1B', color: '#FFFFFF', fontWeight: 'bold' }}>
                  <th style={{ border: '1px solid black', padding: '6px' }}>ŞİRKET / OTEL</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>GEZİ ADI / NO</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>BAŞLANGIÇ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>BİTİŞ TARİHİ</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KESİNTİ GÜN</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KİŞİ SAYISI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KESİNTİ AÇIKLAMASI</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>TOPLAM KESİNTİ TUTARI</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let hasExcursions = false;
                  const excRows: any[] = [];

                  meals.forEach((meal, mIdx) => {
                    const excursions = getExcursionsFromMeal(meal);
                    const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);
                    const costPerDayAllPax = meal.pax_count * dailyPrice;

                    excursions.forEach((exc, eIdx) => {
                      hasExcursions = true;
                      const dAmount = (exc.days || 0) * costPerDayAllPax;

                      excRows.push(
                        <tr key={`${mIdx}-${eIdx}`}>
                          <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>
                            {meal.company_name || '-'} ({meal.hotel_name})
                          </td>
                          <td style={{ border: '1px solid black', padding: '6px' }}>{eIdx + 1}. Gezi</td>
                          <td style={{ border: '1px solid black', padding: '6px' }}>{formatDate(exc.start_date)}</td>
                          <td style={{ border: '1px solid black', padding: '6px' }}>{formatDate(exc.end_date)}</td>
                          <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>{exc.days} Gün</td>
                          <td style={{ border: '1px solid black', padding: '6px' }}>{meal.pax_count}</td>
                          <td style={{ border: '1px solid black', padding: '6px' }}>{exc.note || '-'}</td>
                          <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', color: '#DC2626' }}>
                            -{dAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                          </td>
                        </tr>
                      );
                    });
                  });

                  if (!hasExcursions) {
                    return (
                      <tr>
                        <td colSpan={8} style={{ padding: '12px', color: '#6B7280' }}>
                          Seçili hesaplarda gezi veya kesinti kaydı bulunmamaktadır. (لا توجد خصومات رحلات)
                        </td>
                      </tr>
                    );
                  }

                  return excRows;
                })()}
              </tbody>
            </table>

            {/* Grand Summary Card */}
            <div style={{ marginLeft: 'auto', width: '420px', border: '2px solid #065F46', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '14px', fontWeight: 'bold' }}>
                <span>TOPLAM NET ÖDENECEK TUTAR (الصافي الكلي):</span>
                <span>
                  {Object.entries(totalsByCurrency).map(([curr, amt]) => (
                    <div key={curr}>
                      {amt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {curr}
                    </div>
                  ))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
