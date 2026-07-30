import type { StatusType } from '../../core/components/Typography/StatusBadge';

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'check';
export type IncomeCategory = 'Catering' | 'Organizasyon' | 'Kira Geliri (Ev)' | 'Kira Geliri (Dükkan)' | 'Tahsilat (Ödeme Alma)' | 'Diğer';

export interface PaymentHistoryEntry {
  date: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  accountId?: string;
}

export interface IncomeRecord {
  id: string;
  systemNo?: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  companyId?: string;
  companyName: string;
  payer?: string;
  payee?: string;
  description: string;
  amount: number;
  paidAmount?: number;
  currency: 'TRY' | 'USD' | 'EUR' | 'SAR';
  usd_rate?: number;
  status: StatusType;
  paymentMethod?: PaymentMethod;
  paymentHistory?: PaymentHistoryEntry[];
  accountId?: string;
  account?: string;
  category?: IncomeCategory;
  attachments?: string[];
  hasAttachment?: boolean;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'yearly' | 'weekly';
  region?: 'Türkiye' | 'Arabistan';
  createdBy?: string;
  createdAt?: string;
}
