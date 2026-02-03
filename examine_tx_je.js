const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));
const tx = data.transactions.find(t => t.id === 'TX-1769649582029');
const je = data.journalEntries.find(j => j.id === tx.journalEntryId);
console.log('TX:', JSON.stringify(tx, null, 2));
console.log('JE:', JSON.stringify(je, null, 2));
