const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkColumns() {
    console.log("Checking columns in 'transactions'...");
    const { data, error } = await supabase.from('transactions').select('*').limit(1);
    if (error) {
        console.error("Error fetching transactions:", error.message);
    } else if (data && data.length > 0) {
        console.log("Available columns:", Object.keys(data[0]));
    } else {
        console.log("No data in transactions to check columns.");
    }
}

checkColumns();
