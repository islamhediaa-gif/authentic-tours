
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));
console.log(`Total journal entries in JSON: ${data.journalEntries.length}`);
let linesCount = 0;
data.journalEntries.forEach(e => linesCount += (e.lines || []).length);
console.log(`Total journal lines in JSON: ${linesCount}`);
