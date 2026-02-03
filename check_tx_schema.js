
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }
    
    if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No transactions found");
    }
}

checkSchema();
