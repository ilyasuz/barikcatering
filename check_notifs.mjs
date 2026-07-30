import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zbvaocmbnghergxruqgq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpidmFvY21ibmdoZXJneHJ1cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MTU1MTEsImV4cCI6MjEwMDI5MTUxMX0.Y51ROuoUU5uRelVhyh6tbjG1gaGoCfeXS6skywP98QI'
);

async function run() {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
