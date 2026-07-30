import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileDown, UploadCloud, Eye, Wallet, RefreshCcw, AlertCircle, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataTable } from '../../../core/components/DataTable/DataTable';
import type { Column } from '../../../core/components/DataTable/DataTable';
import { StatusBadge } from '../../../core/components/Typography/StatusBadge';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { FilterBar } from '../../../core/components/FilterBar/FilterBar';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { normalizeTurkishText } from '../../../core/utils/pdfHelper';
import type { ExpenseRecord } from '../types';
import { useCategories } from '../../../core/hooks/useCategories';
import { useAuth } from '../../../core/contexts/AuthContext';

interface ExpenseTableProps {
  data: ExpenseRecord[];
  kpiFilter?: 'all' | 'pending' | 'overdue';
  kpiCurrencyFilter?: 'all' | 'USD' | 'SAR' | 'TRY' | 'EUR';
  onDataFiltered?: (filteredData: ExpenseRecord[]) => void;
  onAddNew: () => void;
  onImportClick: () => void;
  onRowClick?: (item: ExpenseRecord) => void;
  onPaymentClick?: (item: ExpenseRecord) => void;
  onEditClick?: (item: ExpenseRecord) => void;
  onDeleteClick?: (item: ExpenseRecord) => void;
  onMoveClick?: (item: ExpenseRecord) => void;
  onDeleteMultiple?: (ids: string[]) => void;
}

