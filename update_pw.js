import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePw() {
  const password = '123';
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  const { data, error } = await supabase.from('app_users').update({ password: hash }).eq('email', 'maliberik@barik.com');
  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('Password updated successfully.');
  }
}

updatePw();
