const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
let totalUmrahCost = 0;
backup.journalEntries.forEach(je => je.lines.forEach(l => {
    if (l.accountName === 'تكاليف حج وعمرة') totalUmrahCost += l.debit;
}));
console.log('Total Hajj/Umrah Cost in Backup:', totalUmrahCost);
