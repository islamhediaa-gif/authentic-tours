const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const partnerCredits = [];
data.journalEntries.forEach(e => {
    e.lines?.forEach(l => {
        if (l.accountType === 'PARTNER' && parseFloat(l.credit) > 0) {
            partnerCredits.push({ entryId: e.id, ...l });
        }
    });
});
console.log(partnerCredits);
