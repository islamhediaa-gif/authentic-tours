
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function c() {
    const t = ['customers', 'suppliers', 'transactions', 'journal_entries', 'journal_lines'];
    for(const n of t) {
        const {count} = await supabase.from(n).select('*', {count:'exact', head:true}).eq('tenant_id', 'authentic');
        console.log(n + ': ' + count);
    }
}
c();
