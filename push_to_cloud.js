const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://rzjjmacmwocusqeoyyhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tenantId = 'authentic';

function mapKeysToSnake(obj) {
    if (Array.isArray(obj)) return obj.map(mapKeysToSnake);
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = mapKeysToSnake(obj[key]);
            return acc;
        }, {});
    }
    return obj;
}

async function pushData() {
    const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));
    
    console.log(`Pushing ${data.transactions.length} transactions...`);
    for (let i = 0; i < data.transactions.length; i += 50) {
        const batch = data.transactions.slice(i, i + 50).map(t => ({
            ...mapKeysToSnake(t),
            tenant_id: tenantId
        }));
        const { error } = await supabase.from('transactions').upsert(batch, { onConflict: 'id' });
        if (error) console.error('TX Batch Error:', error);
    }

    console.log(`Pushing ${data.journalEntries.length} journal entries...`);
    for (let i = 0; i < data.journalEntries.length; i += 50) {
        const batch = data.journalEntries.slice(i, i + 50);
        
        // Push JE headers
        const headers = batch.map(j => {
            const sj = mapKeysToSnake(j);
            delete sj.lines;
            return { ...sj, tenant_id: tenantId };
        });
        const { error: hError } = await supabase.from('journal_entries').upsert(headers, { onConflict: 'id' });
        if (hError) console.error('JE Header Error:', hError);

        // Push JE lines
        const allLines = [];
        batch.forEach(entry => {
            if (entry.lines && Array.isArray(entry.lines)) {
                entry.lines.forEach((line, index) => {
                    allLines.push({
                        ...mapKeysToSnake(line),
                        id: `${entry.id}_${index}`,
                        tenant_id: tenantId,
                        journal_entry_id: entry.id
                    });
                });
            }
        });

        if (allLines.length > 0) {
            const { error: lError } = await supabase.from('journal_lines').upsert(allLines, { onConflict: 'id' });
            if (lError) console.error('JE Lines Error:', lError);
        }
    }

    console.log('Push complete.');
}

pushData();
