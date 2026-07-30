import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('meal_calculations').select('*');
  console.log('FETCH ERROR:', error);
  console.log('FETCH DATA COUNT:', data ? data.length : 0);
  console.log('DATA:', data);
}
test();
