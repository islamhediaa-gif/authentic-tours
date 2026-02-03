
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];

const linesSeen = new Map();
const duplicates = [];

journalEntries.forEach(je => {
    (je.lines || []).forEach(line => {
        const key = `${je.date}|${line.accountId}|${line.debit}|${line.credit}`;
        if (linesSeen.has(key)) {
            duplicates.push({ key, originalJe: linesSeen.get(key), duplicateJe: je.id, desc: je.description });
        } else {
            linesSeen.set(key, je.id);
        }
    });
});

console.log("--- Example Duplicate Lines ---");
duplicates.slice(0, 10).forEach(d => {
    console.log(`Original JE: ${d.originalJe} | Duplicate JE: ${d.duplicateJe} | Desc: ${d.desc}`);
    console.log(`  Key: ${d.key}`);
});
