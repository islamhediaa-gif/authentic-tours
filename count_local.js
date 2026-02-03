
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
console.log(`Transactions: ${data.transactions?.length || 0}`);
console.log(`Journal Entries: ${data.journalEntries?.length || 0}`);
console.log(`Journal Lines: ${data.journalEntries?.reduce((s, je) => s + (je.lines?.length || 0), 0) || 0}`);
