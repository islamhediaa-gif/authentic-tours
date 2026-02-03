
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = 'authentic';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanData() {
    console.log(`Cleaning data for tenant: ${TENANT_ID}`);
    
    // Delete journal lines first (foreign key)
    const { error: err1 } = await supabase
        .from('journal_lines')
        .delete()
        .eq('tenant_id', TENANT_ID);
    
    if (err1) console.error("Error deleting journal lines:", err1.message);
    else console.log("Deleted journal lines.");

    // Delete journal entries
    const { error: err2 } = await supabase
        .from('journal_entries')
        .delete()
        .eq('tenant_id', TENANT_ID);
    
    if (err2) console.error("Error deleting journal entries:", err2.message);
    else console.log("Deleted journal entries.");
}

cleanData();
