const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const types = new Set();
const accounts = new Set();

backup.journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        types.add(line.accountType);
        if (line.accountType === 'REVENUE' || line.accountType === 'COST' || line.accountType === 'EXPENSE') {
            accounts.add(`${line.accountType}: ${line.accountId} - ${line.accountName}`);
        }
    });
});

console.log('Account Types:', [...types]);
console.log('\nSample Revenue/Cost/Expense Accounts:');
console.log([...accounts].slice(0, 20));
