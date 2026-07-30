import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Option<T extends string = string> {
  value: T;
  label: string;
}

interface SearchableSelectProps<T extends string = string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  hideSearch?: boolean;
}

export function SearchableSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
  style,
  className = '',
  hideSearch = false
}: SearchableSelectProps<T>) {
  const { t } = useTranslation();
  
  const resolvedPlaceholder = placeholder || t('common.select', 'Seçiniz...');
  const resolvedSearchPlaceholder = searchPlaceholder || t('common.search', 'Ara...');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div 
      ref={wrapperRef} 
      className={`searchable-select-wrapper ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <div 
        className={`form-control ${disabled ? 'disabled' : ''}`}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          minHeight: '36px',
          ...style
        }}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
      >
        <span style={{ 
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {selectedOption ? selectedOption.label : resolvedPlaceholder}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          minWidth: '220px',
          width: '100%',
          marginTop: '4px',
          backgroundColor: '#1E1E23', // Solid dark color instead of translucent
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {!hideSearch && (
            <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder={resolvedSearchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '32px', height: '32px', fontSize: '13px' }}
                autoFocus
              />
            </div>
          )}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: option.value === value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: option.value === value ? 'var(--accent)' : 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (option.value !== value) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (option.value !== value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {option.label}
                  {option.value === value && <Check size={14} color="var(--accent)" />}
                </div>
              ))
            ) : (
              <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                {t('common.noDataAvailable', 'Sonuç bulunamadı')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
