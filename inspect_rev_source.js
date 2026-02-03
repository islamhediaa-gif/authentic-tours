const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const entry = backup.journalEntries.find(e => e.lines && e.lines.some(l => l.accountType === 'REVENUE'));
console.log('JE with Revenue:', JSON.stringify(entry, (k,v) => k==='lines' ? v.slice(0,2) : v, 2));

const tx = backup.transactions.find(t => t.type === 'REVENUE_ONLY');
console.log('\nTransaction with Revenue:', JSON.stringify(tx, null, 2));
