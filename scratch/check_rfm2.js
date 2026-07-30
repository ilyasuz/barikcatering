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
  data.forEach(d => console.log(`id: ${d.id}, title: "${d.title}"`));
}

check();
