
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const journalEntries = data.journalEntries || data.journal || [];
const costAccounts = ['HAJJ_UMRAH_COST', 'FLIGHT_COST', 'SERVICE_COST'];

let multiLineCount = 0;
journalEntries.forEach(entry => {
    const accCounts = {};
    (entry.lines || []).forEach(l => {
        if (costAccounts.includes(l.accountId)) {
            if (!accCounts[l.accountId]) accCounts[l.accountId] = 0;
            accCounts[l.accountId]++;
        }
    });
    
    const doubles = Object.entries(accCounts).filter(([acc, count]) => count > 1);
    if (doubles.length > 0) {
        multiLineCount++;
        if (multiLineCount < 5) {
            console.log(`JE ${entry.id} (${entry.description}) has multiple cost lines:`, doubles);
            console.log('Lines:', JSON.stringify(entry.lines, null, 2));
        }
    }
});
console.log('Total JEs with multiple cost lines:', multiLineCount);
