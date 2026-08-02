import { forwardRef } from 'react';
import type { MealCalculation } from '../types';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { useTranslation } from 'react-i18next';

interface BatchMealPrintViewProps {
  meals: MealCalculation[];
}

export const BatchMealPrintView = forwardRef<HTMLDivElement, BatchMealPrintViewProps>(({ meals }, ref) => {
  const { t } = useTranslation();
  const { rates } = useExchangeRates();
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const rate = rates['SAR'] || 3.75;

  // Calculate totals
  const totalNetDays = meals.reduce((sum, m) => sum + m.total_days, 0);
  const totalExcursionDays = meals.reduce((sum, m) => sum + (m.excursion_days || 0), 0);
  const totalGrossDays = totalNetDays + totalExcursionDays;
  
  // Aggregate amounts by currency
  const totalsByCurrency: Record<string, number> = {};
  meals.forEach(m => {
    if (!totalsByCurrency[m.currency]) totalsByCurrency[m.currency] = 0;
    totalsByCurrency[m.currency] += m.total_amount;
  });

  return (
    <div ref={ref} className="bg-white text-black p-8" style={{ width: '100%', minHeight: '100vh', direction: 'ltr', color: '#000', backgroundColor: '#fff' }}>
      <div style={{ textAlign: "center", marginBottom: "32px", borderBottom: "2px solid black", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase" }}>{t('meals.batchPrintTitle', 'OSMANLI MUTFAĞI UMRE ACENTA GİRİŞ-ÇIKIŞ HESAP TABLOSU (TOPLU DÖKÜM)')}</h1>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginTop: "8px" }} dir="rtl">المطبخ العثماني 2025 حاسبة الدخول والخروج لوكالة العمرة (كشف جماعي)</h2>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid black", textAlign: "center", fontSize: "12px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.companyName', 'ŞİRKET ADI')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.hotelName', 'OTEL ADI')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.checkInDate', 'GİRİŞ TARİHİ')}</th>
            <th style={{ border: "1px solid black", padding: "6px", color: "#dc2626" }}>{t('meals.morning', 'SABAH')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.evening', 'AKŞAM')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.checkOutDate', 'ÇIKIŞ TARİHİ')}</th>
            <th style={{ border: "1px solid black", padding: "6px", color: "#dc2626" }}>{t('meals.morning', 'SABAH')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.evening', 'AKŞAM')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.paxCount', 'KİŞİ SAYISI')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.dayCount', 'BRÜT GÜN')}</th>
            <th style={{ border: "1px solid black", padding: "6px", color: "#dc2626", backgroundColor: "#fef2f2" }}>{t('meals.excursionHeader', 'GEZİ DÜŞÜŞÜ')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.morningPrice', 'SABAH FİYAT')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.eveningPrice', 'AKŞAM FİYAT')}</th>
            <th style={{ border: "1px solid black", padding: "6px" }}>{t('meals.totalAmount', 'TOPLAM TUTAR')}</th>
          </tr>
          <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }} dir="rtl">
            <th style={{ border: "1px solid black", padding: "4px" }}>( اسم الشركة )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( اسم الفندق )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( تاريخ الدخول )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( صباح )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( مساء )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( تاريخ الخروج )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( صباح )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( مساء )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( عدد الأشخاص )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( عدد الأيام )</th>
            <th style={{ border: "1px solid black", padding: "4px", color: "#dc2626", backgroundColor: "#fef2f2" }}>( خصم الرحلة )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( سعر الصباح )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( سعر المساء )</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>( المبلغ الإجمالي )</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal, index) => {
            const excursionDays = meal.excursion_days || 0;
            const grossDays = meal.total_days + excursionDays;
            const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);
            const costPerDayAllPax = meal.pax_count * dailyPrice;
            const deductionAmount = excursionDays * costPerDayAllPax;

            return (
              <tr key={meal.id || index}>
                <td style={{ border: "1px solid black", padding: "6px", fontWeight: "bold" }}>{meal.company_name}</td>
                <td style={{ border: "1px solid black", padding: "6px" }}>{meal.hotel_name}</td>
                <td style={{ border: "1px solid black", padding: "6px" }}>{formatDate(meal.entry_date)}</td>
                <td style={{ border: "1px solid black", padding: "6px", color: "#dc2626", fontWeight: "bold" }}>{meal.entry_morning > 0 ? '0,5' : '-'}</td>
                <td style={{ border: "1px solid black", padding: "6px", color: "#dc2626", fontWeight: "bold" }}>{meal.entry_evening > 0 ? '0,5' : '-'}</td>
                <td style={{ border: "1px solid black", padding: "6px" }}>{formatDate(meal.exit_date)}</td>
                <td style={{ border: "1px solid black", padding: "6px", color: "#dc2626", fontWeight: "bold" }}>{meal.exit_morning > 0 ? '0,5' : '-'}</td>
                <td style={{ border: "1px solid black", padding: "6px", color: "#dc2626", fontWeight: "bold" }}>{meal.exit_evening > 0 ? '0,5' : '-'}</td>
                <td style={{ border: "1px solid black", padding: "6px", fontWeight: "bold" }}>{meal.pax_count}</td>
                <td style={{ border: "1px solid black", padding: "6px", fontWeight: "bold" }}>{grossDays}</td>
                <td style={{ border: "1px solid black", padding: "6px", color: excursionDays > 0 ? "#dc2626" : "inherit", backgroundColor: excursionDays > 0 ? "#fef2f2" : "transparent" }}>
                  {excursionDays > 0 ? (
                    <div>
                      <strong>-{excursionDays} Gün</strong>
                      {meal.excursion_note && (
                        <div style={{ fontSize: "11px", fontWeight: "bold", color: "#991b1b", marginTop: "1px" }}>
                          {meal.excursion_note}
                        </div>
                      )}
                      {meal.excursion_start_date && (
                        <div style={{ fontSize: "10px", color: "#4b5563" }}>
                          ({formatDate(meal.excursion_start_date)} - {formatDate(meal.excursion_end_date || meal.excursion_start_date)})
                        </div>
                      )}
                      <div style={{ fontSize: "10px", fontWeight: "bold", color: "#dc2626" }}>
                        (-{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(deductionAmount)} {meal.currency})
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ border: "1px solid black", padding: "6px" }}>{meal.morning_price}</td>
                <td style={{ border: "1px solid black", padding: "6px" }}>{meal.evening_price}</td>
                <td style={{ border: "1px solid black", padding: "6px", fontWeight: "bold" }}>
                  {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(meal.total_amount)} {meal.currency}
                </td>
              </tr>
            );
          })}

          {/* Empty Rows for Spacing if few meals */}
          {meals.length < 3 && Array.from({ length: 3 - meals.length }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td style={{ border: "1px solid black", padding: "6px", height: "32px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
              <td style={{ border: "1px solid black", padding: "6px" }}></td>
            </tr>
          ))}

          {/* Total Row */}
          <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
            <td colSpan={9} style={{ border: "1px solid black", padding: "8px", textAlign: "right" }} dir="rtl">المجموع الإجمالي</td>
            <td style={{ border: "1px solid black", padding: "8px", backgroundColor: "#fde047" }}>{totalNetDays} gün (Net)</td>
            <td style={{ border: "1px solid black", padding: "8px", color: "#dc2626", backgroundColor: "#fef2f2" }}>
              {totalExcursionDays > 0 ? `-${totalExcursionDays} gün` : '-'}
            </td>
            <td colSpan={2} style={{ border: "1px solid black", padding: "8px", textAlign: "right" }}>{t('meals.grandTotal', 'GENEL TOPLAM')}</td>
            <td style={{ border: "1px solid black", padding: "8px", fontSize: "16px", color: "#15803d", backgroundColor: "#fde047" }}>
              {Object.entries(totalsByCurrency).map(([currency, amount]) => {
                let eqAmount = 0;
                let eqCurrency = '';
                if (currency === 'SAR') { eqAmount = amount / rate; eqCurrency = 'USD'; }
                else if (currency === 'USD') { eqAmount = amount * rate; eqCurrency = 'SAR'; }
                
                return (
                  <div key={currency} style={{ marginBottom: '4px' }}>
                    <div>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(amount)} {currency}</div>
                    {eqAmount > 0 && (
                      <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 'normal' }}>
                        (~ {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(eqAmount)} {eqCurrency})
                      </div>
                    )}
                  </div>
                );
              })}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ marginTop: "48px", display: "flex", justifyContent: "space-between", padding: "0 40px", fontSize: "14px", fontWeight: "bold" }}>
        <div style={{ textAlign: "center" }}>
          <p>{t('meals.customerApproval', 'MÜŞTERİ ONAYI')}</p>
          <p dir="rtl" style={{ marginTop: "4px" }}>موافقة العميل</p>
          <div style={{ marginTop: "16px", borderBottom: "1px solid black", width: "128px", margin: "0 auto" }}></div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p>{t('meals.deliveredBy', 'TESLİM EDEN')}</p>
          <p dir="rtl" style={{ marginTop: "4px" }}>المُسَلِّم</p>
          <div style={{ marginTop: "16px", borderBottom: "1px solid black", width: "128px", margin: "0 auto" }}></div>
        </div>
      </div>
    </div>
  );
});

BatchMealPrintView.displayName = 'BatchMealPrintView';
