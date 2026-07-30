const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const lines = envStr.split('\n');
const urlLine = lines.find(l => l.startsWith('VITE_SUPABASE_URL='));
const keyLine = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='));

const url = urlLine.split('=')[1].replace(/"/g, '').trim();
const key = keyLine.split('=')[1].replace(/"/g, '').trim();

const supabase = createClient(url, key);

async function fix() {
  console.log('Fixing expenses...');
  const { data: expenses } = await supabase.from('expenses').select('id, payer, payee').eq('title', 'Gider');
  
  if (expenses) {
    for (const exp of expenses) {
      const newTitle = exp.payee || exp.payer || 'Gider';
      if (newTitle !== 'Gider') {
        await supabase.from('expenses').update({ title: newTitle }).eq('id', exp.id);
      }
    }
    console.log(`Fixed ${expenses.length} expenses.`);
  }

  console.log('Fixing incomes...');
  const { data: incomes } = await supabase.from('income').select('id, payer, payee').eq('title', 'Gelir');
  
  if (incomes) {
    for (const inc of incomes) {
      const newTitle = inc.payer || inc.payee || 'Gelir';
      if (newTitle !== 'Gelir') {
        await supabase.from('income').update({ title: newTitle }).eq('id', inc.id);
      }
    }
    console.log(`Fixed ${incomes.length} incomes.`);
  }

  console.log('Done.');
}
fix();
