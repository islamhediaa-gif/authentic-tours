
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];

const seen = new Map();
const uniqueJEs = [];
let removedCount = 0;

journalEntries.forEach(je => {
    if (!je.date || !je.lines || je.lines.length === 0) return;
    
    // Sort lines to make comparison consistent
    const linesKey = je.lines
        .sort((a, b) => (a.accountId || '').localeCompare(b.accountId || '') || (a.debit - b.debit))
        .map(l => `${l.accountId}:${l.debit}:${l.credit}`)
        .join('|');
    
    const key = `${je.date}|${je.description}|${linesKey}`;
    
    if (seen.has(key)) {
        removedCount++;
    } else {
        seen.set(key, je.id);
        uniqueJEs.push(je);
    }
});

console.log(`Original JE count: ${journalEntries.length}`);
console.log(`Unique JE count: ${uniqueJEs.length}`);
console.log(`Removed duplicates: ${removedCount}`);

const newData = { ...data, journalEntries: uniqueJEs };
fs.writeFileSync('Backup_Nebras_Cleaned.json', JSON.stringify(newData, null, 2));
