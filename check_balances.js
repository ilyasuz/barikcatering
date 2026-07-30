import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: accounts } = await supabase.from('accounts').select('*');
  console.log("Accounts:");
  accounts.forEach(a => console.log(a.name, a.currency, a.balance));
}
check();
