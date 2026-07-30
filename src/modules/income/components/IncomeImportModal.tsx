import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, UploadCloud, FileDown, AlertCircle, CheckCircle, File as FileIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Modal } from '../../../core/components/Modal/Modal';
import { DataTable } from '../../../core/components/DataTable/DataTable';
import type { Column } from '../../../core/components/DataTable/DataTable';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import type { IncomeRecord } from '../types';
import './IncomeImportModal.css';

interface IncomeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: Partial<IncomeRecord>[]) => void;
}

// validation removed to allow dynamic values

interface ParsedRow {
  id: string;
  index: number;
  date: string;
  companyName: string;
  description: string;
  category: string;
  amount: number | string;
  paidAmount: number | string;
  currency: string;
  account: string;
  errors: string[];
}

import { useRegion } from '../../../core/contexts/RegionContext';

export function IncomeImportModal({ isOpen, onClose, onImport }: IncomeImportModalProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'success'>('idle');
  const [targetRegion, setTargetRegion] = useState(region === 'all' ? 'Türkiye' : region);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [t('common.date', 'Tarih'), t('income.customerCompany', 'Firma/Müşteri'), t('income.form.description', 'Açıklama'), t('common.category', 'Kategori'), t('income.form.amount', 'Tutar'), t('income.form.downPayment', 'Peşinat'), t('common.currency', 'Para Birimi'), t('common.account', 'Hesap')],
      ['01.08.2026', 'Acme Corp', 'Düğün Organizasyonu', 'Organizasyon', 45000, 20000, 'SAR', 'Ziraat Bankası'],
      ['02.08.2026', 'Wayne Ent.', 'Catering Hizmeti', 'Catering', 18000, 18000, 'TRY', 'Nakit'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Barik_Income_Template.xlsx');
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Skip header row
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const rows = json.slice(1).filter(r => r.length > 0);
        
        const parsedRows: ParsedRow[] = rows.map((row, i) => {
          const [date, companyName, description, category, amount, paidAmount, currency, account] = row;
          const errors: string[] = [];
          
          let parsedAmount = Number(amount);
          if (isNaN(parsedAmount) || amount === undefined) {
            errors.push(t('common.invalidAmount', 'Geçersiz Tutar'));
            parsedAmount = 0;
          }
          
          let parsedPaidAmount = Number(paidAmount) || 0;
          if (isNaN(parsedPaidAmount)) {
             parsedPaidAmount = 0;
          }
          
          if (!date) errors.push(t('common.missingDate', 'Tarih eksik'));
          
          const curr = currency ? String(currency).toUpperCase() : '';

          return {
            id: String(i),
            index: i + 1,
            date: date, // Keep original for reference
            companyName: companyName || t('common.unknown', 'Bilinmiyor'),
            description: description || '',
            category: category || t('common.other', 'Diğer'),
            amount: parsedAmount,
            paidAmount: parsedPaidAmount,
            currency: curr,
            account: account || '',
            errors
          };
        });

        setParsedData(parsedRows);
        setImportStatus('preview');
      } catch (err) {
        console.error('Error parsing excel:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    const validRows = parsedData.filter(r => r.errors.length === 0);
    if (validRows.length > 0) {
      const newRecords: Partial<IncomeRecord>[] = validRows.map(r => {
        let isoDate = new Date().toISOString().split('T')[0];
        try {
          if (typeof r.date === 'string' && r.date.includes('.')) {
            const [d, m, y] = r.date.split('.');
            isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else if (typeof r.date === 'number') {
             // Convert Excel serial date
             const excelDate = Number(r.date);
             const dateObj = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
             isoDate = dateObj.toISOString().split('T')[0];
          }
        } catch {
          // fallback
        }

        return {
          invoiceNo: `EXC-${Math.floor(Math.random()*10000)}`,
          companyName: r.companyName, 
          description: r.description,
          category: r.category as any,
          amount: Number(r.amount),
          paidAmount: Number(r.paidAmount || 0),
          currency: (r.currency as "TRY" | "USD" | "EUR" | "SAR" | undefined) || 'TRY',
          date: isoDate,
          dueDate: isoDate,
          status: Number(r.paidAmount) >= Number(r.amount) ? 'completed' : 'pending',
          account: r.account,
          region: targetRegion as any,
        };
      });

      onImport(newRecords);
      setImportStatus('success');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData([]);
    setImportStatus('idle');
  };

  const columns: Column<ParsedRow>[] = [
    { key: 'index', header: '#', width: '50px' },
    { 
      key: 'date', 
      header: t('common.date', 'Tarih'), 
      width: '100px',
      render: (item) => {
        if (typeof item.date === 'number') {
          const dateObj = new Date(Math.round((item.date - 25569) * 86400 * 1000));
          return dateObj.toLocaleDateString('tr-TR');
        }
        return String(item.date);
      }
    },
    { key: 'companyName', header: t('income.customerCompany', 'Firma/Müşteri') },
    { key: 'category', header: t('common.category', 'Kategori') },
    { key: 'description', header: t('income.form.description', 'Açıklama') },
    { 
      key: 'amount', 
      header: t('income.form.amount', 'Tutar'),
      align: 'right',
      render: (item) => <CurrencyDisplay amount={Number(item.amount)} currency={item.currency as any} />
    },
    { 
      key: 'paidAmount', 
      header: t('income.form.downPayment', 'Peşinat'),
      align: 'right',
      render: (item) => <CurrencyDisplay amount={Number(item.paidAmount)} currency={item.currency as any} />
    },
    { key: 'account', header: t('common.account', 'Hesap') },
    {
      key: 'errors',
      header: t('common.status', 'Durum'),
      render: (item) => (
        item.errors.length > 0 ? (
          <div className="error-badge" title={item.errors.join(', ')}>
            <AlertCircle size={14} />
            <span>{t('common.invalid', 'Hatalı')} ({item.errors.length})</span>
          </div>
        ) : (
          <div className="success-badge">
            <CheckCircle size={14} />
            <span>{t('common.valid', 'Geçerli')}</span>
          </div>
        )
      )
    }
  ];

  const hasErrors = parsedData.some(r => r.errors.length > 0);
  const validCount = parsedData.filter(r => r.errors.length === 0).length;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        handleReset();
        onClose();
      }} 
      title={t('income.import.title', 'Excel\'den İçe Aktar')}
      width="800px"
    >
      <div className="import-modal-content">
        {importStatus === 'idle' && (
          <div className="upload-section">
            <div className="template-download">
              <p>{t('income.import.useTemplate', 'Toplu gelir eklemek için Excel şablonumuzu kullanın.')}</p>
              <button className="btn-secondary" onClick={downloadTemplate}>
                <FileDown size={18} />
                <span>{t('common.downloadTemplate', 'Örnek Şablonu İndir')}</span>
              </button>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>{t('common.targetRegion', 'Hangi Bölgeye Aktarılacak?')}</label>
              <select 
                className="form-control" 
                value={targetRegion} 
                onChange={(e) => setTargetRegion(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="Türkiye">{t('common.turkey', 'Türkiye')} 🇹🇷</option>
                <option value="Arabistan">{t('common.saudiArabia', 'Arabistan')} 🇸🇦</option>
              </select>
            </div>

            <div 
              className={`drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud size={40} className="upload-icon" />
              <h3>{t('common.dragDropExcel', 'Excel Dosyasını Sürükleyin veya Seçin')}</h3>
              <p className="upload-hint mb-4">{t('common.supportedFormats', 'Sadece .xlsx ve .xls formatları desteklenir.')}</p>
              
              <button 
                className="btn-primary mt-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                {t('common.selectFromComputer', 'Bilgisayardan Seç')}
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx,.xls"
                style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
              />
            </div>
          </div>
        )}

        {importStatus === 'preview' && (
          <div className="preview-section">
            <div className="preview-header">
              <div className="file-info">
                <FileIcon size={20} className="text-primary" />
                <span>{selectedFile?.name}</span>
                <button className="btn-text" onClick={handleReset}>{t('common.change', 'Değiştir')}</button>
              </div>
              <div className="stats">
                <span className="stat valid">{validCount} {t('common.valid', 'Geçerli')}</span>
                {hasErrors && <span className="stat error">{parsedData.length - validCount} {t('common.invalid', 'Hatalı')}</span>}
              </div>
            </div>

            <div className="preview-table-container">
              <DataTable data={parsedData} columns={columns} />
            </div>

            {hasErrors && (
              <div className="error-alert">
                <AlertCircle size={18} />
                <p>{t('income.import.errorsFound', 'Bazı satırlarda eşleşmeyen hesaplar veya geçersiz veriler var. Lütfen hataları giderip dosyayı tekrar yükleyin.')}</p>
              </div>
            )}

            <div className="preview-actions">
              <button className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
              <button 
                className="btn-primary" 
                onClick={handleImport}
                disabled={validCount === 0 || hasErrors}
              >
                {t('income.import.importCount', '{{count}} Kaydı İçe Aktar', { count: validCount })}
              </button>
            </div>
          </div>
        )}

        {importStatus === 'success' && (
          <div className="success-section">
            <CheckCircle size={60} className="success-icon-large" />
            <h3>{t('income.import.successTitle', 'Aktarım Başarılı!')}</h3>
            <p>{t('income.import.successDesc', '{{count}} adet gelir kaydı sisteme başarıyla eklendi.', { count: validCount })}</p>
            <button className="btn-primary mt-4" onClick={() => {
              handleReset();
              onClose();
            }}>
              {t('common.close', 'Kapat')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
