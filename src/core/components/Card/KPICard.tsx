import type { ReactNode } from 'react';
import './Card.css';

interface KPICardProps {
  title: string;
  value: string | ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  icon?: ReactNode;
  className?: string;
  equivalentStr?: string;
  currencyBreakdown?: {
    USD?: number;
    SAR?: number;
    TRY?: number;
    EUR?: number;
  };
  children?: ReactNode;
}

export function KPICard({ title, value, trend, icon, className = '', equivalentStr, currencyBreakdown, children }: KPICardProps) {
  return (
    <div className={`core-card kpi-card ${className}`}>
      <div className="kpi-header">
        <h3 className="kpi-title">{title}</h3>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>
      
      <div className="kpi-value">{value}</div>
      
      {trend && (
        <div className={`kpi-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          <span className="trend-value">
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="trend-label">{trend.label}</span>
        </div>
      )}
      
      {equivalentStr && !currencyBreakdown && (
        <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, zIndex: 1 }}>
          {equivalentStr}
        </div>
      )}

      {currencyBreakdown && (
        <div className="kpi-breakdown">
          {currencyBreakdown.USD !== undefined && currencyBreakdown.USD !== 0 && (
            <span className="breakdown-item usd">
              ${currencyBreakdown.USD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          {currencyBreakdown.SAR !== undefined && currencyBreakdown.SAR !== 0 && (
            <span className="breakdown-item sar">
              {currencyBreakdown.SAR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
            </span>
          )}
          {currencyBreakdown.TRY !== undefined && currencyBreakdown.TRY !== 0 && (
            <span className="breakdown-item try">
              ₺{currencyBreakdown.TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          {currencyBreakdown.EUR !== undefined && currencyBreakdown.EUR !== 0 && (
            <span className="breakdown-item eur">
              €{currencyBreakdown.EUR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}
