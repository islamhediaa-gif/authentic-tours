const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/db_backup_2026-01-29.json', 'utf8'));
const jes = data.journalEntries.filter(je => je.lines.some(l => l.accountId.startsWith('4') || l.accountId.startsWith('5')));
console.log(JSON.stringify(jes.slice(0, 10), null, 2));
