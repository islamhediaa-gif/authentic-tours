const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://rzjjmacmwocusqeoyyhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tenantId = 'authentic';

async function identifyMissing() {
    const localData = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
    const localTxIds = new Set(localData.transactions.map(t => t.id));
    const localJeIds = new Set(localData.journalEntries.map(j => j.id));

    console.log('Local TX Count:', localTxIds.size);
    console.log('Local JE Count:', localJeIds.size);

    // Fetch cloud IDs
    const { data: cloudTx, error: txError } = await supabase
        .from('transactions')
        .select('id')
        .eq('tenant_id', tenantId);

    const { data: cloudJe, error: jeError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('tenant_id', tenantId);

    if (txError) console.error('TX Error:', txError);
    if (jeError) console.error('JE Error:', jeError);

    const cloudTxIds = new Set(cloudTx.map(t => t.id));
    const cloudJeIds = new Set(cloudJe.map(j => j.id));

    console.log('Cloud TX Count:', cloudTxIds.size);
    console.log('Cloud JE Count:', cloudJeIds.size);

    const missingTxIds = [...localTxIds].filter(id => !cloudTxIds.has(id));
    const missingJeIds = [...localJeIds].filter(id => !cloudJeIds.has(id));

    console.log('Missing TX IDs Count:', missingTxIds.length);
    console.log('Missing JE IDs Count:', missingJeIds.length);

    if (missingTxIds.length > 0) {
        console.log('First 5 missing TX IDs:', missingTxIds.slice(0, 5));
    }
    if (missingJeIds.length > 0) {
        console.log('First 5 missing JE IDs:', missingJeIds.slice(0, 5));
    }
}

identifyMissing();
