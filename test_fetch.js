const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('currencies').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data[0], null, 2));
    }
}
test();
