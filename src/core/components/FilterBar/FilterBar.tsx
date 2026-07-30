import { Search, Filter, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './FilterBar.css';

interface FilterBarProps {
  onSearch: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  children?: React.ReactNode; // For additional custom filters
  actionsRight?: React.ReactNode; // For additional buttons on the right
}

export function FilterBar({ onSearch, onAdd, addLabel, children, actionsRight }: FilterBarProps) {
  const { t } = useTranslation();
  
  const resolvedAddLabel = addLabel || t('common.addNew');

  return (
    <div className="filter-bar">
      <div className="filter-left">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={t('common.search')}
            onChange={(e) => onSearch(e.target.value)}
            className="filter-search-input"
          />
        </div>
        
        {children && (
          <div className="custom-filters">
            <Filter size={18} className="filter-icon" />
            {children}
          </div>
        )}
      </div>

      <div className="filter-right">
        {actionsRight}
        {onAdd && (
          <button className="btn-primary" onClick={onAdd}>
            <Plus size={18} />
            <span>{resolvedAddLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
