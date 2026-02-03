
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];

let totalRev = 0;
let revCount = 0;
journalEntries.forEach(je => {
    (je.lines || []).forEach(l => {
        if (l.accountType === 'REVENUE') {
            totalRev += (l.credit - l.debit);
            revCount++;
        }
    });
});

console.log(`Revenue Count: ${revCount}`);
console.log(`Total Revenue: ${totalRev}`);
