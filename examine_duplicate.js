const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const matches = data.transactions.filter(t => t.id === '1769589943307');
console.log(JSON.stringify(matches, null, 2));
