
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = 'authentic';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDates() {
    const { data, error } = await supabase
        .from('journal_entries')
        .select('date')
        .eq('tenant_id', TENANT_ID)
        .order('date', { ascending: true });

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (data.length === 0) {
        console.log("No data found");
        return;
    }

    console.log(`First date: ${data[0].date}`);
    console.log(`Last date: ${data[data.length - 1].date}`);
    console.log(`Total entries: ${data.length}`);
    
    const targetPeriod = data.filter(d => d.date >= '2025-12-31' && d.date <= '2026-01-28');
    console.log(`Entries in target period: ${targetPeriod.length}`);
}

checkDates();
