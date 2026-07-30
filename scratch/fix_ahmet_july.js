import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fix() {
  const { data: companyData } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', '%Ahmet Sudanlı%');
    
  if (!companyData || companyData.length === 0) return;
  const compId = companyData[0].id;
  
  // Find July salary invoice
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('company_id', compId)
    .gte('date', '2026-07-01')
    .lte('date', '2026-07-31');
    
  const salaryRow = expenses.find(e => (e.category || '').toLowerCase().includes('maaş'));
  const avansRows = expenses.filter(e => (e.category || '').toLowerCase().includes('avans') && e.id !== salaryRow?.id);
  
  if (salaryRow && avansRows.length > 0) {
    let totalAvans = 0;
    const history = salaryRow.payment_history || [];
    
    for (const avans of avansRows) {
      totalAvans += avans.amount;
      history.push({
        date: avans.date,
        amount: avans.amount,
        method: 'Nakit',
        notes: 'Personel Avans / Ödeme'
      });
    }
    
    // Update salary row
    await supabase.from('expenses').update({
      paid_amount: (salaryRow.paid_amount || 0) + totalAvans,
      payment_history: history,
      status: ((salaryRow.paid_amount || 0) + totalAvans >= salaryRow.amount) ? 'completed' : 'pending'
    }).eq('id', salaryRow.id);
    
    // Delete avans rows
    for (const avans of avansRows) {
      await supabase.from('expenses').delete().eq('id', avans.id);
    }
    console.log(`Merged ${totalAvans} into salary ${salaryRow.id} and deleted ${avansRows.length} avans rows.`);
  } else {
    console.log('No matching rows found.');
  }
}

fix();
