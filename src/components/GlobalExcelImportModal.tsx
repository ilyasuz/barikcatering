import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../core/components/Modal/Modal';
import { FileUpload } from '../core/components/FileUpload/FileUpload';
import { Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim();
  str = str.replace(/[^\d.,-]/g, '');
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }
  return Number(str) || 0;
};

const parseExcelDate = (excelDate: any) => {
  if (!excelDate) return null;
  
  try {
    if (typeof excelDate === 'number') {
      const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    
    if (typeof excelDate === 'string') {
      const parts = excelDate.trim().split(/[./-]/);
      if (parts.length === 3) {
        let year = parseInt(parts[2], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[0], 10);
        
        if (year < 100) year += 2000; // handle YY
        
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
    }
    
    const d = new Date(excelDate);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    
    return null; // Could not parse
  } catch (e) {
    return null;
  }
};

export function GlobalExcelImportModal({ isOpen, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    incomes: any[],
    expenses: any[],
    skipped: any[],
    headerRow?: any[]
  } | null>(null);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['TARIH', 'GELIR GIDER', 'ODEYEN', 'ODENEN', 'DEPARTMAN', 'ACIKLAMA', 'SAR IN', 'SAR OUT', 'USD IN', 'USD OUT', 'KASA']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kasa_Defteri");
    XLSX.writeFile(wb, "Sistem_Sablon_Kasa.xlsx");
  };

  const downloadSkipped = () => {
    if (!previewData || previewData.skipped.length === 0) return;
    
    const maxCols = previewData.headerRow ? previewData.headerRow.length : 11;

    const wsData = [
      [...(previewData.headerRow || []), 'HATA NEDENİ'],
      ...previewData.skipped.map(skp => {
        const rowData = [...(skp.originalRow || [])];
        while (rowData.length < maxCols) {
          rowData.push(''); // Pad empty cells to align properly
        }
        rowData.push(t(skp.reasonKey, skp.reason, skp.reasonParams));
        return rowData;
      })
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atlanan_Kayitlar");
    XLSX.writeFile(wb, "Atlanan_Kayitlar_Raporu.xlsx");
  };

  const handleProcess = async () => {
    if (!previewData) return;
    setIsProcessing(true);
    
    try {
      if (previewData.incomes.length > 0) {
        const { error: incError } = await supabase.from('income').insert(previewData.incomes);
        if (incError) throw incError;
      }
      
      if (previewData.expenses.length > 0) {
        const { error: expError } = await supabase.from('expenses').insert(previewData.expenses);
        if (expError) throw expError;
      }
      
      onSuccess();
    } catch (err: any) {
      console.error("Import error:", err);
      alert(t('import.saveError', 'Kaydedilirken bir hata oluştu: ') + (err.message || JSON.stringify(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const processExcelFile = async (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const parsedIncomes: any[] = [];
        const parsedExpenses: any[] = [];
        const skippedRows: any[] = [];
        const headerRow = rows[0] || [];
        
        const currentUser = localStorage.getItem('currentUser') || 'Sistem';

        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const dateRaw = row[0];
          const typeStr = (row[1] || '').toString().toUpperCase();
          const payer = (row[2] || '').toString().trim();
          const payee = (row[3] || '').toString().trim();
          const department = (row[4] || '').toString().toUpperCase();
          const descriptionStr = (row[5] || '').toString().trim();
          const sarIn = parseNumber(row[6]);
          const sarOut = parseNumber(row[7]);
          const usdIn = parseNumber(row[8]);
          const usdOut = parseNumber(row[9]);
          
          if (!dateRaw && !payer && !payee && !department && sarIn === 0 && sarOut === 0 && usdIn === 0 && usdOut === 0) continue;
          
          const isTransfer = [department, descriptionStr].some(val => {
            const v = val.toUpperCase();
            return v.includes('KASA TESLİM') || 
                   v.includes('TÜRKİYEDEN KASAYA') || 
                   v.includes('TÜRKİYEDEN GELEN') || 
                   v.includes('ÜSTÜNDE OLAN PARA') ||
                   v.includes('TRANSFER');
          });

          const rowDesc = `${department} - ${descriptionStr}`.replace(/^- | -$/g, '').trim();

          let date = parseExcelDate(dateRaw);
          if (!date) {
            skippedRows.push({ rowNumber: i + 1, reasonKey: 'import.invalidDate', reason: 'Geçersiz Tarih: ' + dateRaw, reasonParams: { date: dateRaw }, desc: rowDesc, originalRow: row });
            continue;
          }
          
          // Category determination
          let category = 'Diğer';
          if (isTransfer) category = 'Kasa Transferi / Devir';
          else if (department.includes('AVANS') || department.includes('AVAS') || department.includes('HARÇLIK')) category = 'Personel Ödemesi / Avans';
          else if (department.includes('MAAŞ')) category = 'Maaş Tahakkuku (Hak Ediş)';
          else if (department.includes('BENZİN')) category = 'Araç/Yakıt';
          else if (department.includes('MASRAF') || department.includes('FATURA') || department.includes('GAZ') || department.includes('KONTÖR')) category = 'Genel Gider / Fatura';
          else if (department.includes('TOPTANCI') || department.includes('HALEGA') || department.includes('SEBZE')) category = 'Toptancı / Hal';
          else if (department.includes('MUTFAK') || department.includes('SU')) category = 'Mutfak/Erzak';
          else if (department.includes('TESRİH')) category = 'Resmi İşlem / Harç';

          let amount = 0;
          let currency = 'TRY';
          
          const isIncomeType = typeStr.includes('GELIR') || typeStr.includes('GELİR');
          const isExpenseType = typeStr.includes('GIDER') || typeStr.includes('GİDER');
          
          const addIncomeRecord = (amt: number, curr: string) => {
            parsedIncomes.push({
              date,
              due_date: date,
              title: payer || payee || 'Excel İçe Aktarım',
              payer,
              payee,
              description: rowDesc,
              category: category === 'Diğer' ? 'Diğer' : 'Diğer',
              amount: amt,
              paid_amount: amt,
              currency: curr,
              status: 'completed',
              payment_method: 'cash',
              created_by: currentUser,
              region: 'Arabistan'
            });
          };

          const addExpenseRecord = (amt: number, curr: string) => {
            parsedExpenses.push({
              date,
              due_date: date,
              title: payee || payer || 'Excel İçe Aktarım',
              payer,
              payee,
              description: rowDesc,
              category,
              amount: amt,
              paid_amount: amt,
              currency: curr,
              status: 'completed',
              payment_method: 'cash',
              created_by: currentUser,
              region: 'Arabistan'
            });
          };

          let hasIncome = false;
          let hasExpense = false;

          if (sarIn > 0) { addIncomeRecord(sarIn, 'SAR'); hasIncome = true; }
          if (usdIn > 0) { addIncomeRecord(usdIn, 'USD'); hasIncome = true; }
          
          if (sarOut > 0) { addExpenseRecord(sarOut, 'SAR'); hasExpense = true; }
          if (usdOut > 0) { addExpenseRecord(usdOut, 'USD'); hasExpense = true; }

          // Fallback for 0 amount rows that have an explicit type
          if (!hasIncome && !hasExpense) {
            if (isIncomeType) {
              addIncomeRecord(0, 'SAR');
            } else {
              addExpenseRecord(0, 'SAR');
            }
          }
        }
        
        setPreviewData({ incomes: parsedIncomes, expenses: parsedExpenses, skipped: skippedRows, headerRow });
      } catch (err: any) {
        console.error(err);
        setErrorMsg(t('import.readError', 'Excel okunamadı: ') + (err.message || t('import.unknownError', 'Bilinmeyen hata')));
      }
    };
    reader.onerror = () => {
      setErrorMsg(t('import.fileReadError', 'Dosya okuma hatası'));
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('import.globalTitle', "Toplu Kasa Excel'i Yükle")} width="700px">
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t('import.globalDesc', 'Kasa defterinizi Excel formatında yükleyin. Sistem gelirleri ve giderleri otomatik olarak ayıracaktır.')}</p>
          <button type="button" className="btn-secondary" onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} />
            {t('import.downloadTemplate', 'Örnek Şablon İndir')}
          </button>
        </div>
        
        {!previewData && (
          <>
            <FileUpload 
              onFileSelect={(file) => {
                if (file) processExcelFile(file);
              }}
              accept=".xlsx,.xls"
            />
            {errorMsg && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}
          </>
        )}

        {previewData && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ color: '#065f46', fontSize: '14px', fontWeight: 600 }}>{t('import.incomeToAdd', 'Eklenecek Gelir')}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#047857' }}>{previewData.incomes.length} {t('import.record', 'Kayıt')}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ color: '#991b1b', fontSize: '14px', fontWeight: 600 }}>{t('import.expenseToAdd', 'Eklenecek Gider')}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c' }}>{previewData.expenses.length} {t('import.record', 'Kayıt')}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#4b5563', fontSize: '14px', fontWeight: 600 }}>{t('import.skippedTransfer', 'Atlanan Kayıt (Transfer)')}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>{previewData.skipped.length} {t('import.record', 'Kayıt')}</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {previewData.skipped.length > 0 && (
                  <>
                    <button type="button" className="btn-secondary" onClick={() => setShowSkippedDetails(!showSkippedDetails)}>
                      {showSkippedDetails ? t('import.hideSkipped', 'Atlananları Gizle') : t('import.showSkipped', 'Atlananları Gör ({{count}})', { count: previewData.skipped.length })}
                    </button>
                    <button type="button" className="btn-secondary" onClick={downloadSkipped} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                      <Download size={14} />
                      {t('import.downloadExcel', 'Excel Olarak İndir')}
                    </button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setPreviewData(null)}>{t('common.back', 'Geri Dön')}</button>
                <button type="button" className="btn-primary" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? t('common.saving', 'Kaydediliyor...') : t('import.confirmAndSave', 'Onayla ve Kaydet')}
                </button>
              </div>
            </div>

            {showSkippedDetails && previewData.skipped.length > 0 && (
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-secondary, #f9fafb)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--text-color, #374151)', fontSize: '15px' }}>{t('import.skippedDetails', 'Atlanan Kayıtlar Detayı')}</h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color, #d1d5db)', borderRadius: '6px' }}>
                  <table className="data-table" style={{ fontSize: '13px', margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-primary, #f3f4f6)' }}>
                      <tr>
                        <th>{t('import.excelRow', 'Excel Satır')}</th>
                        <th>{t('import.skipReason', 'Atlanma Nedeni')}</th>
                        <th>{t('common.description', 'Açıklama')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.skipped.map((skp, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--text-color)' }}>{skp.rowNumber}</td>
                          <td style={{ color: 'var(--danger)' }}>{t(skp.reasonKey, skp.reason, skp.reasonParams)}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{skp.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('common.date', 'Tarih')}</th>
                    <th>{t('common.type', 'Tür')}</th>
                    <th>{t('common.description', 'Açıklama')}</th>
                    <th>{t('common.amount', 'Tutar')}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.incomes.slice(0, 50).map((inc, idx) => (
                    <tr key={`inc-${idx}`}>
                      <td>{inc.date}</td>
                      <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{t('common.income', 'Gelir')}</span></td>
                      <td>{inc.description}</td>
                      <td style={{ color: 'var(--success)' }}>{inc.amount} {inc.currency}</td>
                    </tr>
                  ))}
                  {previewData.expenses.slice(0, 50).map((exp, idx) => (
                    <tr key={`exp-${idx}`}>
                      <td>{exp.date}</td>
                      <td><span style={{ color: 'var(--danger)', fontWeight: 600 }}>{t('common.expense', 'Gider')}</span></td>
                      <td>{exp.description}</td>
                      <td style={{ color: 'var(--danger)' }}>{exp.amount} {exp.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                {t('import.previewNote', '* Önizleme amaçlı ilk 50 kayıt gösterilmektedir.')}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
