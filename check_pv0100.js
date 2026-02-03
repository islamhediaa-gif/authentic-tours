const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const jes = backup.journalEntries || [];
const je = jes.find(je => je.refNo === 'PV-0100');
console.log(JSON.stringify(je, null, 2));
