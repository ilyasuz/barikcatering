import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('app_users').select('email, password').eq('email', 'maliberik@barik.com').single();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User data:', data);
  }
}

test();
