import { forwardRef } from 'react';
import type { MealCalculation } from '../types';
import { getExcursionsFromMeal } from '../types';
import type { MealExportTemplate } from '../../../core/utils/mealExcelExport';
import { MealTemplatePrintView } from './MealTemplatePrintView';
import { useTranslation } from 'react-i18next';

interface BatchMealPrintViewProps {
  meals: MealCalculation[];
  template?: MealExportTemplate;
}

export const BatchMealPrintView = forwardRef<HTMLDivElement, BatchMealPrintViewProps>(
  ({ meals, template = 'standard' }, ref) => {
    const { t } = useTranslation();

    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('tr-TR');
    };

    if (template === 'daily' || template === 'excursion') {
      return (
        <div ref={ref} className="bg-white text-black p-4" style={{ width: '100%', minHeight: '100vh', color: '#000', backgroundColor: '#fff' }}>
          {meals.map((meal, index) => (
            <div key={meal.id || index} style={{ pageBreakAfter: index < meals.length - 1 ? 'always' : 'auto', marginBottom: '32px' }}>
              <MealTemplatePrintView meal={meal} template={template} />
            </div>
          ))}
        </div>
      );
    }

    // Consolidated Table for Standard and Corporate Templates
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
      <div ref={ref} className="bg-white text-black p-8" style={{ width: '100%', minHeight: '100vh', direction: 'ltr', color: '#000', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif' }}>
        
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid black', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
            {t('meals.batchPrintTitle', 'OSMANLI MUTFAĞI UMRE ACENTA GİRİŞ-ÇIKIŞ HESAP TABLOSU (TOPLU DÖKÜM)')}
          </h1>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '6px', margin: 0 }} dir="rtl">
            المطبخ العثماني - حاسبة وجبات وجداول دخول وخروج مجموعات العمرة (كشف جماعي)
          </h2>
          {template === 'corporate' && (
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '8px', color: '#1E3A8A' }}>
              RESMİ HAKEDİŞ VE MUTABAKAT BELGESİ (وثيقة الاعتماد والمطابقة الرسمية)
            </div>
          )}
        </div>

        {/* Consolidated Data Table */}
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
                  <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>{meal.pax_count}</td>
                  <td style={{ border: '1px solid black', padding: '6px' }}>{grossDays} Gün</td>
                  <td style={{ border: '1px solid black', padding: '6px', backgroundColor: excDays > 0 ? '#FEF2F2' : 'transparent', color: excDays > 0 ? '#DC2626' : 'black', fontWeight: excDays > 0 ? 'bold' : 'normal' }}>
                    {excDays > 0 ? `${excDays} Gün` : '-'}
                  </td>
                  <td style={{ border: '1px solid black', padding: '6px' }}>{meal.morning_price} {meal.currency}</td>
                  <td style={{ border: '1px solid black', padding: '6px' }}>{meal.evening_price} {meal.currency}</td>
                  <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>
                    {meal.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {meal.currency}
                  </td>
                </tr>
              );
            })}

            {/* Grand Total Footer Row */}
            <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px' }}>
              <td colSpan={8} style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>
                GENEL TOPLAM / الإجمالي الكلي ({meals.length} {t('meals.countRecords', 'Kayıt')}):
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

        {/* Corporate Approval Stamp/Signature Boxes */}
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
    );
  }
);
