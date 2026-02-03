const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const je = data.journalEntries || data.journal || [];
const expAccounts = {};
je.forEach(e => {
  (e.lines || []).forEach(l => {
    if (l.accountType === 'EXPENSE') {
      const key = l.accountId + ' (' + (l.accountName || '') + ')';
      expAccounts[key] = (expAccounts[key] || 0) + (Number(l.debit || 0) - Number(l.credit || 0));
    }
  });
});
console.log(JSON.stringify(Object.entries(expAccounts).sort((a,b) => b[1] - a[1]).slice(0, 30), null, 2));
