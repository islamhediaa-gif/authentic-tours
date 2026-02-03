
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));
console.log(JSON.stringify(data.journalEntries.slice(0, 3), null, 2));
