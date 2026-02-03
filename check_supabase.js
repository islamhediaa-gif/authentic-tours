const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function check() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase credentials missing');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Connected to Supabase');
  
  const { data: je, error: jeErr } = await supabase.from('journal_entries').select('count').eq('tenant_id', 'authentic');
  console.log('Journal Entries count in Supabase:', je, jeErr);
  
  const { data: jl, error: jlErr } = await supabase.from('journal_lines').select('count').eq('tenant_id', 'authentic');
  console.log('Journal Lines count in Supabase:', jl, jlErr);

  const { data: backup, error: bErr } = await supabase.from('user_backups').select('user_id, updated_at').eq('user_id', 'authentic');
  console.log('Backup info in Supabase:', backup, bErr);
}

check();
