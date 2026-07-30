import type { StatusType } from '../../core/components/Typography/StatusBadge';

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'check';
export type ExpenseCategory = 'Personel Maaşı' | 'Personel Maaş Hak Edişi' | 'Mutfak/Erzak' | 'Araç/Yakıt' | 'Kira (Dükkan/Ofis)' | 'Vergi/SGK' | 'Toptancı / Hal' | 'Genel Gider / Fatura' | 'Resmi İşlem / Harç' | 'Tediye (Ödeme Yapma)' | 'Diğer' | string;

export interface PaymentHistoryEntry {
  date: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  accountId?: string;
}

export interface ExpenseRecord {
  id: string;
  systemNo?: string;
  invoiceNo: string; // Belge/Fatura No
  date: string; // İşlem Tarihi
  dueDate: string; // Son Ödeme Tarihi
  companyId?: string; // Veritabanındaki company_id ile eşleşir
  supplierName: string; // Tedarikçi / Personel / Kurum Adı
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
  category?: ExpenseCategory;
  attachments?: string[];
  hasAttachment?: boolean;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'yearly' | 'weekly';
  region?: 'Türkiye' | 'Arabistan';
  createdBy?: string;
  createdAt?: string;
}
