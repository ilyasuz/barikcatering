import { supabase } from '../../lib/supabase';
import type { IncomeRecord } from './types';

function mapToDB(income: Partial<IncomeRecord>) {
  return {
    title: income.companyName || income.payer || income.description || 'Gelir',
    amount: income.amount,
    paid_amount: income.paidAmount,
    currency: income.currency,
    category: income.category,
    date: income.date,
    due_date: income.dueDate || null,
    status: income.status,
    payment_method: income.paymentMethod || 'cash',
    payment_history: income.paymentHistory || [],
    account_id: income.accountId || null,
    company_id: income.companyId || null,
    payer: income.payer,
    payee: income.payee,
    invoice_no: income.invoiceNo,
    description: income.description,
    region: income.region,
    usd_rate: income.usd_rate,
    created_by: income.createdBy || localStorage.getItem('currentUser') || 'Sistem',
    attachments: income.attachments,
    has_attachment: income.hasAttachment,
    is_recurring: income.isRecurring,
    recurring_interval: income.recurringInterval
  };
}

function mapFromDB(record: any): IncomeRecord {
  return {
    id: record.id,
    systemNo: record.system_no,
    invoiceNo: record.invoice_no || '',
    date: record.date || '',
    dueDate: record.due_date || '', // Eğer db'de due_date yoksa boş bırakıyoruz, date'e eşitlemek yanıltıcı oluyor.
    companyId: record.company_id,
    companyName: record.title || 'Bilinmiyor', // DB'deki title alan companyName'e denk geliyor
    payer: record.payer,
    payee: record.payee,
    description: record.description || '',
    amount: Number(record.amount) || 0,
    paidAmount: record.paid_amount !== undefined ? Number(record.paid_amount) : (Number(record.amount) || 0),
    currency: (record.currency as any) || 'TRY',
    status: (record.status as any) || 'pending',
    paymentMethod: record.payment_method as any,
    paymentHistory: Array.isArray(record.payment_history) ? record.payment_history : [],
    accountId: record.account_id,
    category: record.category as any,
    region: record.region as any,
    usd_rate: record.usd_rate !== undefined ? Number(record.usd_rate) : undefined,
    createdBy: record.created_by,
    createdAt: record.created_at,
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    hasAttachment: record.has_attachment || false,
    isRecurring: record.is_recurring || false,
    recurringInterval: record.recurring_interval
  };
}

export const incomeApi = {
  async getAll(): Promise<IncomeRecord[]> {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching income:', error);
      return [];
    }
    return (data || []).map(mapFromDB);
  },

  async create(income: Partial<IncomeRecord>): Promise<IncomeRecord | null> {
    const dbRecord = mapToDB(income);
    const { data, error } = await supabase
      .from('income')
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating income:', error);
      return null;
    }
    return mapFromDB(data);
  },

  async update(id: string, updates: Partial<IncomeRecord>): Promise<IncomeRecord | null> {
    const dbRecord = mapToDB(updates);
    Object.keys(dbRecord).forEach(key => {
      if ((dbRecord as any)[key] === undefined) {
        delete (dbRecord as any)[key];
      }
    });

    const { data, error } = await supabase
      .from('income')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating income:', error);
      return null;
    }
    return mapFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting income:', error);
      return false;
    }
    return true;
  },

  async deleteMultiple(ids: string[]): Promise<boolean> {
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('income')
        .delete()
        .in('id', batch);

      if (error) {
        console.error('Error deleting multiple incomes:', error);
        return false;
      }
    }
    return true;
  }
};
