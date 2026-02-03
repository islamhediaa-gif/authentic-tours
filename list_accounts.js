const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const jes = backup.journalEntries || [];
const accounts = new Set();
jes.forEach(je => (je.lines || []).forEach(l => {
  if (l.accountName) accounts.add(`${l.accountName} (${l.accountType})`);
}));
console.log(Array.from(accounts).sort());
