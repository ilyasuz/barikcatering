import { supabase } from '../../lib/supabase';
import type { CompanyRecord } from './types';

// Yardımcı fonksiyonlar: camelCase <-> snake_case dönüşümü için
function mapToDB(company: Partial<CompanyRecord>) {
  return {
    name: company.name,
    type: company.type,
    region: company.region,
    currency: company.currency,
    status: company.status,
    balance: company.balance,
    email: company.email,
    phone: company.phone,
    tax_office: company.taxOffice,
    tax_number: company.taxNumber,
    address: company.address,
    notes: company.notes,
    monthly_salary: company.monthlySalary,
    salary_day: company.salaryDay,
    // contact_person: company.contactPerson // YAKINDA EKLENECEK
  };
}

function mapFromDB(record: any): CompanyRecord {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    region: record.region,
    currency: record.currency,
    status: record.status,
    balance: Number(record.balance),
    email: record.email,
    phone: record.phone,
    taxOffice: record.tax_office,
    taxNumber: record.tax_number,
    address: record.address,
    notes: record.notes,
    monthlySalary: record.monthly_salary ? Number(record.monthly_salary) : undefined,
    salaryDay: record.salary_day ? Number(record.salary_day) : undefined,
    // contactPerson: record.contact_person // YAKINDA EKLENECEK
  };
}

export const companiesApi = {
  async getAll(): Promise<CompanyRecord[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      return [];
    }

    return (data || []).map(mapFromDB);
  },

  async getById(id: string): Promise<CompanyRecord | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }
    return mapFromDB(data);
  },

  async create(company: Partial<CompanyRecord>): Promise<CompanyRecord | null> {
    const dbRecord = mapToDB(company);
    const { data, error } = await supabase
      .from('companies')
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return null;
    }

    return mapFromDB(data);
  },

  async update(id: string, updates: Partial<CompanyRecord>): Promise<CompanyRecord | null> {
    const dbRecord = mapToDB(updates);
    // Remove undefined values
    Object.keys(dbRecord).forEach(key => {
      if ((dbRecord as any)[key] === undefined) {
        delete (dbRecord as any)[key];
      }
    });

    const { data, error } = await supabase
      .from('companies')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return null;
    }

    return mapFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      return false;
    }

    return true;
  },

  async deleteMultiple(ids: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting multiple companies:', error);
      return false;
    }

    return true;
  }
};
