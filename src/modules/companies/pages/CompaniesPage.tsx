import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyTable } from '../components/CompanyTable';
import { CompanyKPIs } from '../components/CompanyKPIs';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyImportModal } from '../components/CompanyImportModal';
import type { CompanyRecord } from '../types';
import { companiesApi } from '../api';
import { incomeApi } from '../../income/api';
import { expensesApi } from '../../expenses/api';

import { useRegion } from '../../../core/contexts/RegionContext';
import { useTranslation } from 'react-i18next';

export function CompaniesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { region } = useRegion();
  const [data, setData] = useState<CompanyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CompanyRecord | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    let [companies, incomes, expenses] = await Promise.all([
      companiesApi.getAll(),
      incomeApi.getAll(),
      expensesApi.getAll()
    ]);
    if (region !== 'all') {
      companies = companies.filter(c => c.region === region);
    }
    
    const enrichedCompanies = companies.map(c => {
      const cIncomes = incomes.filter(i => i.companyId === c.id);
      const cExpenses = expenses.filter(e => e.companyId === c.id);
      
      const isMusteri = c.type === 'Müşteri';
      
      // Bize olan borçlarını artıranlar (Bizim alacaklarımız):
      // - Müşteriye kesilen faturalar
      // - Tedarikçi/Personele yapılan ödemeler (Tediye, Avans, Peşinatlar)
      const debtToUs = isMusteri
        ? cIncomes.filter(i => i.category !== 'Tahsilat (Ödeme Alma)').reduce((sum, i) => sum + i.amount, 0)
        : cExpenses.filter(e => e.category === 'Tediye (Ödeme Yapma)' || e.category === 'Personel Avans/Ödeme').reduce((sum, e) => sum + e.amount, 0) + cExpenses.filter(e => e.category !== 'Tediye (Ödeme Yapma)' && e.category !== 'Personel Avans/Ödeme').reduce((sum, e) => sum + (e.paidAmount || 0), 0);
        
      // Bize olan borçlarını azaltanlar / Bizi borçlandıranlar:
      // - Müşteriden alınan ödemeler (Tahsilat, Peşinatlar)
      // - Tedarikçiden alınan faturalar / Personel maaş hak edişleri
      const debtToThem = isMusteri
        ? cIncomes.filter(i => i.category !== 'Tahsilat (Ödeme Alma)').reduce((sum, i) => sum + (i.paidAmount || 0), 0) + cIncomes.filter(i => i.category === 'Tahsilat (Ödeme Alma)').reduce((sum, i) => sum + i.amount, 0)
        : cExpenses.filter(e => e.category !== 'Tediye (Ödeme Yapma)' && e.category !== 'Personel Avans/Ödeme').reduce((sum, e) => sum + e.amount, 0);
        
      const activeCurrency = cIncomes.length > 0 ? cIncomes[0].currency 
                           : cExpenses.length > 0 ? cExpenses[0].currency 
                           : c.currency;

      return {
        ...c,
        currency: activeCurrency,
        balance: debtToUs - debtToThem
      };
    });
    
    setData(enrichedCompanies);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [region]);

  const handleSave = async (newRecord: Partial<CompanyRecord>) => {
    if (editingRecord) {
      const updated = await companiesApi.update(editingRecord.id, newRecord);
      if (updated) {
        setData(prev => prev.map(item => item.id === editingRecord.id ? updated : item));
        setIsDrawerOpen(false);
        setEditingRecord(null);
      }
    } else {
      const created = await companiesApi.create(newRecord);
      if (created) {
        setData([created, ...data]);
        setIsDrawerOpen(false);
      }
    }
  };

  const handleDelete = async (item: CompanyRecord) => {
    if (window.confirm(t('companies.deleteConfirmMsg', '{{name}} isimli cariyi silmek istediğinize emin misiniz?', { name: item.name }))) {
      const success = await companiesApi.delete(item.id);
      if (success) {
        setData(prev => prev.filter(r => r.id !== item.id));
      }
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    const success = await companiesApi.deleteMultiple(ids);
    if (success) {
      setData(prev => prev.filter(r => !ids.includes(r.id)));
    }
  };

  const handleImport = async (importedRecords: Partial<CompanyRecord>[]) => {
    // In a real scenario, you'd batch insert to Supabase.
    // For now, insert one by one or implement batch in API.
    for (const rec of importedRecords) {
      await companiesApi.create(rec);
    }
    loadData(); // Refresh all
    setIsImportModalOpen(false);
  };

  const handleRowClick = (record: CompanyRecord) => {
    navigate(`/companies/${record.id}`);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>{t('companies.pageTitle', 'Müşteriler & Şirketler')}</h1>
          <p className="text-muted">{t('companies.pageSubtitle', 'Cari hesaplarınızı, müşterilerinizi ve tedarikçilerinizi bölgesel olarak yönetin.')}</p>
        </div>
      </div>

      <CompanyKPIs data={data} />

      <div style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading', 'Yükleniyor...')}</div>
        ) : (
          <CompanyTable 
            data={data} 
            onAddNew={() => { setEditingRecord(null); setIsDrawerOpen(true); }}
            onImportClick={() => setIsImportModalOpen(true)}
            onRowClick={handleRowClick}
            onEditClick={(item) => { setEditingRecord(item); setIsDrawerOpen(true); }}
            onDeleteClick={handleDelete}
            onDeleteMultiple={handleDeleteMultiple}
          />
        )}
      </div>

      <CompanyDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => { setIsDrawerOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
        initialData={editingRecord}
      />

      <CompanyImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
