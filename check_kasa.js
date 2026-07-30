import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: accounts } = await supabase.from('accounts').select('*').like('name', 'Barik Catering Ofis%');
  
  for (const acc of accounts) {
    console.log(`\nAccount: ${acc.name} (${acc.currency}) | Balance: ${acc.balance}`);
    
    const { data: incs } = await supabase.from('incomes').select('*').eq('account_id', acc.id);
    const { data: exps } = await supabase.from('expenses').select('*').eq('account_id', acc.id);
    
    let sumInc = 0;
    incs.forEach(i => sumInc += Number(i.amount));
    
    let sumExp = 0;
    exps.forEach(e => sumExp += Number(e.amount));
    
    console.log(`Incomes assigned: ${incs.length} | Sum: ${sumInc}`);
    console.log(`Expenses assigned: ${exps.length} | Sum: ${sumExp}`);
  }
}
check();
