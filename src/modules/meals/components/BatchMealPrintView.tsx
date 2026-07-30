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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const rate = rates['SAR'] || 3.75;

  // Calculate totals
  const totalDays = meals.reduce((sum, m) => sum + m.total_days, 0);
  
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
            <th className="border border-black p-1 text-xs">( اسم الشركة )</th>
            <th className="border border-black p-1 text-xs">( اسم الفندق )</th>
            <th className="border border-black p-1 text-xs">( تاريخ الدخول )</th>
            <th className="border border-black p-1 text-xs">( صباح )</th>
            <th className="border border-black p-1 text-xs">( مساء )</th>
            <th className="border border-black p-1 text-xs">( تاريخ الخروج )</th>
            <th className="border border-black p-1 text-xs">( صباح )</th>
            <th className="border border-black p-1 text-xs">( مساء )</th>
            <th className="border border-black p-1 text-xs">( عدد الأشخاص )</th>
            <th className="border border-black p-1 text-xs">( عدد الأيام )</th>
            <th className="border border-black p-1 text-xs">( سعر الصباح )</th>
            <th className="border border-black p-1 text-xs">( سعر المساء )</th>
            <th className="border border-black p-1 text-xs">( المبلغ الإجمالي )</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal, index) => (
            <tr key={meal.id || index}>
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
              <td className="border border-black p-2 font-bold text-md">
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(meal.total_amount)} {meal.currency}
              </td>
            </tr>
          ))}

          {/* Empty Rows for Spacing if few meals */}
          {meals.length < 3 && Array.from({ length: 3 - meals.length }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black p-2 h-8"></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
              <td style={{ border: "1px solid black", padding: "8px" }}></td>
            </tr>
          ))}

          {/* Total Row */}
          <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
            <td colSpan={9} style={{ border: "1px solid black", padding: "8px", textAlign: "right" }} dir="rtl">المجموع الإجمالي</td>
            <td className="border border-black p-2 bg-yellow-200 text-lg">{totalDays}</td>
            <td colSpan={2} style={{ border: "1px solid black", padding: "8px", textAlign: "right" }}>{t('meals.grandTotal', 'GENEL TOPLAM')}</td>
            <td className="border border-black p-2 text-lg text-green-700 bg-yellow-200 flex flex-col items-center">
              {Object.entries(totalsByCurrency).map(([currency, amount]) => {
                let eqAmount = 0;
                let eqCurrency = '';
                if (currency === 'SAR') { eqAmount = amount / rate; eqCurrency = 'USD'; }
                else if (currency === 'USD') { eqAmount = amount * rate; eqCurrency = 'SAR'; }
                
                return (
                  <div key={currency} className="mb-2 last:mb-0">
                    <div>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(amount)} {currency}</div>
                    {eqAmount > 0 && (
                      <div className="text-xs text-gray-600 font-normal">
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
