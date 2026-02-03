
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || data.journal || [];

const tx = transactions.find(t => t.purchasePrice > 0);
console.log('Transaction:', { id: tx.id, description: tx.description, purchasePrice: tx.purchasePrice, journalEntryId: tx.journalEntryId });

if (tx.journalEntryId) {
    const entry = journalEntries.find(e => e.id === tx.journalEntryId);
    console.log('Journal Entry:', JSON.stringify(entry, null, 2));
}

// Find if multiple journal entries have the same description and date
const counts = {};
journalEntries.forEach(e => {
    const key = `${e.description}|${e.date}|${e.totalAmount}`;
    if (!counts[key]) counts[key] = [];
    counts[key].push(e.id);
});

const duplicates = Object.entries(counts).filter(([key, ids]) => ids.length > 1);
console.log('Duplicate Journal Entries count:', duplicates.length);
if (duplicates.length > 0) {
    console.log('First duplicate example:', duplicates[0]);
}
