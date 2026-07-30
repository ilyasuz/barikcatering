import { supabase } from '../../lib/supabase';
import type { AccountRecord } from './types';

// Helper for snake_case <-> camelCase
function mapToDB(account: Partial<AccountRecord>) {
  return {
    name: account.name,
    type: account.type,
    region: account.region,
    currency: account.currency,
    balance: account.balance,
    bank_name: account.bankName,
    iban: account.iban,
    account_number: account.accountNumber,
    swift_code: account.swiftCode,
    status: account.status
  };
}

function mapFromDB(record: any): AccountRecord {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    region: record.region,
    currency: record.currency,
    balance: Number(record.balance),
    bankName: record.bank_name,
    iban: record.iban,
    accountNumber: record.account_number,
    swiftCode: record.swift_code,
    status: record.status
  };
}

export const accountsApi = {
  async getAll(): Promise<AccountRecord[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
    return (data || []).map(mapFromDB);
  },

  async create(account: Partial<AccountRecord>): Promise<AccountRecord | null> {
    const dbRecord = mapToDB(account);
    const { data, error } = await supabase
      .from('accounts')
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return null;
    }
    return mapFromDB(data);
  },

  async update(id: string, updates: Partial<AccountRecord>): Promise<AccountRecord | null> {
    const dbRecord = mapToDB(updates);
    Object.keys(dbRecord).forEach(key => {
      if ((dbRecord as any)[key] === undefined) {
        delete (dbRecord as any)[key];
      }
    });

    const { data, error } = await supabase
      .from('accounts')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating account:', error);
      return null;
    }
    return mapFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting account:', error);
      return false;
    }
    return true;
  },

  async deleteMultiple(ids: string[]): Promise<boolean> {
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('accounts')
        .delete()
        .in('id', batch);

      if (error) {
        console.error('Error deleting multiple accounts:', error);
        return false;
      }
    }
    return true;
  }
};
