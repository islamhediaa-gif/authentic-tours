const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
data.treasuries.forEach(t => console.log(t.name, t.openingBalance));
