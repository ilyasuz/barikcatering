const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const lines = envStr.split('\n');
const urlLine = lines.find(l => l.startsWith('VITE_SUPABASE_URL='));
const keyLine = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='));

const url = urlLine.split('=')[1].replace(/"/g, '').trim();
const key = keyLine.split('=')[1].replace(/"/g, '').trim();

const supabase = createClient(url, key);

async function run() {
  const { data: expenses } = await supabase.from('expenses').select('id, title, payer, payee, description').eq('title', 'Gider').limit(5);
  console.log('--- Bad Expenses ---');
  console.table(expenses);

  const { data: incomes } = await supabase.from('income').select('id, title, payer, payee, description').eq('title', 'Gelir').limit(5);
  console.log('--- Bad Incomes ---');
  console.table(incomes);
}
run();
