const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const missingTxId = data.transactions.filter(t => !t.id).length;
const missingJeId = data.journalEntries.filter(je => !je.id).length;
console.log('Missing Tx IDs:', missingTxId);
console.log('Missing Je IDs:', missingJeId);
