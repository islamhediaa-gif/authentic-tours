
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));

const entries = data.journalEntries || [];
console.log(`Total entries in JSON: ${entries.length}`);

const ids = new Set();
let missingId = 0;
let duplicates = 0;

entries.forEach(e => {
    if (!e.id) {
        missingId++;
    } else {
        if (ids.has(e.id)) {
            duplicates++;
        }
        ids.add(e.id);
    }
});

console.log(`Missing ID: ${missingId}`);
console.log(`Duplicate ID: ${duplicates}`);
console.log(`Unique IDs: ${ids.size}`);
