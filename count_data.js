const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
console.log('Transactions:', data.transactions ? data.transactions.length : 0);
console.log('Journal Entries:', data.journalEntries ? data.journalEntries.length : 0);
