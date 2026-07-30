import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('income')
    .select('id, title, company_id')
    .ilike('title', '%RFM%');
    
  console.log("Incomes with RFM:");
  console.log(data);

  const { data: cData, error: cError } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%RFM%');
    
  console.log("Companies with RFM:");
  console.log(cData);
}

check();
