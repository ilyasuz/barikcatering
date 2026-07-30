import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('income')
    .select('id, title, company_id');
    
  const rfms = data.filter(d => d.title && d.title.toUpperCase().includes('RFM'));
  console.log("ALL INCOMES WITH RFM:");
  rfms.forEach(d => console.log(`id: ${d.id}, title: "${d.title}", companyId: ${d.company_id}`));
}

check();
