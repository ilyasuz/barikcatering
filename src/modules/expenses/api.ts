import { supabase } from '../../lib/supabase';
import type { ExpenseRecord } from './types';

function mapToDB(expense: Partial<ExpenseRecord>) {
  return {
    title: expense.supplierName || expense.payee || expense.description || 'Gider', // DB'de title zorunlu, supplierName'i title olarak kaydediyoruz
    amount: expense.amount,
    paid_amount: expense.paidAmount,
    currency: expense.currency,
    category: expense.category,
    date: expense.date,
    due_date: expense.dueDate || null,
    status: expense.status,
    payment_method: expense.paymentMethod || 'cash',
    payment_history: expense.paymentHistory || [],
    account_id: expense.accountId || null,
    company_id: expense.companyId || null,
    payer: expense.payer,
    payee: expense.payee,
    receipt_no: expense.invoiceNo,
    description: expense.description,
    region: expense.region,
    usd_rate: expense.usd_rate,
    created_by: expense.createdBy || localStorage.getItem('currentUser') || 'Sistem',
    attachments: expense.attachments,
    has_attachment: expense.hasAttachment,
    is_recurring: expense.isRecurring,
    recurring_interval: expense.recurringInterval
  };
}

function mapFromDB(record: any): ExpenseRecord {
  return {
    id: record.id,
    systemNo: record.system_no,
    invoiceNo: record.receipt_no || '',
    date: record.date || '',
    dueDate: record.due_date || '',
    companyId: record.company_id,
    supplierName: record.title || 'Bilinmiyor', 
    payer: record.payer,
    payee: record.payee,
    description: record.description || '',
    amount: Number(record.amount) || 0,
    paidAmount: Number(record.paid_amount) || 0,
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

export const expensesApi = {
  async getAll(): Promise<ExpenseRecord[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
    return (data || []).map(mapFromDB);
  },

  async create(expense: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> {
    const dbRecord = mapToDB(expense);
    const { data, error } = await supabase
      .from('expenses')
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return null;
    }
    return mapFromDB(data);
  },

  async update(id: string, updates: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> {
    const dbRecord = mapToDB(updates);
    Object.keys(dbRecord).forEach(key => {
      if ((dbRecord as any)[key] === undefined) {
        delete (dbRecord as any)[key];
      }
    });

    const { data, error } = await supabase
      .from('expenses')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return null;
    }
    return mapFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
    return true;
  },

  async deleteMultiple(ids: string[]): Promise<boolean> {
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', batch);

      if (error) {
        console.error('Error deleting multiple expenses:', error);
        return false;
      }
    }
    return true;
  }
};
