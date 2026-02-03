
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

const pid = '1768856031486';
const ind = transactions.filter(t => t.programId === pid && t.category === 'FLIGHT' && t.type === 'INCOME');

console.log(`Found ${ind.length} individual flights for program ${pid}`);

ind.slice(0, 3).forEach(t => {
    console.log(`\nTx ${t.id} | Purchase: ${t.purchasePrice}`);
    const je = journalEntries.find(j => j.id === t.journalEntryId);
    je?.lines?.filter(l => l.accountType === 'EXPENSE').forEach(l => console.log(`  EXPENSE Line: ${l.accountId} | Debit: ${l.debit}`));
});
