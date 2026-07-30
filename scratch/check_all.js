import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: iData } = await supabase.from('income').select('*');
  const { data: eData } = await supabase.from('expenses').select('*');
  const { data: cData } = await supabase.from('companies').select('*');
    
  console.log("INCOMES with RFM:");
  iData.filter(d => (d.title||'').toUpperCase().includes('RFM') || (d.description||'').toUpperCase().includes('RFM') || (d.company_id && cData.find(c => c.id === d.company_id)?.name.toUpperCase().includes('RFM')))
       .forEach(d => console.log(`id: ${d.id}, title: "${d.title}", region: "${d.region}"`));
       
  console.log("EXPENSES with RFM:");
  eData.filter(d => (d.title||'').toUpperCase().includes('RFM') || (d.description||'').toUpperCase().includes('RFM') || (d.company_id && cData.find(c => c.id === d.company_id)?.name.toUpperCase().includes('RFM')))
       .forEach(d => console.log(`id: ${d.id}, title: "${d.title}", region: "${d.region}"`));
}

check();
