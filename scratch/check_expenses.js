import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%Ahmet Sudanlı%');
    
  if (companyData && companyData.length > 0) {
    const compId = companyData[0].id;
    const { data, error } = await supabase
      .from('expenses')
      .select('id, category, description, date, amount, paid_amount, payment_history')
      .eq('company_id', compId)
      .order('date', { ascending: true });
    
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
  }
}

check();
