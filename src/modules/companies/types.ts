export type CompanyType = 'Müşteri' | 'Tedarikçi' | 'Personel';
export type Region = 'Türkiye' | 'Arabistan';

export interface CompanyRecord {
  id: string;
  name: string;
  type: CompanyType;
  region: Region;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  monthlySalary?: number;
  salaryDay?: number;
  balance: number; // Positive means they owe us (Alacak), Negative means we owe them (Borç)
  currency: 'TRY' | 'USD' | 'EUR' | 'SAR';
  status: 'active' | 'inactive';
  notes?: string;
}
