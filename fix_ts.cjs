const fs = require('fs');

// Fix handleImport error in ExpensesPage
let expensesPage = fs.readFileSync('src/modules/expenses/pages/ExpensesPage.tsx', 'utf8');
expensesPage = expensesPage.replace(/onImport={handleImport}/g, 'onImport={handleImportSuccess}');
fs.writeFileSync('src/modules/expenses/pages/ExpensesPage.tsx', expensesPage);

// Remove 'title' from ExpenseTable/IncomeTable if it's there
let extTable = fs.readFileSync('src/modules/expenses/components/ExpenseTable.tsx', 'utf8');
extTable = extTable.replace(/title="[^"]*"/g, '');
fs.writeFileSync('src/modules/expenses/components/ExpenseTable.tsx', extTable);

let incTable = fs.readFileSync('src/modules/income/components/IncomeTable.tsx', 'utf8');
incTable = incTable.replace(/title="[^"]*"/g, '');
fs.writeFileSync('src/modules/income/components/IncomeTable.tsx', incTable);

// Fix ReactNode import in core components
['src/core/components/Card/KPICard.tsx', 'src/core/components/DataTable/DataTable.tsx', 'src/core/components/EmptyState/EmptyState.tsx'].forEach(f => {
  if(fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/import \{ ReactNode \}/g, 'import type { ReactNode }');
    content = content.replace(/import React, \{ ReactNode \}/g, 'import React, { type ReactNode }');
    fs.writeFileSync(f, content);
  }
});
