import { useState, useEffect } from 'react';

const DEFAULT_INCOME_CATEGORIES = [
  'Catering (Kahvaltı/Akşam Yemeği)',
  'Catering (Kahvaltı)',
  'Catering (Akşam Yemeği)',
  'Kira (Ev)',
  'Kira (Dükkan)',
  'Diğer'
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Tediye (Ödeme Yapma)',
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
        parsed = parsed.filter((c: string) => !c.toLowerCase().includes('tahsilat'));
        
        // Ensure Catering (Kahvaltı/Akşam Yemeği) is at the top if missing
        if (!parsed.includes('Catering (Kahvaltı/Akşam Yemeği)')) {
          parsed.unshift('Catering (Kahvaltı/Akşam Yemeği)');
        }
        
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
        
        // Filter out Avans and Maaş/Hak Ediş related categories
        parsed = parsed.filter((c: string) => {
          const lower = c.toLowerCase();
          return !lower.includes('avans') && !lower.includes('maaş') && !lower.includes('hak ediş');
        });
        
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
