
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));

const entries = data.journalEntries || [];
let found = 0;

entries.forEach(e => {
    (e.lines || []).forEach(l => {
        if (l.accountId === 'HAJJ_UMRAH_REVENUE' || l.accountName === 'إيرادات حج وعمرة' || l.accountId === '1768053086406') {
            console.log(`Match: Entry ${e.id}, Date ${e.date}, ID: ${l.accountId}, Name: ${l.accountName}, Credit: ${l.credit}`);
            found++;
        }
    });
});

console.log(`Total found: ${found}`);
