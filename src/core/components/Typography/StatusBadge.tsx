import React from 'react';
import { useTranslation } from 'react-i18next';
import './Typography.css';

export type StatusType = 'completed' | 'pending' | 'overdue' | 'cancelled' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  children?: React.ReactNode;
}

export function StatusBadge({ status, label, children }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  const displayLabel = label || t(`common.${status}`, status.charAt(0).toUpperCase() + status.slice(1));
  const effectiveStatus = status === 'paid' as any ? 'completed' : status;
  
  return (
    <span className={`status-badge status-${effectiveStatus}`}>
      {displayLabel}
    </span>
  );
}
