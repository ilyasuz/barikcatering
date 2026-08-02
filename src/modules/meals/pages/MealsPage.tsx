import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Printer, Compass, Eye } from 'lucide-react';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useRegion } from '../../../core/contexts/RegionContext';
import { useExchangeRates } from '../../../core/contexts/ExchangeRatesContext';
import { FilterBar } from '../../../core/components/FilterBar/FilterBar';
import { DataTable } from '../../../core/components/DataTable/DataTable';
import { CurrencyDisplay } from '../../../core/components/Typography/CurrencyDisplay';
import { mealApi } from '../api';
import type { MealCalculation } from '../types';
import { MealDrawer } from '../components/MealDrawer';
import { ExcursionModal } from '../components/ExcursionModal';
import { MealDetailModal } from '../components/MealDetailModal';
import { Dialog } from '../../../core/components/Dialog/Dialog';
import { MealPrintView } from '../components/MealPrintView';
import { BatchMealPrintView } from '../components/BatchMealPrintView';
import { Modal } from '../../../core/components/Modal/Modal';
import { supabase } from '../../../lib/supabase';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { useTranslation } from 'react-i18next';

export function MealsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { region } = useRegion();
  const { rates } = useExchangeRates();
  const [data, setData] = useState<MealCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [excursionMeal, setExcursionMeal] = useState<MealCalculation | null>(null);
  const [detailMeal, setDetailMeal] = useState<MealCalculation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const uniqueHotels = useMemo(() => {
    const set = new Set<string>();
    data.forEach(item => {
      if (item.hotel_name && item.hotel_name.trim()) {
        set.add(item.hotel_name.trim());
      }
    });
    return Array.from(set).sort();
  }, [data]);

  const [printMeal, setPrintMeal] = useState<MealCalculation | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const batchPrintRef = useRef<HTMLDivElement>(null);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const meals = await mealApi.getAll(region);
      setData(meals);
    } catch (error: any) {
      console.error('Error loading meals:', error);
      setPageError(error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, region')
      .order('name');
    if (data) {
      setCompanies(data.filter(c => !region || region === 'all' || c.region === region));
    }
  };

  useEffect(() => {
    loadData();
    loadCompanies();
  }, [region]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await mealApi.delete(deleteId);
      loadData();
    } catch (error: any) {
      console.error('Error deleting meal calculation:', error);
      alert(error.message || t('common.error', 'Bir hata oluştu'));
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${t('meals.printInvoice', 'Fatura Yazdır')}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { size: landscape; margin: 10mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const columns = [
    { key: 'tarih', header: t('common.date', 'Tarih'), width: '11%', render: (row: MealCalculation) => formatDate(row.created_at || row.entry_date) },
    { key: 'sirket', header: t('meals.company', 'Şirket'), width: '15%', render: (row: MealCalculation) => row.company_name || '-' },
    { key: 'otel', header: t('meals.hotel', 'Otel'), width: '15%', render: (row: MealCalculation) => row.hotel_name },
    { key: 'giris', header: t('meals.checkIn', 'Giriş'), width: '11%', render: (row: MealCalculation) => formatDate(row.entry_date) },
    { key: 'cikis', header: t('meals.checkOut', 'Çıkış'), width: '11%', render: (row: MealCalculation) => formatDate(row.exit_date) },
    { key: 'kisi', header: t('meals.pax', 'Kişi'), width: '7%', render: (row: MealCalculation) => row.pax_count },
    { 
      key: 'gun', 
      header: t('meals.days', 'Gün'), 
      width: '11%', 
      render: (row: MealCalculation) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.total_days} gün</div>
          {(row.excursion_days || 0) > 0 && (
            <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginTop: '2px' }} title={row.excursion_note || ''}>
              ⛺ -{row.excursion_days}g {row.excursion_note ? `(${row.excursion_note})` : 'gezi'}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'tutar',
      header: t('meals.amount', 'Tutar'), 
      width: '12%',
      align: 'right' as const,
      render: (row: MealCalculation) => {
        const rate = rates['SAR'] || 3.75;
        let eqAmount = 0;
        let eqCurrency = '';
        if (row.currency === 'SAR') { eqAmount = row.total_amount / rate; eqCurrency = 'USD'; }
        else if (row.currency === 'USD') { eqAmount = row.total_amount * rate; eqCurrency = 'SAR'; }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <div style={{ fontWeight: 600 }}><CurrencyDisplay amount={row.total_amount} currency={row.currency} /></div>
            {eqAmount > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                ~ {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(eqAmount)} {eqCurrency}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'islemler',
      header: t('common.actions', 'İşlemler'),
      width: '10%',
      align: 'right' as const,
      render: (row: MealCalculation) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="btn-text"
            style={{ padding: '6px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            title={t('common.viewDetails', 'Detay Gör')}
            onClick={(e) => { e.stopPropagation(); setDetailMeal(row); }}
          >
            <Eye size={16} />
          </button>
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <button 
              className="btn-text"
              style={{ padding: '6px', color: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
              title={t('meals.addExcursionTooltip', 'Gezi Ekle / Düşüş Yap')}
              onClick={(e) => { e.stopPropagation(); setExcursionMeal(row); }}
            >
              <Compass size={16} />
            </button>
          )}
          <button 
            className="btn-text"
            style={{ padding: '6px', color: 'var(--accent)', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
            title={t('meals.printInvoiceTooltip', 'Yazdır / Fatura')}
            onClick={(e) => { e.stopPropagation(); setPrintMeal(row); }}
          >
            <Printer size={16} />
          </button>
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <button 
              className="btn-text"
              style={{ padding: '6px', color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              title={t('common.delete', 'Sil')}
              onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredData = useMemo(() => {
    let result = data;

    if (companyFilter) {
      result = result.filter(item => item.company_id === companyFilter);
    }

    if (hotelFilter) {
      result = result.filter(item => item.hotel_name.trim() === hotelFilter);
    }

    if (startDate) {
      result = result.filter(item => item.entry_date >= startDate);
    }
    
    if (endDate) {
      result = result.filter(item => item.entry_date <= endDate);
    }

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.hotel_name.toLowerCase().includes(lowerSearch) ||
        (item.company_name && item.company_name.toLowerCase().includes(lowerSearch))
      );
    }
    
    return result;
  }, [data, searchTerm, companyFilter, hotelFilter, startDate, endDate]);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{t('meals.title', 'Yemek Hesapları')}</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>{t('meals.subtitle', 'Umre acenta giriş-çıkış yemek hesabı takibi ve faturalandırma')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {filteredData.length > 0 && (
            <button className="btn-secondary" onClick={() => setShowBatchPrint(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} />
              <span>{t('meals.batchPrint', 'Toplu Yazdır')} ({filteredData.length})</span>
            </button>
          )}
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <button className="btn-primary" onClick={() => setIsDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} />
              <span>{t('meals.newCalculation', 'Yeni Yemek Hesabı')}</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <FilterBar
          onSearch={setSearchTerm}
        >
          <div style={{ width: '180px' }}>
            <SearchableSelect
              options={[{ value: '', label: t('meals.allCompanies', 'Tüm Şirketler') }, ...companies.map(c => ({ value: c.id, label: c.name }))]}
              value={companyFilter}
              onChange={val => setCompanyFilter(val as string)}
              placeholder={t('meals.allCompanies', 'Tüm Şirketler')}
            />
          </div>
          <div style={{ width: '180px' }}>
            <SearchableSelect
              options={[{ value: '', label: t('meals.allHotels', 'Tüm Oteller') }, ...uniqueHotels.map(h => ({ value: h, label: h }))]}
              value={hotelFilter}
              onChange={val => setHotelFilter(val as string)}
              placeholder={t('meals.allHotels', 'Tüm Oteller')}
            />
          </div>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '135px', fontSize: '13px', padding: '6px 8px' }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            title={t('meals.startDate', 'Başlangıç Tarihi')}
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '135px', fontSize: '13px', padding: '6px 8px' }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            title={t('meals.endDate', 'Bitiş Tarihi')}
          />
        </FilterBar>
      </div>

      <div className="page-content">
        {pageError && (
          <div style={{ padding: '16px', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#EF4444' }}>
            <strong>{t('meals.errorLoading', 'Veriler yüklenirken hata oluştu:')}</strong> {pageError}
          </div>
        )}
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setDetailMeal(row as MealCalculation)}
          emptyMessage={t('meals.noRecordsFound', 'Henüz yemek hesabı kaydı bulunmuyor.')}
        />
      </div>

      <MealDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={loadData}
        initialRegion={region}
      />

      <ExcursionModal
        isOpen={!!excursionMeal}
        onClose={() => setExcursionMeal(null)}
        meal={excursionMeal}
        onSuccess={loadData}
      />

      <MealDetailModal
        isOpen={!!detailMeal}
        onClose={() => setDetailMeal(null)}
        meal={detailMeal}
        onPrint={(m) => setPrintMeal(m)}
        onEditExcursion={(m) => setExcursionMeal(m)}
      />

      <Dialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('meals.deleteAccount', 'Hesabı Sil')}
        message={t('meals.deleteConfirmMsg', 'Bu yemek hesabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')}
        type="danger"
        confirmText={t('common.delete', 'Sil')}
        cancelText={t('common.cancel', 'İptal')}
      />

      <Modal
        isOpen={!!printMeal}
        onClose={() => setPrintMeal(null)}
        title={t('meals.invoicePreview', 'Fatura / Çıktı Önizleme')}
        width="1000px"
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} />
            {t('common.print', 'Yazdır')}
          </button>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
          {printMeal && (
            <div ref={printRef}>
              <MealPrintView meal={printMeal} />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showBatchPrint}
        onClose={() => setShowBatchPrint(false)}
        title={t('meals.batchPrintPreview', 'Toplu Yazdır / Çıktı Önizleme')}
        width="1100px"
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button 
            onClick={() => {
              if (!batchPrintRef.current) return;
              const printContent = batchPrintRef.current.innerHTML;
              const printWindow = window.open('', '_blank', 'width=1200,height=800');
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>{t('meals.batchPrintInvoice', 'Toplu Fatura Yazdır')}</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>
                        @media print {
                          @page { size: landscape; margin: 10mm; }
                          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                      </style>
                    </head>
                    <body onload="window.print(); window.close();">
                      ${printContent}
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }
            }} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={18} />
            {t('common.print', 'Yazdır')}
          </button>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div ref={batchPrintRef}>
            <BatchMealPrintView meals={filteredData} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
