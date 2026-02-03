const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const je = data.journalEntries.find(je => je.refNo === 'PV-0111');
console.log(JSON.stringify(je.lines, null, 2));