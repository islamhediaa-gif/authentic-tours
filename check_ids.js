const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const counts = {};
data.journalEntries.forEach(je => {
    if (je.lines) {
        je.lines.forEach(l => {
            counts[l.id] = (counts[l.id] || 0) + 1;
        });
    }
});
console.log('Line ID counts (top 10):', Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10));
