import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  console.log("Fetching all expenses...");
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .in('category', ['Personel Maaş Hak Edişi', 'Maaş Tahakkuku (Hak Ediş)']);

  if (error) {
    console.error(error);
    return;
  }

  const seen = new Set();
  const toDelete = [];

  for (const exp of data) {
    // Unique key per company per month
    const month = new Date(exp.date).toISOString().slice(0, 7); // YYYY-MM
    const key = `${exp.company_id}-${month}`;
    
    if (seen.has(key)) {
      toDelete.push(exp.id);
    } else {
      seen.add(key);
    }
  }

  console.log(`Found ${toDelete.length} duplicates to delete.`);
  
  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from('expenses')
      .delete()
      .in('id', toDelete);
      
    if (delError) {
      console.error("Delete error:", delError);
    } else {
      console.log("Successfully deleted duplicates.");
    }
  }
}

clean();
