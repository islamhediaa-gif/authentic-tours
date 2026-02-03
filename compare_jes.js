
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];
const je1 = journalEntries.find(j => j.id === 'JE-1769589943307');
const je2 = journalEntries.find(j => j.id === 'JE-1769589943306');

console.log("JE 1:", JSON.stringify(je1, null, 2));
console.log("JE 2:", JSON.stringify(je2, null, 2));
