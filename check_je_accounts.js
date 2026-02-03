const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const revenueAccounts = {};
const costAccounts = {};

backup.journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const id = line.accountId;
        if (id.startsWith('4')) {
            revenueAccounts[id] = (revenueAccounts[id] || 0) + (Number(line.credit || 0) - Number(line.debit || 0));
        } else if (id.startsWith('5')) {
            costAccounts[id] = (costAccounts[id] || 0) + (Number(line.debit || 0) - Number(line.credit || 0));
        }
    });
});

console.log('--- REVENUE ACCOUNTS (4xxx) ---');
console.log(revenueAccounts);

let totalRev = 0;
for (let id in revenueAccounts) totalRev += revenueAccounts[id];
console.log('Total Revenue (from JEs):', totalRev);

console.log('\n--- COST ACCOUNTS (5xxx) ---');
console.log(costAccounts);

let totalCost = 0;
for (let id in costAccounts) totalCost += costAccounts[id];
console.log('Total Cost (from JEs):', totalCost);

console.log('\nTarget Sales:', 4759371.89);
console.log('Difference:', totalRev - 4759371.89);
