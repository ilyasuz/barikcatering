import { useState } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { exportMealToExcel, exportBatchMealsToExcel, type MealExportTemplate } from '../../../core/utils/mealExcelExport';
import type { MealCalculation } from '../types';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Printer, FileText, Calendar, Compass, Building2, Check } from 'lucide-react';

interface MealExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal?: MealCalculation | null;
  meals?: MealCalculation[];
  onPrintWithTemplate: (template: MealExportTemplate) => void;
}

export function MealExportModal({
  isOpen,
  onClose,
  meal,
  meals,
  onPrintWithTemplate
}: MealExportModalProps) {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<MealExportTemplate>('standard');
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const activeMeal = meal || (meals && meals.length > 0 ? meals[0] : null);
  if (!activeMeal) return null;

  const templates: {
    id: MealExportTemplate;
    titleTr: string;
    titleAr: string;
    descTr: string;
    icon: any;
    accentColor: string;
  }[] = [
    {
      id: 'standard',
      titleTr: '1. Standart Özet Tablo',
      titleAr: 'جدول الملخص القياسي (عربي/تركي)',
      descTr: 'Çift dilli (TR/AR) başlıklar, brüt gün, Pax sayısı ve genel toplam özeti.',
      icon: FileText,
      accentColor: '#3B82F6'
    },
    {
      id: 'daily',
      titleTr: '2. Günlük Detaylı Rapor (Gün Gün Pax)',
      titleAr: 'تقرير اليومية التفصيلي لعدد الأشخاص',
      descTr: 'Günlük değişken kişi sayısı (Pax), tarih bazlı birim fiyatlar ve gün sonu dökümü.',
      icon: Calendar,
      accentColor: '#8B5CF6'
    },
    {
      id: 'excursion',
      titleTr: '3. Gezi Düşüşleri Detay Raporu',
      titleAr: 'تقرير تفاصيل خصومات الرحلات والزيارات',
      descTr: 'Mina, Arafat, Gezi kesintilerini tarihler ve nedenleriyle detaylandıran rapor.',
      icon: Compass,
      accentColor: '#EF4444'
    },
    {
      id: 'corporate',
      titleTr: '4. Kurumsal / Resmi Hakediş Tablosu',
      titleAr: 'جدول الاعتماد والمطابقة الرسمي للوكالات',
      descTr: 'Acenteler için imza ve kaşe onay kutuları içeren resmi hakediş dökümü.',
      icon: Building2,
      accentColor: '#10B981'
    }
  ];

  const handleExcelExport = async () => {
    try {
      setIsExportingExcel(true);
      if (meals && meals.length > 0) {
        await exportBatchMealsToExcel(meals, selectedTemplate);
      } else if (activeMeal) {
        await exportMealToExcel(activeMeal, selectedTemplate);
      }
      onClose();
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Excel dosyası indirilirken bir hata oluştu.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePrint = () => {
    onPrintWithTemplate(selectedTemplate);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet className="text-accent" size={22} />
          <span>{t('meals.selectExportTemplate', 'Yemek Hesabı Rapor Şablonunu Seçin')}</span>
        </div>
      }
      width="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Informative Banner */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          💡 <strong>Tüm şablonlar Türkçe ve Arapça (TR/AR) çift dilli olarak tasarlanmıştır.</strong> Müşterinize veya acentanıza en uygun formatı seçip indirebilirsiniz.
        </div>

        {/* Template Cards Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {templates.map(tpl => {
            const Icon = tpl.icon;
            const isSelected = selectedTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid ${tpl.accentColor}` : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 12px ${tpl.accentColor}33` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    backgroundColor: `${tpl.accentColor}1A`, color: tpl.accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={20} />
                  </div>
                  {isSelected && (
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      backgroundColor: tpl.accentColor, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Check size={14} />
                    </div>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px', color: 'var(--text-primary)' }}>
                  {tpl.titleTr}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', direction: 'rtl' }}>
                  {tpl.titleAr}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {tpl.descTr}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justify: 'flex-end',
          gap: '12px',
          marginTop: '10px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isExportingExcel}>
            İptal
          </button>
          
          <button className="btn btn-secondary" onClick={handlePrint} disabled={isExportingExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} />
            PDF / Yazdır
          </button>

          <button className="btn btn-primary" onClick={handleExcelExport} disabled={isExportingExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} />
            {isExportingExcel ? 'Hazırlanıyor...' : 'Excel İndir (.xlsx)'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
