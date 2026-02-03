
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('tenant_id', 'authentic');
  const { count: jeCount } = await supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('tenant_id', 'authentic');
  console.log('Transactions in SQL:', txCount);
  console.log('Journal Entries in SQL:', jeCount);
}
check();
