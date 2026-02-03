const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));
const tx = data.transactions.find(t => t.id === '1768910363174'); // Note: ID in audit was 1768910363174 (no TX- prefix in that one)
const je = data.journalEntries.find(j => j.id === tx.journalEntryId);
console.log('TX:', JSON.stringify(tx, null, 2));
console.log('JE:', JSON.stringify(je, null, 2));
