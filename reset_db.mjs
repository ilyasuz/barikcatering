import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function resetDB() {
  const tables = ['income', 'expenses', 'transfers', 'accounts', 'companies', 'files']; 
  console.log('Veritabanı sıfırlama başlıyor...');

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows

    if (error) {
      console.error(`Hata (${table}):`, error);
    } else {
      console.log(`- ${table} tablosu temizlendi.`);
    }
  }

  console.log('Sıfırlama tamamlandı.');
}

resetDB();
