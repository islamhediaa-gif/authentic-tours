
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectUserBackups() {
    const { data, error } = await supabase.from('user_backups').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Sample user_backup record:");
        console.log(JSON.stringify(data[0], (key, value) => key === 'data' ? '{...blob...}' : value, 2));
    }
}

inspectUserBackups();
