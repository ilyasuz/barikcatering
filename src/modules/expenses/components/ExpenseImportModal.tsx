import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, FileDown, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ExpenseRecord } from '../types';
import { useRegion } from '../../../core/contexts/RegionContext';

interface ExpenseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: Partial<ExpenseRecord>[]) => void;
}

export function ExpenseImportModal({ isOpen, onClose, onImport }: ExpenseImportModalProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const [dragActive, setDragActive] = useState(false);
  const [targetRegion, setTargetRegion] = useState(region === 'all' ? 'Türkiye' : region);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = [
      {
        'Belge No': 'GDR-2026-001',
        'İşlem Tarihi (YYYY-AA-GG)': '2026-05-15',
        'Tedarikçi / Kurum / Personel': 'BEDAŞ',
        'Açıklama': 'Mayıs Ayı Elektrik Faturası',
        'Kategori': 'Diğer',
        'Tutar': 1250.00,
        'Ödenen Tutar': 1250.00,
        'Para Birimi (TRY/USD/EUR/SAR)': 'TRY',
        'Durum (completed/pending/overdue)': 'completed'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('expenses.import.templateSheetName', 'Giderler Şablonu'));
    XLSX.writeFile(wb, t('expenses.import.templateFileName', 'giderler_sablonu.xlsx'));
  };

  const parseExcelAndImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const records: Partial<ExpenseRecord>[] = json.map((row: any) => ({
        invoiceNo: row['Belge No'] || '',
        date: row['İşlem Tarihi (YYYY-AA-GG)'] || new Date().toISOString().split('T')[0],
        supplierName: row['Tedarikçi / Kurum / Personel'] || t('common.unknown', 'Bilinmiyor'),
        description: row['Açıklama'] || '',
        category: row['Kategori'],
        amount: Number(row['Tutar']) || 0,
        paidAmount: Number(row['Ödenen Tutar']) || 0,
        currency: (row['Para Birimi (TRY/USD/EUR/SAR)'] as any) || 'TRY',
        status: (row['Durum (completed/pending/overdue)'] as any) || 'pending',
        region: targetRegion as any
      }));

      onImport(records);
      onClose();
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseExcelAndImport(e.target.files[0]);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div className={`modal-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-primary)',
        width: '500px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{t('expenses.import.title', "Excel'den Gider Aktar")}</h2>
          <button onClick={onClose} className="icon-button" style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileDown size={16} color="var(--accent)" />
              {t('expenses.import.step1Title', '1. Şablonu İndir')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('expenses.import.step1Desc', 'Önce örnek Excel şablonunu indirin ve gider verilerinizi bu şablondaki formata uygun şekilde doldurun.')}
            </p>
            <button className="btn-secondary" onClick={handleDownloadTemplate} style={{ width: '100%' }}>
              <FileDown size={16} /> {t('expenses.import.downloadTemplateBtn', 'Örnek Şablonu İndir')}
            </button>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <UploadCloud size={16} color="var(--accent)" />
              {t('expenses.import.step2Title', '2. Dosyayı Yükle')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t('expenses.import.step2Desc', 'Doldurduğunuz Excel dosyasını seçerek sisteme aktarabilirsiniz.')}
            </p>

            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', maxWidth: '200px', margin: '0 auto 16px auto' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>{t('expenses.import.targetRegionLabel', 'Hangi Bölgeye Aktarılacak?')}</label>
              <select 
                className="form-control" 
                value={targetRegion} 
                onChange={(e) => setTargetRegion(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="Türkiye">Türkiye 🇹🇷</option>
                <option value="Arabistan">Arabistan 🇸🇦</option>
              </select>
            </div>

            <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {t('common.selectFile', 'Dosya Seç')}
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
