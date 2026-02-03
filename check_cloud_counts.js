const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rzjjmacmwocusqeoyyhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tenantId = 'authentic';

async function checkCounts() {
    const { count: txCount, error: txError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    const { count: jeCount, error: jeError } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    if (txError) console.error('TX Error:', txError);
    if (jeError) console.error('JE Error:', jeError);

    console.log('Cloud Transactions:', txCount);
    console.log('Cloud Journal Entries:', jeCount);
}

checkCounts();
