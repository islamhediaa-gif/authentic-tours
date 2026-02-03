const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
let lineCount = 0;
data.journalEntries.forEach(je => {
    if (je.lines) lineCount += je.lines.length;
});
console.log('Total lines in backup:', lineCount);
