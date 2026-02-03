
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
    const tables = [
        'users', 'currencies', 'customers', 'suppliers', 
        'treasuries', 'employees', 'transactions', 
        'journal_entries', 'journal_lines', 'audit_logs',
        'user_backups', 'partners', 'cost_centers', 'departments',
        'designations', 'attendance_logs', 'shifts', 'employee_leaves',
        'employee_allowances', 'employee_documents', 'tenant_settings',
        'master_trips'
    ];

    console.log("Checking tables in Supabase...");
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table '${table}' error: ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`✅ Table '${table}' exists.`);
        }
    }
}

checkTables();
