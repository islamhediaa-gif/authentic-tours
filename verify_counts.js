
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = 'authentic';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyCounts() {
    console.log(`Verifying counts for tenant: ${TENANT_ID}`);
    const tables = [
        'transactions', 
        'journal_entries', 
        'journal_lines'
    ];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', TENANT_ID);
        
        if (error) {
            console.error(`Error counting ${table}:`, error.message);
        } else {
            console.log(`${table}: ${count}`);
        }
    }
}

verifyCounts();
