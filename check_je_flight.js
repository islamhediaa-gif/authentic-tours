
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];
const je = journalEntries.find(j => j.id === 'JE-1769649582029');
console.log(JSON.stringify(je, null, 2));
