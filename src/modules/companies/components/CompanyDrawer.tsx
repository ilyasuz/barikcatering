import { useState, useEffect } from 'react';
import { Drawer } from '../../../core/components/Drawer/Drawer';
import { useRegion } from '../../../core/contexts/RegionContext';
import { SearchableSelect } from '../../../core/components/Form/SearchableSelect';
import { useTranslation } from 'react-i18next';
import type { CompanyRecord } from '../types';

interface CompanyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CompanyRecord>) => void;
  initialData?: Partial<CompanyRecord> | null;
}

export function CompanyDrawer({ isOpen, onClose, onSave, initialData }: CompanyDrawerProps) {
  const { t } = useTranslation();
  const { region } = useRegion();

  const [formData, setFormData] = useState<Partial<CompanyRecord>>({
    type: 'Müşteri',
    region: 'Türkiye',
    currency: 'TRY',
    status: 'active',
    balance: 0
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        const defaultRegion = region !== 'all' ? region : 'Türkiye';
        const defaultCurrency = defaultRegion === 'Arabistan' ? 'SAR' : 'TRY';
        
        setFormData({
          type: 'Müşteri',
          region: defaultRegion as any,
          currency: defaultCurrency as any,
          status: 'active',
          balance: 0
        });
      }
    }
  }, [isOpen, initialData, region]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      ...formData,
      balance: 0
    });
    
    // Reset form after save
    setFormData({
      type: 'Müşteri',
      region: 'Türkiye',
      currency: 'TRY',
      status: 'active',
      balance: 0,
      name: '',
      address: '',
      monthlySalary: undefined,
      salaryDay: undefined
    });
    
    onClose();
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('companies.addNewCompanyPerson', 'Yeni Cari (Firma/Kişi) Ekle')}
      width="500px"
    >
      <form onSubmit={handleSubmit} className="drawer-form">
        <div className="form-group">
          <label className="form-label">{t('companies.companyPersonName', 'Firma / Kişi Adı')}</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t('companies.namePlaceholder', 'Örn: Acme Corp, Ahmet Yılmaz')}
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('companies.companyType', 'Cari Tipi')}</label>
            <SearchableSelect 
              options={[
                { value: 'Müşteri', label: t('companies.customerBuyer', 'Müşteri (Alıcı)') },
                { value: 'Tedarikçi', label: t('companies.supplierSeller', 'Tedarikçi (Satıcı)') },
                { value: 'Personel', label: t('companies.personnel', 'Personel') }
              ]}
              value={formData.type as string}
              onChange={(val) => setFormData({...formData, type: val as any})}
              hideSearch
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.region', 'Bölge')}</label>
            <SearchableSelect 
              options={[
                { value: 'Türkiye', label: `${t('common.turkey', 'Türkiye')} 🇹🇷` },
                { value: 'Arabistan', label: `${t('common.saudiArabia', 'Arabistan')} 🇸🇦` }
              ]}
              value={formData.region as string}
              onChange={(val) => setFormData({...formData, region: val as any})}
              hideSearch
            />
          </div>
        </div>

        {formData.type === 'Personel' && (
          <>
            <div className="form-group">
              <label>{t('companies.monthlyNetSalary', 'Aylık Net Maaş (₺)')}</label>
              <input
                type="number"
                value={formData.monthlySalary || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlySalary: Number(e.target.value) }))}
                className="form-control"
                placeholder={t('companies.salaryPlaceholder', 'Örn: 17002')}
              />
            </div>
            <div className="form-group">
              <label>{t('companies.salaryAccrualDay', 'Maaş Tahakkuk Günü')}</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <SearchableSelect
                  options={[
                    { value: '', label: t('common.select', 'Seçiniz...') },
                    ...Array.from({ length: 31 }, (_, i) => i + 1).map(day => ({ value: day, label: t('companies.dayOfMonth', 'Ayın {{day}}. Günü', { day }) }))
                  ]}
                  value={formData.salaryDay || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, salaryDay: Number(val) }))}
                  hideSearch
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('companies.salaryAccrualInfo', 'Seçilen günde maaş otomatik olarak personele alacak (size borç) olarak yansıtılır.')}
              </p>
            </div>
          </>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('companies.authorized', 'Yetkili Kişi')}</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder={t('companies.authorizedPlaceholder', 'Örn: Mehmet Bey')}
              value={formData.contactPerson || ''}
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('companies.phone', 'Telefon')}</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="+90 5XX XXX XX XX"
              value={formData.phone || ''}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('companies.emailAddress', 'E-posta Adresi')}</label>
          <input 
            type="email" 
            className="form-control" 
            placeholder="ornek@firma.com"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('companies.taxOffice', 'Vergi Dairesi')}</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.taxOffice || ''}
              onChange={(e) => setFormData({...formData, taxOffice: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('companies.taxNo', 'Vergi / TC No')}</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.taxNumber || ''}
              onChange={(e) => setFormData({...formData, taxNumber: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('companies.fullAddress', 'Açık Adres')}</label>
          <textarea 
            className="form-control" 
            placeholder={t('companies.addressPlaceholder', 'Firma veya kişinin kayıtlı adresi...')}
            value={formData.address || ''}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            style={{ height: '80px', resize: 'none' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('companies.specialNotes', 'Özel Notlar')}</label>
          <textarea 
            className="form-control" 
            placeholder={t('companies.notesPlaceholder', 'Şirketle ilgili özel notlar veya anlaşma şartları...')}
            value={formData.notes || ''}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            style={{ height: '60px', resize: 'none' }}
          />
        </div>
        <div className="drawer-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('common.cancel', 'İptal')}
          </button>
          <button type="submit" className="btn-primary">
            {t('companies.saveCompany', 'Cari Kaydet')}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
