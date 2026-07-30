export type AccountType = 'Banka' | 'Kasa';
export type Region = 'Türkiye' | 'Arabistan';
export type Currency = 'TRY' | 'USD' | 'EUR' | 'SAR';

export interface AccountRecord {
  id: string;
  name: string; // e.g., "Ziraat Bankası TR", "Arabistan Merkez Kasa"
  type: AccountType;
  region: Region;
  currency: Currency;
  balance: number;
  bankName?: string; // Optional if type is Kasa
  iban?: string; // Optional if type is Kasa
  accountNumber?: string;
  swiftCode?: string;
  status: 'active' | 'inactive';
}

export interface AccountGroup {
  id: string; // Used as a key, matches baseName
  baseName: string;
  type: AccountType;
  region: Region;
  status: 'active' | 'inactive';
  subAccounts: AccountRecord[];
  balances: Record<string, number>;
  bankName?: string;
  iban?: string;
  accountNumber?: string;
  swiftCode?: string;
}
