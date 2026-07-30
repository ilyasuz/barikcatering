import { useState } from 'react';
import { UploadCloud, FileDown, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { CompanyRecord, CompanyType, Region } from '../types';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useTranslation } from 'react-i18next';

interface CompanyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: Partial<CompanyRecord>[]) => void;
}

export function CompanyImportModal({ isOpen, onClose, onImport }: CompanyImportModalProps) {
  const { t } = useTranslation();
  const { region } = useRegion();
  const [targetRegion, setTargetRegion] = useState(region === 'all' ? 'Türkiye' : region);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = [
      {
        [t('companies.companyPersonName', 'Firma / Kişi Adı')]: t('companies.sampleCompany', 'Örnek Firma A.Ş.'),
        [t('companies.companyTypeOptions', 'Cari Tipi (Müşteri/Tedarikçi/Personel)')]: t('companies.customer', 'Müşteri'),
        [t('common.regionOptions', 'Bölge (Türkiye/Arabistan)')]: t('common.turkey', 'Türkiye'),
        [t('companies.authorized', 'Yetkili Kişi')]: t('companies.sampleAuthorized', 'Ahmet Yılmaz'),
        [t('companies.phone', 'Telefon')]: '+90 532 123 45 67',
        [t('companies.email', 'E-posta')]: 'info@ornek.com',
        [t('companies.taxNo', 'Vergi / TC No')]: '1234567890',
        [t('companies.taxOffice', 'Vergi Dairesi')]: t('companies.sampleTaxOffice', 'Kadıköy'),
        [t('common.address', 'Adres')]: t('companies.sampleAddress', 'Örnek Mah. Test Sok. No:1'),
        [t('companies.balance', 'Bakiye')]: 15000,
        [t('common.currencyOptions', 'Para Birimi (TRY/USD/EUR/SAR)')]: 'TRY',
        [t('companies.specialNotes', 'Özel Notlar')]: t('companies.sampleNotes', 'VIP Müşteri')
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('companies.companiesTemplate', "Cariler Şablonu"));
    XLSX.writeFile(wb, "cariler_sablonu.xlsx");
  };

  const parseExcelAndImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const records: Partial<CompanyRecord>[] = json.map((row: any) => ({
        name: row[t('companies.companyPersonName', 'Firma / Kişi Adı')] || t('common.unknown', 'Bilinmiyor'),
        type: (row[t('companies.companyTypeOptions', 'Cari Tipi (Müşteri/Tedarikçi/Personel)')] as CompanyType) || 'Müşteri',
        region: (row[t('common.regionOptions', 'Bölge (Türkiye/Arabistan)')] as Region) || targetRegion,
        contactPerson: row[t('companies.authorized', 'Yetkili Kişi')] || '',
        phone: row[t('companies.phone', 'Telefon')] || '',
        email: row[t('companies.email', 'E-posta')] || '',
        taxNumber: row[t('companies.taxNo', 'Vergi / TC No')]?.toString() || '',
        taxOffice: row[t('companies.taxOffice', 'Vergi Dairesi')] || '',
        address: row[t('common.address', 'Adres')] || '',
        balance: Number(row[t('companies.balance', 'Bakiye')]) || 0,
        currency: (row[t('common.currencyOptions', 'Para Birimi (TRY/USD/EUR/SAR)')] as any) || 'TRY',
        notes: row[t('companies.specialNotes', 'Özel Notlar')] || '',
        status: 'active'
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
          <h2 style={{ margin: 0, fontSize: '18px' }}>{t('companies.importFromExcel', 'Excel\'den Cari Aktar')}</h2>
          <button onClick={onClose} className="icon-button" style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileDown size={16} color="var(--accent)" />
              {t('companies.downloadTemplateTitle', '1. Şablonu İndir')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('companies.downloadTemplateDesc', 'Örnek Excel şablonunu indirin ve müşterilerinizi/tedarikçilerinizi bu formata uygun şekilde doldurun.')}
            </p>
            <button className="btn-secondary" onClick={handleDownloadTemplate} style={{ width: '100%' }}>
              <FileDown size={16} /> {t('companies.downloadSampleTemplateBtn', 'Örnek Şablonu İndir')}
            </button>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <UploadCloud size={16} color="var(--accent)" />
              {t('companies.uploadFileTitle', '2. Dosyayı Yükle')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t('companies.uploadFileDesc', 'Doldurduğunuz Excel dosyasını seçerek sisteme aktarabilirsiniz.')}
            </p>

            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', maxWidth: '200px', margin: '0 auto 16px auto' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>{t('common.defaultRegion', 'Varsayılan Bölge')}</label>
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
