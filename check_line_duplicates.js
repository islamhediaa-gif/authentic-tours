
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];

// Check for JEs that have the exact same lines (amount, account, date)
const linesSeen = new Map();
let duplicateLinesCount = 0;

journalEntries.forEach(je => {
    (je.lines || []).forEach(line => {
        const key = `${je.date}|${line.accountId}|${line.debit}|${line.credit}`;
        if (linesSeen.has(key)) {
            duplicateLinesCount++;
        } else {
            linesSeen.set(key, je.id);
        }
    });
});

console.log(`Total Journal Lines: ${journalEntries.reduce((s, je) => s + (je.lines?.length || 0), 0)}`);
console.log(`Potential Duplicate Lines: ${duplicateLinesCount}`);
