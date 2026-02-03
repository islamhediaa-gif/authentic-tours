const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const jes = backup.journalEntries || [];
const je = jes.find(je => je.id === 'JE-1769590201124');
console.log('Lines count:', je.lines.length);
je.lines.forEach((l, i) => console.log(`Line ${i}: ${l.accountName} (${l.accountType}), Debit: ${l.debit}, Credit: ${l.credit}`));
