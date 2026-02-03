
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function countRows() {
    // Get tenant ID from a transaction
    const { data: tx } = await supabase.from('transactions').select('tenant_id').limit(1);
    if (!tx || tx.length === 0) {
        console.log("No transactions found.");
        return;
    }
    const tenantId = tx[0].tenant_id;
    console.log(`Tenant ID: ${tenantId}`);

    const tables = ['transactions', 'journal_entries', 'journal_lines'];
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);
        
        if (error) {
            console.log(`Error counting ${table}: ${error.message}`);
        } else {
            console.log(`${table}: ${count}`);
        }
    }
}

countRows();
