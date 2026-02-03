
const API_URL = 'https://authentic-tours-production.up.railway.app';
const tenantId = 'authentic';

async function diagnose() {
    try {
        console.log('Fetching transactions...');
        const txRes = await fetch(`${API_URL}/api/data/transactions?tenant_id=${tenantId}`).then(r => r.json());
        if (txRes.success) {
            console.log('Total transactions:', txRes.data.length);
            console.log('First transaction sample:', txRes.data[0]);
        } else {
            console.error('Failed to fetch transactions:', txRes.error);
        }

        console.log('\nFetching treasuries...');
        const trRes = await fetch(`${API_URL}/api/data/treasuries?tenant_id=${tenantId}`).then(r => r.json());
        if (trRes.success) {
            console.log('Total treasuries:', trRes.data.length);
            console.log('Treasuries sample:', trRes.data.map(t => ({ name: t.name, ob: t.opening_balance })));
        }

        console.log('\nFetching journal entries...');
        const jeRes = await fetch(`${API_URL}/api/data/journal_entries?tenant_id=${tenantId}`).then(r => r.json());
        if (jeRes.success) {
            console.log('Total journal entries:', jeRes.data.length);
            console.log('Sample journal entry:', jeRes.data[0]);
        }
        const jlRes = await fetch(`${API_URL}/api/data/journal_lines?tenant_id=${tenantId}`).then(r => r.json());
        if (jlRes.success) {
            console.log('Total journal lines:', jlRes.data.length);
            const sumDebit = jlRes.data.reduce((s, l) => s + Number(l.debit || 0), 0);
            console.log('Sum of all journal lines debit:', sumDebit);
            console.log('Sample journal line:', jlRes.data[0]);
        }

    } catch (e) {
        console.error('Diagnosis failed:', e);
    }
}

diagnose();
