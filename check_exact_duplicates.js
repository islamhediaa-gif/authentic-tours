
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];

const seen = new Map();
const duplicates = [];

journalEntries.forEach(je => {
    // Skip empty or invalid
    if (!je.date || !je.lines || je.lines.length === 0) return;
    
    // Sort lines to make comparison consistent
    const linesKey = je.lines
        .sort((a, b) => (a.accountId || '').localeCompare(b.accountId || '') || (a.debit - b.debit))
        .map(l => `${l.accountId}:${l.debit}:${l.credit}`)
        .join('|');
    
    const key = `${je.date}|${je.description}|${linesKey}`;
    
    if (seen.has(key)) {
        duplicates.push({ original: seen.get(key), duplicate: je.id, date: je.date, desc: je.description });
    } else {
        seen.set(key, je.id);
    }
});

console.log(`Total JEs: ${journalEntries.length}`);
console.log(`Duplicate JEs found: ${duplicates.length}`);

if (duplicates.length > 0) {
    console.log("\n--- Example Duplicates ---");
    duplicates.slice(0, 10).forEach(d => {
        console.log(`Date: ${d.date} | Desc: ${d.desc} | IDs: ${d.original}, ${d.duplicate}`);
    });
}
