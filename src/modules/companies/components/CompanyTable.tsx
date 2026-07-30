import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileDown, UploadCloud, Eye, MapPin, Edit2, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataTable } from '../../../core/components/DataTable/DataTable';
import type { Column } from '../../../core/components/DataTable/DataTable';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { FilterBar } from '../../../core/components/FilterBar/FilterBar';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { normalizeTurkishText } from '../../../core/utils/pdfHelper';
import type { CompanyRecord } from '../types';

interface CompanyTableProps {
  data: CompanyRecord[];
  onAddNew: () => void;
  onImportClick: () => void;
  onRowClick?: (item: CompanyRecord) => void;
  onEditClick?: (item: CompanyRecord) => void;
  onDeleteClick?: (item: CompanyRecord) => void;
  onDeleteMultiple?: (ids: string[]) => void;
}

export function CompanyTable({ data, onAddNew, onImportClick, onRowClick, onEditClick, onDeleteClick, onDeleteMultiple }: CompanyTableProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const columns: Column<CompanyRecord>[] = [
    { 
      key: 'name', 
      header: t('companies.companyPersonName', 'Firma / Kişi Adı'),
      width: '200px',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.contactPerson || '-'}</div>
        </div>
      )
    },
    { 
      key: 'region', 
      header: t('common.region', 'Bölge'), 
      width: '120px',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {item.region === 'Türkiye' ? '🇹🇷' : '🇸🇦'}
          <span style={{ fontSize: '13px' }}>{item.region}</span>
        </div>
      )
    },
    { 
      key: 'type', 
      header: t('companies.companyType', 'Cari Tipi'),
      width: '130px',
      render: (item) => {
        let bgColor = 'var(--bg-tertiary)';
        let textColor = 'var(--text-secondary)';
        
        if (item.type === 'Müşteri') {
          bgColor = 'rgba(16, 185, 129, 0.1)';
          textColor = '#10B981';
        } else if (item.type === 'Tedarikçi') {
          bgColor = 'rgba(239, 68, 68, 0.1)';
          textColor = '#EF4444';
        } else if (item.type === 'Personel') {
          bgColor = 'rgba(59, 130, 246, 0.1)';
          textColor = '#3B82F6';
        }

        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            backgroundColor: bgColor,
            color: textColor,
            border: `1px solid ${bgColor.replace('0.1', '0.2')}`
          }}>
            {t(`companies.${item.type === 'Müşteri' ? 'customer' : item.type === 'Tedarikçi' ? 'supplier' : 'personnel'}`, item.type)}
          </span>
        );
      }
    },
    { 
      key: 'contact', 
      header: t('companies.contact', 'İletişim'),
      width: '160px',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {item.phone && <div style={{ fontSize: '12px' }}>{item.phone}</div>}
          {item.email && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.email}</div>}
          {!item.phone && !item.email && <span className="text-muted">-</span>}
        </div>
      )
    },
    { 
      key: 'balance', 
      header: t('companies.balanceCreditDebt', 'Bakiye (Alacak/Borç)'), 
      align: 'right',
      width: '180px',
      render: (item) => {
        const isDebt = item.balance < 0; // We owe them (Borç)
        const isCredit = item.balance > 0; // They owe us (Alacak)
        
        let color = 'var(--text-primary)';
        if (isDebt) color = '#EF4444';
        if (isCredit) color = '#10B981';
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <div style={{ color, fontWeight: isDebt || isCredit ? 600 : 400 }}>
              <CurrencyDisplay amount={Math.abs(item.balance)} currency={item.currency} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isCredit ? t('companies.weAreCreditorShort', '(Biz Alacaklıyız)') : isDebt ? t('companies.weAreDebtorShort', '(Biz Borçluyuz)') : t('companies.noBalance', 'Bakiye Yok')}
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button 
            className="btn-icon" 
            onClick={(e) => {
              e.stopPropagation();
              if (onRowClick) onRowClick(item);
            }} 
            title={t('companies.statementDetails', 'Cari Ekstresi / Detaylar')}
            style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Eye size={16} />
          </button>
          {onEditClick && (
            <button 
              className="btn-icon" 
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(item);
              }} 
              title={t('common.edit', 'Düzenle')}
              style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Edit2 size={16} />
            </button>
          )}
          {onDeleteClick && (
            <button 
              className="btn-icon" 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(item);
              }} 
              title={t('common.delete', 'Sil')}
              style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter ? item.type === typeFilter : true;
    const matchesRegion = regionFilter ? item.region === regionFilter : true;
    
    return matchesSearch && matchesType && matchesRegion;
  });

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      [t('companies.companyPersonName', 'Firma / Kişi')]: item.name,
      [t('common.region', 'Bölge')]: item.region,
      [t('companies.companyType', 'Cari Tipi')]: item.type,
      [t('companies.authorized', 'Yetkili')]: item.contactPerson || '-',
      [t('companies.phone', 'Telefon')]: item.phone || '-',
      [t('companies.email', 'E-posta')]: item.email || '-',
      [t('companies.balance', 'Bakiye')]: item.balance,
      [t('companies.status', 'Durum')]: item.balance > 0 ? t('companies.weAreCreditor', 'Alacaklıyız') : item.balance < 0 ? t('companies.weAreDebtor', 'Borçluyuz') : t('companies.zero', 'Sıfır'),
      [t('common.currency', 'Para Birimi')]: item.currency
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('companies.companies', "Cariler"));
    XLSX.writeFile(wb, "cariler.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(normalizeTurkishText(t('companies.pdfTitle', 'Cari Hesaplar (Şirketler & Müşteriler)')), 14, 15);
    
    const tableData = filteredData.map(item => [
      normalizeTurkishText(item.name),
      normalizeTurkishText(t(`common.${item.region === 'Türkiye' ? 'turkey' : 'saudiArabia'}`, item.region)),
      normalizeTurkishText(t(`companies.${item.type === 'Müşteri' ? 'customer' : item.type === 'Tedarikçi' ? 'supplier' : 'personnel'}`, item.type)),
      normalizeTurkishText(item.phone || '-'),
      `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(item.balance))} ${item.currency}`,
      normalizeTurkishText(item.balance > 0 ? t('companies.credit', 'Alacak') : item.balance < 0 ? t('companies.debt', 'Borç') : '-')
    ]);

    autoTable(doc, {
      head: [[
        normalizeTurkishText(t('companies.companyPersonName', 'Firma/Kişi')),
        normalizeTurkishText(t('common.region', 'Bölge')),
        normalizeTurkishText(t('companies.companyType', 'Tip')),
        normalizeTurkishText(t('companies.phone', 'Telefon')),
        normalizeTurkishText(t('companies.balance', 'Bakiye')),
        normalizeTurkishText(t('companies.status', 'Durum'))
      ]],
      body: tableData,
      startY: 20
    });

    doc.save("cariler.pdf");
  };

  const rightActions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      {selectedIds.length > 0 && onDeleteMultiple && (
        <button 
          className="btn-primary" 
          style={{ backgroundColor: 'var(--danger)', padding: '0 12px' }}
          onClick={() => {
            if (window.confirm(t('companies.deleteMultipleConfirm', 'Seçili {{count}} cariyi silmek istediğinize emin misiniz?', { count: selectedIds.length }))) {
              onDeleteMultiple(selectedIds);
              setSelectedIds([]);
            }
          }}
        >
          <Trash2 size={16} />
          <span>{t('companies.deleteSelected', 'Seçilenleri Sil')} ({selectedIds.length})</span>
        </button>
      )}
      <button className="btn-secondary" title={t('common.exportExcel', 'Excel\'e Aktar')} onClick={handleExportExcel}>
        <FileDown size={18} />
        <span>{t('common.excel', 'Excel')}</span>
      </button>
      <button className="btn-secondary" title={t('common.exportPdf', 'PDF\'e Aktar')} onClick={handleExportPDF}>
        <Download size={18} />
        <span>{t('common.pdf', 'PDF')}</span>
      </button>
      <button className="btn-secondary" onClick={onImportClick} title={t('common.importExcel', 'Excel\'den Aktar')}>
        <UploadCloud size={18} />
        <span>{t('common.importExcelBtn', 'Excel\'den Aktar')}</span>
      </button>
    </div>
  );

  return (
    <div className="income-table-section">
      <FilterBar 
        onSearch={setSearchTerm} 
        onAdd={onAddNew} 
        addLabel={t('companies.addNewCompany', 'Yeni Cari Ekle')}
        actionsRight={rightActions}
      >
        <div style={{ width: '140px' }}>
          <SearchableSelect 
            options={[
              { value: '', label: t('common.allRegions', 'Tüm Bölgeler') },
              { value: 'Türkiye', label: `${t('common.turkey', 'Türkiye')} 🇹🇷` },
              { value: 'Arabistan', label: `${t('common.saudiArabia', 'Arabistan')} 🇸🇦` }
            ]}
            value={regionFilter}
            onChange={setRegionFilter}
            style={{ height: '36px', fontSize: '11.5px' }}
          />
        </div>

        <div style={{ width: '140px' }}>
          <SearchableSelect 
            options={[
              { value: '', label: t('companies.allCompanyTypes', 'Tüm Cari Tipleri') },
              { value: 'Müşteri', label: t('companies.customer', 'Müşteri') },
              { value: 'Tedarikçi', label: t('companies.supplier', 'Tedarikçi') },
              { value: 'Personel', label: t('companies.personnel', 'Personel') }
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ height: '36px', fontSize: '11.5px' }}
          />
        </div>
        
        <div style={{ flex: 1 }}></div>
      </FilterBar>

      <DataTable 
        data={filteredData} 
        columns={columns} 
        onRowClick={onRowClick}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}
