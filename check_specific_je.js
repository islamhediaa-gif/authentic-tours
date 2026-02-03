const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const je = data.journalEntries.find(j => j.id === 'JE-1769104210058');
console.log(JSON.stringify(je, null, 2));
