
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKUP_FILE = 'Backup_Nebras_2026-01-28 (4).json';
const TENANT_ID = 'authentic';

async function verify() {
    console.log("--- Local JSON Analysis ---");
    const db = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    
    const localCounts = {
        users: db.users?.length || 0,
        customers: db.customers?.length || 0,
        suppliers: db.suppliers?.length || 0,
        transactions: db.transactions?.length || 0,
        journalEntries: db.journalEntries?.length || 0,
        journalLines: db.journalEntries?.reduce((sum, e) => sum + (e.lines?.length || 0), 0) || 0,
        partners: db.partners?.length || 0,
        employees: db.employees?.length || 0,
        treasuries: db.treasuries?.length || 0
    };
    console.table(localCounts);

    // Calculate P&L from JSON (Simplified matching useReportData logic)
    let localFlightRev = 0;
    let localHajjRev = 0;
    db.journalEntries?.forEach(e => {
        if (e.date >= '2025-12-31' && e.date <= '2026-01-28') {
            e.lines?.forEach(l => {
                if (l.accountId === 'FLIGHT_REVENUE') localFlightRev += (l.credit - l.debit);
                if (l.accountId === 'HAJJ_UMRAH_REVENUE') localHajjRev += (l.credit - l.debit);
            });
        }
    });
    console.log(`Local Flight Rev: ${localFlightRev.toFixed(2)}`);
    console.log(`Local Hajj Rev: ${localHajjRev.toFixed(2)}`);

    console.log("\n--- Cloud Data Analysis ---");
    const cloudCounts = {};
    const tables = ['users', 'customers', 'suppliers', 'transactions', 'journal_entries', 'journal_lines', 'partners', 'employees', 'treasuries'];
    
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('tenant_id', table === 'users' ? 'authentic' : TENANT_ID);
        // Note: Users table might use id or tenant_id differently depending on schema
        cloudCounts[table] = count || 0;
    }
    
    // Specifically for users, check tenant_id if it exists
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
    cloudCounts['users'] = userCount || 0;

    console.table(cloudCounts);

    console.log("\n--- Comparison ---");
    let match = true;
    for (const key in localCounts) {
        const cloudKey = key === 'journalEntries' ? 'journal_entries' : key === 'journalLines' ? 'journal_lines' : key;
        if (localCounts[key] !== cloudCounts[cloudKey]) {
            console.log(`❌ Mismatch in ${key}: Local=${localCounts[key]}, Cloud=${cloudCounts[cloudKey]}`);
            match = false;
        } else {
            console.log(`✅ ${key} matches (${localCounts[key]})`);
        }
    }

    if (match) {
        console.log("\n✨ All record counts match perfectly!");
    } else {
        console.log("\n⚠️ Discrepancies found. A fresh migration (full_repair.js) is recommended after schema update.");
    }
}

verify();
