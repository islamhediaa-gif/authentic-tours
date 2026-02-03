
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = 'authentic';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectLines() {
    const { data, error } = await supabase
        .from('journal_lines')
        .select('account_id, account_name, account_type, credit, debit')
        .eq('tenant_id', TENANT_ID)
        .or('account_name.ilike.%عمرة%,account_name.ilike.%حج%,account_id.ilike.%HAJJ%,account_id.ilike.%UMRAH%')
        .limit(10);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.table(data);
}

inspectLines();
