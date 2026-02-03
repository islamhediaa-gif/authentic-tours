
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TENANT_ID = 'authentic';

async function wipe() {
    console.log(`[WIPE] Wiping data for tenant: ${TENANT_ID}`);
    const tables = [
      'transactions', 'journal_lines', 'journal_entries', 'customers', 
      'suppliers', 'partners', 'employees', 'treasuries', 'currencies', 
      'cost_centers', 'departments', 'designations', 'attendance_logs', 
      'shifts', 'employee_leaves', 'employee_allowances', 
      'employee_documents', 'audit_logs', 'tenant_settings'
    ];

    for (const table of tables) {
        process.stdout.write(`Cleaning ${table}... `);
        const { error } = await supabase.from(table).delete().eq('tenant_id', TENANT_ID);
        if (error) {
            console.log(`❌ ${error.message}`);
        } else {
            console.log(`✅`);
        }
    }
}

async function run() {
    await wipe();
    console.log("\n[MIGRATE] Starting fresh migration...");
    const { execSync } = require('child_process');
    try {
        execSync('node migrate_to_relational.js', { stdio: 'inherit' });
        console.log("\n[SUCCESS] Full repair and migration completed.");
    } catch (err) {
        console.error("\n[ERROR] Migration failed.");
    }
}

run();
