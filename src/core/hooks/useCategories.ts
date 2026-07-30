import { useState, useEffect } from 'react';

const DEFAULT_INCOME_CATEGORIES = [
  'Catering (Kahvaltı)',
  'Catering (Akşam Yemeği)',
  'Kira (Ev)',
  'Kira (Dükkan)',
  'Diğer'
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Tediye (Ödeme Yapma)',
  'Maaş Tahakkuku (Hak Ediş)',
  'Personel Maaşı',
  'Mutfak/Erzak',
  'Araç/Yakıt',
  'Toptancı / Hal',
  'Genel Gider / Fatura',
  'Resmi İşlem / Harç',
  'Kira (Dükkan/Ofis)',
  'Vergi/SGK',
  'Diğer'
];

export function useCategories() {
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);

  useEffect(() => {
    const storedIncome = localStorage.getItem('barik_income_categories');
    const storedExpense = localStorage.getItem('barik_expense_categories');

    if (storedIncome) {
      try {
        let parsed = JSON.parse(storedIncome);
        // Filter out the requested removals
        parsed = parsed.filter((c: string) => !c.toLowerCase().includes('tahsilat'));
        
        // Deduplicate case-insensitively
        const unique: string[] = [];
        const seen = new Set();
        parsed.forEach((c: string) => {
          const lower = c.trim().toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            unique.push(c.trim());
          }
        });
        setIncomeCategories(unique);
        localStorage.setItem('barik_income_categories', JSON.stringify(unique));
      } catch {
        setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
      }
    } else {
      setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
      localStorage.setItem('barik_income_categories', JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    }

    if (storedExpense) {
      try {
        let parsed = JSON.parse(storedExpense);
        
        // Map old incorrectly spelled defaults to new ones
        parsed = parsed.map((c: string) => {
          if (c === 'Personel Maaş' || c === 'Personel Ödemesi / Avans' || c === 'Personel Avans/Ödeme' || c === 'Personel Avans') return 'Personel Maaşı';
          if (c === 'Personel Maaş Hak Edişi') return 'Maaş Tahakkuku (Hak Ediş)';
          return c;
        });

        // Remove any Avans related categories from dropdown
        parsed = parsed.filter((c: string) => !c.toLowerCase().includes('avans'));
        
        const unique: string[] = [];
        const seen = new Set();
        parsed.forEach((c: string) => {
          const lower = c.trim().toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            unique.push(c.trim());
          }
        });
        
        setExpenseCategories(unique);
        localStorage.setItem('barik_expense_categories', JSON.stringify(unique));
      } catch {
        setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      }
    } else {
      setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      localStorage.setItem('barik_expense_categories', JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
    }
  }, []);

  const addIncomeCategory = (category: string) => {
    if (!category || incomeCategories.includes(category)) return false;
    const newCats = [...incomeCategories, category];
    setIncomeCategories(newCats);
    localStorage.setItem('barik_income_categories', JSON.stringify(newCats));
    return true;
  };

  const removeIncomeCategory = (category: string) => {
    const newCats = incomeCategories.filter(c => c !== category);
    setIncomeCategories(newCats);
    localStorage.setItem('barik_income_categories', JSON.stringify(newCats));
  };

  const addExpenseCategory = (category: string) => {
    if (!category || expenseCategories.includes(category)) return false;
    const newCats = [...expenseCategories, category];
    setExpenseCategories(newCats);
    localStorage.setItem('barik_expense_categories', JSON.stringify(newCats));
    return true;
  };

  const removeExpenseCategory = (category: string) => {
    const newCats = expenseCategories.filter(c => c !== category);
    setExpenseCategories(newCats);
    localStorage.setItem('barik_expense_categories', JSON.stringify(newCats));
  };

  const reorderIncomeCategories = (newOrder: string[]) => {
    setIncomeCategories(newOrder);
    localStorage.setItem('barik_income_categories', JSON.stringify(newOrder));
  };

  const reorderExpenseCategories = (newOrder: string[]) => {
    setExpenseCategories(newOrder);
    localStorage.setItem('barik_expense_categories', JSON.stringify(newOrder));
  };

  const ensureDigerAtBottom = (cats: string[]) => {
    if (!cats.includes('Diğer')) return cats;
    return [...cats.filter(c => c !== 'Diğer'), 'Diğer'];
  };

  return {
    incomeCategories: ensureDigerAtBottom(incomeCategories),
    expenseCategories: ensureDigerAtBottom(expenseCategories),
    addIncomeCategory,
    removeIncomeCategory,
    addExpenseCategory,
    removeExpenseCategory,
    reorderIncomeCategories,
    reorderExpenseCategories
  };
}
