import { forwardRef } from 'react';
import type { MealCalculation } from '../types';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { useTranslation } from 'react-i18next';

interface MealPrintViewProps {
  meal: MealCalculation;
}

export const MealPrintView = forwardRef<HTMLDivElement, MealPrintViewProps>(({ meal }, ref) => {
  const { t } = useTranslation();
  const { rates } = useExchangeRates();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const rate = rates['SAR'] || 3.75;
  let eqAmount = 0;
  let eqCurrency = '';
  if (meal.currency === 'SAR') { eqAmount = meal.total_amount / rate; eqCurrency = 'USD'; }
  else if (meal.currency === 'USD') { eqAmount = meal.total_amount * rate; eqCurrency = 'SAR'; }

  return (
    <div ref={ref} className="bg-white text-black p-8" style={{ width: '100%', minHeight: '100vh', direction: 'ltr', color: '#000', backgroundColor: '#fff' }}>
      <div style={{ textAlign: "center", marginBottom: "32px", borderBottom: "2px solid black", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase" }}>{t('meals.printTitle', 'OSMANLI MUTFAĞI UMRE ACENTA GİRİŞ-ÇIKIŞ HESAP TABLOSU')}</h1>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginTop: "8px" }} dir="rtl">المطبخ العثماني 2025 حاسبة الدخول والخروج لوكالة العمرة</h2>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid black", textAlign: "center", fontSize: "14px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.companyName', 'ŞİRKET ADI')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.hotelName', 'OTEL ADI')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.checkInDate', 'GİRİŞ TARİHİ')}</th>
            <th style={{ border: "1px solid black", padding: "8px", color: "#dc2626" }}>{t('meals.morning', 'SABAH')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.evening', 'AKŞAM')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.checkOutDate', 'ÇIKIŞ TARİHİ')}</th>
            <th style={{ border: "1px solid black", padding: "8px", color: "#dc2626" }}>{t('meals.morning', 'SABAH')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.evening', 'AKŞAM')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.paxCount', 'KİŞİ SAYISI')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.dayCount', 'GÜN SAYISI')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.morningPrice', 'SABAH FİYAT')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.eveningPrice', 'AKŞAM FİYAT')}</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>{t('meals.totalAmount', 'TOPLAM TUTAR')}</th>
          </tr>
          <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }} dir="rtl">
            <th style={{ border: "1px solid black", padding: "8px" }}>( اسم الشركة )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( اسم الفندق )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( تاريخ الدخول )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( صباح )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( مساء )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( تاريخ الخروج )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( صباح )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( مساء )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( عدد الأشخاص )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( عدد الأيام )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( سعر الصباح )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( سعر المساء )</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>( المبلغ الإجمالي )</th>
          </tr>
          <tr style={{ backgroundColor: "#f9fafb", fontSize: "20px", fontWeight: "bold" }}>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
            <th style={{ border: "1px solid black", padding: "4px" }}>↓</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid black", padding: "8px", fontWeight: "bold" }}>{meal.company_name}</td>
            <td style={{ border: "1px solid black", padding: "8px" }}>{meal.hotel_name}</td>
            <td style={{ border: "1px solid black", padding: "8px" }}>{formatDate(meal.entry_date)}</td>
            <td style={{ border: "1px solid black", padding: "8px", color: "#dc2626", fontWeight: "bold" }}>{meal.entry_morning > 0 ? '0,5' : '-'}</td>
            <td style={{ border: "1px solid black", padding: "8px", color: "#dc2626", fontWeight: "bold" }}>{meal.entry_evening > 0 ? '0,5' : '-'}</td>
            <td style={{ border: "1px solid black", padding: "8px" }}>{formatDate(meal.exit_date)}</td>
            <td style={{ border: "1px solid black", padding: "8px", color: "#dc2626", fontWeight: "bold" }}>{meal.exit_morning > 0 ? '0,5' : '-'}</td>
            <td style={{ border: "1px solid black", padding: "8px", color: "#dc2626", fontWeight: "bold" }}>{meal.exit_evening > 0 ? '0,5' : '-'}</td>
            <td style={{ border: "1px solid black", padding: "8px", fontWeight: "bold" }}>{meal.pax_count}</td>
            <td style={{ border: "1px solid black", padding: "8px", fontWeight: "bold", backgroundColor: "#fef3c7" }}>{meal.total_days}</td>
            <td style={{ border: "1px solid black", padding: "8px" }}>{meal.morning_price}</td>
            <td style={{ border: "1px solid black", padding: "8px" }}>{meal.evening_price}</td>
            <td style={{ border: "1px solid black", padding: "8px", fontWeight: "bold", fontSize: "18px" }}>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(meal.total_amount)}</td>
          </tr>
          {/* Excursion Deduction Row if applicable */}
          {(meal.excursion_days || 0) > 0 && (
            <tr style={{ backgroundColor: "#fef2f2", color: "#991b1b", fontSize: "13px" }}>
              <td colSpan={9} style={{ border: "1px solid black", padding: "8px", textAlign: "left" }}>
                <strong>{t('meals.excursionDeductionPrint', 'GEZİ DÜŞÜŞÜ / خصم الرحلة')}:</strong> {meal.excursion_note || ''} 
                {meal.excursion_start_date ? ` (${formatDate(meal.excursion_start_date)} - ${formatDate(meal.excursion_end_date || meal.excursion_start_date)})` : ''}
              </td>
              <td style={{ border: "1px solid black", padding: "8px", fontWeight: "bold", backgroundColor: "#fecaca" }}>
                -{meal.excursion_days}
              </td>
              <td colSpan={2} style={{ border: "1px solid black", padding: "8px", textAlign: "right" }}>
                -{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format((meal.excursion_days || 0) * meal.pax_count * (meal.morning_price + meal.evening_price))} {meal.currency}
              </td>
              <td style={{ border: "1px solid black", padding: "8px", fontWeight: "bold", color: "#dc2626" }}>
                -{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format((meal.excursion_days || 0) * meal.pax_count * (meal.morning_price + meal.evening_price))}
              </td>
            </tr>
          )}
          {/* Total Row */}
          <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
            <td colSpan={9} style={{ border: "1px solid black", padding: "8px", textAlign: "right" }} dir="rtl">المجموع الإجمالي</td>
            <td style={{ border: "1px solid black", padding: "8px" }}>{t('meals.grand', 'GENEL')}</td>
            <td colSpan={2} style={{ border: "1px solid black", padding: "8px", textAlign: "right" }}>{t('meals.total', 'TOPLAM')} {meal.currency}</td>
            <td style={{ border: "1px solid black", padding: "8px", fontSize: "18px", color: "#15803d", backgroundColor: "#fde047" }}>
              {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(meal.total_amount)}
              {eqAmount > 0 && (
                <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "4px", fontWeight: "normal" }}>
                  (~ {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(eqAmount)} {eqCurrency})
                </div>
              )}
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

MealPrintView.displayName = 'MealPrintView';
