
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = 'authentic';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findMissing() {
    const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));
    const jsonIds = (data.journalEntries || []).map(e => e.id);
    
    const { data: cloudData, error } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('tenant_id', TENANT_ID);
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }
    
    const cloudIds = new Set(cloudData.map(e => e.id));
    const missing = jsonIds.filter(id => !cloudIds.has(id));
    
    console.log(`Total JSON Entries: ${jsonIds.length}`);
    console.log(`Unique JSON Entries: ${new Set(jsonIds).size}`);
    console.log(`Total Cloud Entries: ${cloudIds.size}`);
    console.log(`Missing in Cloud: ${missing.length}`);
    console.log(`First 5 missing: ${missing.slice(0, 5)}`);

    // Check one missing entry details
    if (missing.length > 0) {
        const entry = data.journalEntries.find(e => e.id === missing[0]);
        console.log("Missing Entry Sample:", JSON.stringify(entry, null, 2));
    }
}

findMissing();
