import React from 'react';
import { useTranslation } from 'react-i18next';

export interface PrintColumn<T> {
  key: string;
  headerTR: string;
  headerAR: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
}

export interface OfficialPrintDocumentProps<T> {
  titleTR: string;
  titleAR: string;
  columns: PrintColumn<T>[];
  data: T[];
  totalAmount?: number;
  totalCurrency?: string;
  totalsLabelTR?: string;
  totalsLabelAR?: string;
  totals?: { currency: string, amount: number }[];
  extraTotals?: {
    labelTR: string;
    labelAR: string;
    amounts: { currency: string, amount: number }[];
  }[];
  headerNode?: React.ReactNode;
  previewMode?: boolean;
}

export function OfficialPrintDocument<T extends { id?: string | number }>({
  titleTR,
  titleAR,
  columns,
  data,
  totalAmount,
  totalCurrency,
  totalsLabelTR = 'GENEL TOPLAM',
  totalsLabelAR = 'المجموع الإجمالي',
  totals,
  extraTotals,
  headerNode,
  previewMode = false,
}: OfficialPrintDocumentProps<T>) {
  const { t } = useTranslation();

  // If defaults were provided, we can override them with translations if they match the hardcoded strings
  const finalTotalsLabelTR = totalsLabelTR === 'GENEL TOPLAM' ? t('print.grandTotal', 'GENEL TOPLAM') : totalsLabelTR;
  const finalTotalsLabelAR = totalsLabelAR === 'المجموع الإجمالي' ? t('print.grandTotalAR', 'المجموع الإجمالي') : totalsLabelAR;

  return (
    <div className={previewMode ? "bg-white text-black" : "print-only bg-white text-black p-8"} style={{ width: '100%', minHeight: previewMode ? 'auto' : '100vh', direction: 'ltr', display: previewMode ? 'block' : 'none', color: '#000', backgroundColor: '#fff', padding: previewMode ? '16px' : '32px' }}>
      <div className="text-center mb-8 border-b-2 border-black pb-4" style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid black', paddingBottom: '16px' }}>
        <h1 className="text-2xl font-bold uppercase" style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>{titleTR}</h1>
        <h2 className="text-xl font-bold mt-2" dir="rtl" style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>{titleAR}</h2>
      </div>
      
      {headerNode && (
        <div style={{ marginBottom: '24px' }}>
          {headerNode}
        </div>
      )}

      <table className="w-full border-collapse border border-black text-center text-sm" style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center' }}>
        <thead>
          <tr className="bg-gray-100 font-bold" style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
            {columns.map((col, idx) => (
              <th key={`tr-${col.key}-${idx}`} className="border border-black p-2" style={{ border: '1px solid black', padding: '8px', width: col.width, color: 'black' }}>
                {col.headerTR}
              </th>
            ))}
          </tr>
          <tr className="bg-gray-50 font-bold" style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
            {columns.map((col, idx) => (
              <th key={`ar-${col.key}-${idx}`} className="border border-black p-2" style={{ border: '1px solid black', padding: '8px', width: col.width, color: 'black' }}>
                <div dir="rtl">( {col.headerAR} )</div>
              </th>
            ))}
          </tr>
          <tr className="bg-gray-50 text-xl font-bold" style={{ backgroundColor: '#f9fafb', fontWeight: 'bold', fontSize: '20px' }}>
            {columns.map((col, idx) => (
              <th key={`arrow-${col.key}-${idx}`} className="border border-black p-1" style={{ border: '1px solid black', padding: '4px' }}>
                ↓
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((col, idx) => (
                <td key={`cell-${item.id || index}-${col.key}-${idx}`} className="border border-black p-2" style={{ border: '1px solid black', padding: '8px' }}>
                  {col.render ? col.render(item, index) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="border border-black p-4 text-center" style={{ border: '1px solid black', padding: '16px', textAlign: 'center' }}>
                {t('print.noTransaction', 'İşlem bulunamadı / لا توجد معاملات')}
              </td>
            </tr>
          )}
          
          {totals && totals.length > 0 ? (
            <tr className="bg-gray-100 font-bold" style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
              <td colSpan={columns.length - 1} className="border border-black p-2 text-right" style={{ border: '1px solid black', padding: '8px', textAlign: 'right', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center', height: '100%' }}>
                  <span dir="rtl">{finalTotalsLabelAR}</span>
                  <span>{finalTotalsLabelTR}</span>
                </div>
              </td>
              <td className="border border-black p-2 text-lg" style={{ border: '1px solid black', padding: '8px', backgroundColor: '#fef08a', fontSize: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {totals.map((t, idx) => (
                    <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                      {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(t.amount)} {t.currency}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ) : totalAmount !== undefined && (
            <tr className="bg-gray-100 font-bold" style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
              <td colSpan={columns.length - 1} className="border border-black p-2 text-right" style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
                  <span dir="rtl">{finalTotalsLabelAR}</span>
                  <span>{finalTotalsLabelTR}</span>
                </div>
              </td>
              <td className="border border-black p-2 text-lg" style={{ border: '1px solid black', padding: '8px', backgroundColor: '#fef08a', fontSize: '18px' }}>
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalAmount)} {totalCurrency}
              </td>
            </tr>
          )}

          {extraTotals && extraTotals.map((extraRow, idx) => (
            <tr key={`extra-${idx}`} className="bg-gray-100 font-bold" style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
              <td colSpan={columns.length - 1} className="border border-black p-2 text-right" style={{ border: '1px solid black', padding: '8px', textAlign: 'right', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center', height: '100%' }}>
                  <span dir="rtl">{extraRow.labelAR}</span>
                  <span>{extraRow.labelTR}</span>
                </div>
              </td>
              <td className="border border-black p-2 text-lg" style={{ border: '1px solid black', padding: '8px', backgroundColor: '#fef08a', fontSize: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {extraRow.amounts.map((t, idx2) => (
                    <div key={idx2} style={{ whiteSpace: 'nowrap' }}>
                      {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(t.amount)} {t.currency}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '64px', padding: '0 32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>{t('print.customerApproval', 'MÜŞTERİ ONAYI')}</div>
          <div style={{ fontWeight: 'bold' }} dir="rtl">{t('print.customerApprovalAR', 'موافقة العميل')}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>{t('print.deliveredBy', 'TESLİM EDEN')}</div>
          <div style={{ fontWeight: 'bold' }} dir="rtl">{t('print.deliveredByAR', 'المُسْتَلِم')}</div>
        </div>
      </div>
    </div>
  );
}