export function ExpenseTable({ data, kpiFilter, kpiCurrencyFilter, onDataFiltered, onAddNew, onImportClick, onRowClick, onPaymentClick, onEditClick, onDeleteClick, onMoveClick, onDeleteMultiple }: ExpenseTableProps) {
  const { t } = useTranslation();
  const { expenseCategories } = useCategories();
  const { user } = useAuth();
  const lockedDate = localStorage.getItem('barik_locked_date') || '';
  const isLocked = (date: string) => lockedDate && date < lockedDate && user?.role !== 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const columns: Column<ExpenseRecord>[] = [
    { 
      key: 'systemNo', 
      header: t('common.systemNo', 'Sistem No'), 
      width: '130px',
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {item.systemNo || '-'}
        </span>
      )
    },
    { 
      key: 'invoiceNo', 
      header: t('expenses.table.invoiceNo', 'Makbuz / Fatura No'), 
      width: '140px',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {item.invoiceNo}
          {item.isRecurring && (
            <RefreshCcw size={14} color="var(--accent)"  />
          )}
        </div>
      )
    },
    { key: 'date', header: t('expenses.table.date', 'İşlem Tarihi'), width: '110px' },
    { key: 'supplierName', header: t('expenses.table.supplier', 'Şirket / Tedarikçi') },
    {
      key: 'payer_payee',
      header: t('expenses.table.payerPayee', 'Ödeyen / Ödenen'),
      width: '180px',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px' }}>
          {item.payer ? <div><span style={{ color: 'var(--text-muted)' }}>{t('expenses.payer', 'Ödeyen:')}</span> <span style={{ fontWeight: 500 }}>{item.payer}</span></div> : null}
          {item.payee ? <div><span style={{ color: 'var(--text-muted)' }}>{t('expenses.payee', 'Ödenen:')}</span> <span style={{ fontWeight: 500 }}>{item.payee}</span></div> : null}
          {!item.payer && !item.payee && <span style={{ color: 'var(--text-muted)' }}>-</span>}
        </div>
      )
    },
    { 
      key: 'category', 
      header: t('common.category', 'Kategori'),
      width: '140px',
      render: (item) => (
        item.category ? (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            {item.category}
          </span>
        ) : <span className="text-muted">-</span>
      )
    },
    { 
      key: 'amount', 
      header: t('expenses.table.amount', 'Tutar'), 
      align: 'right',
      width: '180px',
      render: (item) => {
        const total = item.amount;
        const paid = item.paidAmount || 0;
        const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
        const isFullyPaid = percent === 100;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <CurrencyDisplay amount={item.amount} currency={item.currency} />
            {paid > 0 && !isFullyPaid && (
              <div style={{ width: '100%', maxWidth: '120px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span>{t('expenses.paid', 'Ödenen:')} {new Intl.NumberFormat('tr-TR').format(paid)}</span>
                  <span>{percent}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', backgroundColor: '#F59E0B', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {isFullyPaid && (
              <span style={{ fontSize: '10px', color: '#10b981' }}>{t('expenses.fullyPaid', 'Tümü Ödendi')}</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'status', 
      header: t('common.status', 'Durum'),
      width: '130px',
      render: (item) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = item.status === 'overdue' || (item.status !== 'completed' && !!item.dueDate && item.dueDate < todayStr);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={isOverdue ? 'overdue' : item.status} label={t(`common.${isOverdue ? 'overdue' : item.status}` as any)} />
            {isOverdue && <AlertCircle size={14} color="var(--error)"  />}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      render: (item) => {
        const isCompleted = item.status === 'completed' || (item.amount > 0 && item.paidAmount === item.amount);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            {!isCompleted && onPaymentClick && (
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); onPaymentClick(item); }} 
                title={t('expenses.addPayment', 'Ödeme Ekle')}
                style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: '#F59E0B', cursor: 'pointer' }}
              >
                <Wallet size={16} />
              </button>
            )}
            <button 
              className="btn-icon" 
              onClick={(e) => {
                e.stopPropagation();
                if (onRowClick) onRowClick(item);
              }} 
              title={t('common.view', 'Görüntüle')}
              style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Eye size={16} />
            </button>
            {onMoveClick && (
              <button 
                className="btn-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked(item.date)) {
                    alert(t('expenses.errorLockedPeriodMove', 'Bu fatura kilitli bir döneme ait olduğu için taşınamaz.'));
                    return;
                  }
                  onMoveClick(item);
                }} 
                title={t('expenses.moveToIncome', 'Gelir Olarak Taşı')}
                style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--warning)', cursor: isLocked(item.date) ? 'not-allowed' : 'pointer' }}
              >
                <ArrowRightLeft size={16} />
              </button>
            )}
            {onEditClick && (
              <button 
                className="btn-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked(item.date)) {
                    alert(t('common.errorLockedPeriodEdit', 'Bu fatura kilitli bir döneme ait olduğu için değiştirilemez.'));
                    return;
                  }
                  onEditClick(item);
                }} 
                title={t('common.edit', 'Düzenle')}
                style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: isLocked(item.date) ? 'var(--border-color)' : 'var(--text-muted)', cursor: isLocked(item.date) ? 'not-allowed' : 'pointer' }}
              >
                <Edit2 size={16} />
              </button>
            )}
            {onDeleteClick && (
              <button 
                className="btn-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked(item.date)) {
                    alert(t('common.errorLockedPeriodDelete', 'Bu fatura kilitli bir döneme ait olduğu için silinemez.'));
                    return;
                  }
                  onDeleteClick(item);
                }} 
                title={t('common.delete', 'Sil')}
                style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: isLocked(item.date) ? 'var(--border-color)' : 'var(--error)', cursor: isLocked(item.date) ? 'not-allowed' : 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const filteredForKPIs = useMemo(() => {
    return data.filter(item => {
      const search = searchTerm.toLocaleLowerCase('tr-TR');
      const matchesSearch = (item.supplierName || '').toLocaleLowerCase('tr-TR').includes(search) ||
        (item.invoiceNo || '').toLocaleLowerCase('tr-TR').includes(search) ||
        (item.description || '').toLocaleLowerCase('tr-TR').includes(search);
      
      const matchesStatus = statusFilter ? item.status === statusFilter : true;
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      const matchesCustomer = customerFilter 
        ? (item.supplierName || '').trim().toLocaleLowerCase('tr-TR') === customerFilter.trim().toLocaleLowerCase('tr-TR') 
        : true;
      const matchesCurrency = currencyFilter ? item.currency === currencyFilter : true;
      
      let matchesMonth = true;
      if (monthFilter) {
        const itemMonth = new Date(item.date).getMonth() + 1;
        matchesMonth = itemMonth === parseInt(monthFilter);
      }
      
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && item.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && item.date <= endDate;
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesCustomer && matchesMonth && matchesDate && matchesCurrency;
    });
  }, [data, searchTerm, statusFilter, categoryFilter, monthFilter, startDate, endDate, customerFilter, currencyFilter]);

  const onDataFilteredRef = useRef(onDataFiltered);
  useEffect(() => {
    onDataFilteredRef.current = onDataFiltered;
  }, [onDataFiltered]);

  useEffect(() => {
    if (onDataFilteredRef.current) {
      onDataFilteredRef.current(filteredForKPIs);
    }
  }, [filteredForKPIs]);

  const filteredData = useMemo(() => {
    return filteredForKPIs.filter(item => {
      if (kpiCurrencyFilter && kpiCurrencyFilter !== 'all' && item.currency !== kpiCurrencyFilter) return false;
      if (!kpiFilter || kpiFilter === 'all') return true;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const isOverdue = item.status === 'overdue' || (item.status !== 'completed' && !!item.dueDate && item.dueDate < todayStr);
      
      if (kpiFilter === 'overdue') return isOverdue;
      if (kpiFilter === 'pending') return (item.status === 'pending' || item.status !== 'completed') && !isOverdue;
      return true;
    });
  }, [filteredForKPIs, kpiFilter, kpiCurrencyFilter]);

  const handleExportExcel = () => {
    import('../../../core/utils/excelTemplateExport').then(({ exportToExcelWithTemplate }) => {
      const exportData = filteredData.map(item => ({
        date: item.date,
        type: t('expenses.expenseTitle', 'GİDER'),
        payer: t('common.safe', 'KASA'), // Giderlerde ödeyen kasa
        payee: item.supplierName, // Kime ödendi
        department: item.category || '-',
        description: item.description,
        amount: item.amount,
        currency: item.currency,
      }));
      exportToExcelWithTemplate(exportData, "giderler.xlsx");
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(normalizeTurkishText(t('expenses.title', 'Giderler')), 14, 15);
    
    const tableData = filteredData.map(item => [
      normalizeTurkishText(item.invoiceNo),
      normalizeTurkishText(item.date),
      normalizeTurkishText(item.supplierName),
      normalizeTurkishText(item.category || '-'),
      `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount)} ${item.currency}`,
      `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.paidAmount || 0)} ${item.currency}`,
      normalizeTurkishText(t(`common.${item.status}` as any))
    ]);

    autoTable(doc, {
      head: [[
        normalizeTurkishText(t('expenses.table.invoiceNo', 'Makbuz / Fatura No')),
        normalizeTurkishText(t('expenses.table.date', 'İşlem Tarihi')),
        normalizeTurkishText(t('expenses.table.supplier', 'Şirket / Tedarikçi')),
        normalizeTurkishText(t('common.category', 'Kategori')),
        normalizeTurkishText(t('expenses.table.amount', 'Tutar')),
        normalizeTurkishText(t('expenses.paid', 'Ödenen')),
        normalizeTurkishText(t('common.status', 'Durum'))
      ]],
      body: tableData,
      startY: 20
    });

    doc.save("giderler.pdf");
  };

  const handleBulkComplete = () => {
    alert(t('expenses.bulkCompleteSuccess', '{{count}} kayıt başarıyla "Ödendi" olarak işaretlendi!', { count: selectedIds.length }));
    setSelectedIds([]);
  };

  const rightActions = (
    <div style={{ display: 'flex', gap: '4px' }}>
      {selectedIds.length > 0 && onDeleteMultiple && (
        <button 
          className="btn-primary" 
          style={{ backgroundColor: 'var(--danger)', padding: '0 12px' }}
          onClick={() => {
            if (window.confirm(t('expenses.bulkDeleteConfirm', 'Seçili {{count}} kaydı silmek istediğinize emin misiniz?', { count: selectedIds.length }))) {
              onDeleteMultiple(selectedIds);
              setSelectedIds([]);
            }
          }}
        >
          <Trash2 size={16} />
          <span>{t('common.deleteSelectedWithCount', 'Seçilenleri Sil ({{count}})', { count: selectedIds.length })}</span>
        </button>
      )}
      <button className="btn-secondary" onClick={handleExportExcel} style={{ padding: '0 8px' }}>
        <FileDown size={16} />
        <span>{t('common.excel', 'Excel')}</span>
      </button>
      <button className="btn-secondary" onClick={handleExportPDF} style={{ padding: '0 8px' }}>
        <Download size={16} />
        <span>{t('common.pdf', 'PDF')}</span>
      </button>
      <button className="btn-secondary" onClick={onImportClick} title={t('expenses.import.title', "Excel'den İçe Aktar")} style={{ padding: '0 8px' }}>
        <UploadCloud size={16} />
        <span>{t('common.import', 'İçe Aktar')}</span>
      </button>
    </div>
  );

  let allFilterCategories = Array.from(new Set([
    ...expenseCategories.filter(c => !c.toLowerCase().includes('avans') && !c.toLowerCase().includes('maaş')),
    'Personel Ödemesi / Avans'
  ]));
  
  if (allFilterCategories.includes('Diğer')) {
    allFilterCategories = [...allFilterCategories.filter(c => c !== 'Diğer'), 'Diğer'];
  }

  return (
    <div className="income-table-section">
      <FilterBar 
        onSearch={setSearchTerm} 
        onAdd={onAddNew} 
        addLabel={t('expenses.addExpense', 'Yeni Gider Ekle')}
        actionsRight={rightActions}
      >
        <div style={{ width: '130px' }}>
          <SearchableSelect 
            options={[
              { value: '', label: t('expenses.allCompanies', 'Tüm Şirketler') },
              ...Array.from(new Set(data.filter(d => d.supplierName).map(d => d.supplierName))).sort().map(company => ({
                value: company,
                label: company
              }))
            ]}
            value={customerFilter}
            onChange={setCustomerFilter}
            placeholder={t('expenses.allCompanies', 'Tüm Şirketler')}
            searchPlaceholder={t('expenses.searchCompany', 'Şirket ara...')}
            style={{ height: '36px', fontSize: '11.5px' }}
          />
        </div>

        <div style={{ width: '130px' }}>
          <SearchableSelect 
            options={[{ value: '', label: t('common.allCategories', 'Tüm Kategoriler') }, ...allFilterCategories.map(c => ({ value: c, label: c }))]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder={t('common.allCategories', 'Tüm Kategoriler')}
            searchPlaceholder={t('common.searchCategory', 'Kategori ara...')}
            style={{ height: '36px', fontSize: '11.5px' }}
          />
        </div>
        
        <div style={{ width: '110px' }}>
          <SearchableSelect 
            options={[
              { value: '', label: t('common.allStatuses', 'Tüm Durumlar') },
              { value: 'completed', label: t('common.completed', 'Ödendi') },
              { value: 'pending', label: t('common.pending') },
              { value: 'overdue', label: t('common.overdue') }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ height: '36px', fontSize: '11.5px' }}
          />
        </div>
        
        <div style={{ width: '100px' }}>
          <SearchableSelect 
            options={[
              { value: '', label: t('common.allCurrencies', 'Tüm Kurlar') },
              { value: 'USD', label: t('common.usdCurrency', 'Dolar (USD)') },
              { value: 'SAR', label: t('common.sarCurrency', 'Riyal (SAR)') },
              { value: 'TRY', label: t('common.tryCurrency', 'TL (TRY)') },
              { value: 'EUR', label: t('common.eurCurrency', 'Euro (EUR)') }
            ]}
            value={currencyFilter}
            onChange={setCurrencyFilter}
            style={{ height: '36px', fontSize: '11.5px' }}
          />
        </div>

        <div style={{ width: '100px' }}>
          <SearchableSelect 
            options={[
              { value: '', label: t('common.allMonths', 'Tüm Aylar') },
              { value: '1', label: t('common.january', 'Ocak') },
              { value: '2', label: t('common.february', 'Şubat') },
              { value: '3', label: t('common.march', 'Mart') },
              { value: '4', label: t('common.april', 'Nisan') },
              { value: '5', label: t('common.may', 'Mayıs') },
              { value: '6', label: t('common.june', 'Haziran') },
              { value: '7', label: t('common.july', 'Temmuz') },
              { value: '8', label: t('common.august', 'Ağustos') },
              { value: '9', label: t('common.september', 'Eylül') },
              { value: '10', label: t('common.october', 'Ekim') },
              { value: '11', label: t('common.november', 'Kasım') },
              { value: '12', label: t('common.december', 'Aralık') }
            ]}
            value={monthFilter}
            onChange={setMonthFilter}
            style={{ height: '36px', fontSize: '11.5px' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '110px', height: '36px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '110px', height: '36px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <div style={{ flex: 1 }}></div>
      </FilterBar>

      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent)' }}>
            {t('common.rowsSelected', '{{count}} satır seçildi', { count: selectedIds.length })}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={handleBulkComplete} style={{ height: '32px', fontSize: '13px', borderColor: '#10b981', color: '#10b981' }}>
              {t('expenses.markSelectedAsPaid', 'Seçilenleri Ödendi İşaretle')}
            </button>
            <button className="btn-secondary" onClick={() => setSelectedIds([])} style={{ height: '32px', fontSize: '13px' }}>
              {t('common.cancel', 'İptal')}
            </button>
          </div>
        </div>
      )}

      <DataTable 
        data={filteredData} 
        columns={columns} 
        onRowClick={onRowClick}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        pagination={true}
        itemsPerPage={15}
      />
    </div>
  );
}
