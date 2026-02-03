const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

let totalCustomerBalance = 0;
const balances = {};

backup.journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        if (line.accountType === 'CUSTOMER') {
            const id = line.accountId;
            balances[id] = (balances[id] || 0) + (Number(line.debit || 0) - Number(line.credit || 0));
        }
    });
});

for (let id in balances) {
    totalCustomerBalance += balances[id];
}

console.log('Total Customer Balance (Net):', totalCustomerBalance);
console.log('Target Customer Balance:', 47216.92);
console.log('Difference:', totalCustomerBalance - 47216.92);
