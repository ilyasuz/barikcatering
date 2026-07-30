import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import './Dialog.css';

export type DialogType = 'info' | 'warning' | 'danger' | 'success';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  message?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

const typeConfig = {
  info: { icon: Info, color: '#3b82f6' },
  warning: { icon: AlertTriangle, color: '#f59e0b' },
  danger: { icon: AlertTriangle, color: '#ef4444' },
  success: { icon: CheckCircle, color: '#10b981' }
};

export function Dialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  type = 'info',
  confirmText,
  cancelText
}: DialogProps) {
  const { t } = useTranslation();
  const [isRendered, setIsRendered] = useState(isOpen);

  const resolvedConfirmText = confirmText || t('common.confirm', 'Onayla');
  const resolvedCancelText = cancelText || t('common.cancel', 'İptal');

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsRendered(false);
        document.body.style.overflow = '';
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const Icon = typeConfig[type].icon;

  return (
    <div className={`dialog-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className={`dialog-content ${isOpen ? 'open' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="dialog-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
        
        <div className="dialog-header">
          <div className={`dialog-icon-wrapper type-${type}`}>
            <Icon size={24} color={typeConfig[type].color} />
          </div>
          <h2 className="dialog-title">{title}</h2>
        </div>
        
        <div className="dialog-body">
          <p>{description}</p>
        </div>
        
        <div className="dialog-footer">
          <button className="dialog-btn btn-cancel" onClick={onClose}>
            {resolvedCancelText}
          </button>
          <button 
            className={`dialog-btn btn-confirm type-${type}`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
