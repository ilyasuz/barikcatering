import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBalances() {
  const { data: accounts } = await supabase.from('accounts').select('*');
  
  for (const acc of accounts) {
    const { data: incs } = await supabase.from('income').select('amount').eq('account_id', acc.id);
    const { data: exps } = await supabase.from('expenses').select('amount').eq('account_id', acc.id);
    
    let total = 0;
    if (incs) {
      incs.forEach(i => total += Number(i.amount));
    }
    if (exps) {
      exps.forEach(e => total -= Number(e.amount));
    }
    
    // update balance
    console.log(`Setting ${acc.name} to ${total}`);
    await supabase.from('accounts').update({ balance: total }).eq('id', acc.id);
  }
}
fixBalances();
