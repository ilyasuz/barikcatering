import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './DataTable.css';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  className?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  pagination?: boolean;
  itemsPerPage?: number;
}

export function DataTable<T extends { id: string | number }>({ 
  columns, 
  data, 
  onRowClick,
  className = '',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  pagination = false,
  itemsPerPage = 15
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange(data.map(item => String(item.id)));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const displayData = pagination ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : data;
  
  return (
    <div className={`table-container ${className}`}>
      <table className="core-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="table-checkbox"
                />
              </th>
            )}
            {columns.map((col) => (
              <th 
                key={col.key} 
                style={{ 
                  textAlign: col.align || 'left',
                  width: col.width || 'auto'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="empty-cell">
                {t('common.noData', 'Veri bulunamadı')}
              </td>
            </tr>
          ) : (
            displayData.map((item) => {
              const itemId = String(item.id);
              const isSelected = selectedIds.includes(itemId);
              
              return (
                <tr 
                  key={itemId} 
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`${onRowClick ? 'clickable' : ''} ${isSelected ? 'selected-row' : ''}`}
                >
                  {selectable && (
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(itemId, e.target.checked)}
                        className="table-checkbox"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td 
                      key={`${itemId}-${col.key}`}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      
      {pagination && data.length > itemsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('common.pagination.showing')} {data.length} {t('common.pagination.recordsFrom')} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, data.length)}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              className="btn-secondary" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              style={{ padding: '4px 10px', fontSize: '13px' }}
            >
              {t('common.pagination.previous')}
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1)
              .map((page, idx, arr) => {
                const isEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                return (
                  <div key={page} style={{ display: 'flex' }}>
                    {isEllipsis && <span style={{ padding: '4px 8px', color: 'var(--text-muted)' }}>...</span>}
                    <button
                      className={currentPage === page ? "btn-primary" : "btn-secondary"}
                      onClick={() => setCurrentPage(page)}
                      style={{ padding: '4px 10px', fontSize: '13px', minWidth: '32px' }}
                    >
                      {page}
                    </button>
                  </div>
                );
            })}
            
            <button 
              className="btn-secondary" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              style={{ padding: '4px 10px', fontSize: '13px' }}
            >
              {t('common.pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
