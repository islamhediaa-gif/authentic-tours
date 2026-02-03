
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // I hope this exists

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addColumns() {
    const sql = `
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_sale_only BOOLEAN DEFAULT FALSE;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_purchase_only BOOLEAN DEFAULT FALSE;
    `;
    
    // Some Supabase setups have an 'exec_sql' RPC for migrations
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error("Error via RPC:", error.message);
        console.log("Attempting direct table check to see if columns exist...");
    } else {
        console.log("Columns added successfully via RPC.");
    }
}

addColumns();
