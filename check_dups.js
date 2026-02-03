const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));

const entryCounts = {};
data.journalEntries.forEach(e => {
    entryCounts[e.id] = (entryCounts[e.id] || 0) + 1;
});

const duplicates = Object.keys(entryCounts).filter(id => entryCounts[id] > 1);
console.log('Duplicate IDs:', duplicates);

if (duplicates.length > 0) {
    const dupId = duplicates[0];
    const txs = data.transactions.filter(t => t.journalEntryId === dupId);
    console.log(`Transactions pointing to duplicate ID ${dupId}:`, txs.length);
    txs.forEach(t => console.log(`- Tx Date: ${t.date}, Amount: ${t.amount}, Desc: ${t.description.substring(0, 50)}`));
    
    const entries = data.journalEntries.filter(e => e.id === dupId);
    entries.forEach((e, i) => console.log(`- Entry ${i} Date: ${e.date}, Amount: ${e.totalAmount}, Desc: ${e.description.substring(0, 50)}`));
}
