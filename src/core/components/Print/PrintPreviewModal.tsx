import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal/Modal';
import { Printer } from 'lucide-react';
import { OfficialPrintDocument, type OfficialPrintDocumentProps } from './OfficialPrintDocument';

type PrintPreviewModalProps<T> = Partial<OfficialPrintDocumentProps<T>> & {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  previewChildren?: React.ReactNode;
};

export function PrintPreviewModal<T extends { id?: string | number }>({
  isOpen,
  onClose,
  children,
  previewChildren,
  ...printProps
}: PrintPreviewModalProps<T>) {
  const { t } = useTranslation();
  
  const hasProps = printProps && printProps.columns && printProps.data;
  
  return (
    <>
      {children ? children : (
        hasProps && <OfficialPrintDocument {...(printProps as OfficialPrintDocumentProps<T>)} />
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('print.previewTitle', 'Fatura / Çıktı Önizleme')}
        width="1000px"
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={() => window.print()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} />
            {t('common.print', 'Yazdır')}
          </button>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
          {previewChildren ? previewChildren : (
            hasProps && <OfficialPrintDocument previewMode={true} {...(printProps as OfficialPrintDocumentProps<T>)} />
          )}
        </div>
      </Modal>
    </>
  );
}
