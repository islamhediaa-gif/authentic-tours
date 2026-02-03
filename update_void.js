
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function updateTransaction() {
    console.log('Updating transaction 1768576135774 to is_voided = true...');
    const { error } = await supabase
        .from('transactions')
        .update({ is_voided: true })
        .eq('id', '1768576135774');

    if (error) {
        console.error('Update failed:', error.message);
    } else {
        console.log('✅ Transaction successfully updated to true.');
    }
}

updateTransaction();
