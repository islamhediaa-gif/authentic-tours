const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const txIds = data.transactions.map(t => t.id);
const uniqueTxIds = new Set(txIds);
console.log('Transactions total:', txIds.length, 'Unique:', uniqueTxIds.size);

const jeIds = data.journalEntries.map(je => je.id);
const uniqueJeIds = new Set(jeIds);
console.log('Journal Entries total:', jeIds.length, 'Unique:', uniqueJeIds.size);
