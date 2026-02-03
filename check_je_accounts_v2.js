const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const entry = backup.journalEntries.find(e => e.lines && e.lines.length > 0);
console.log('Sample JE line:', entry.lines[0]);

const revenueAccounts = {};
const costAccounts = {};

backup.journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const id = line.accountId || line.account_id;
        if (!id) return;
        const sId = String(id);
        if (sId.startsWith('4')) {
            revenueAccounts[sId] = (revenueAccounts[sId] || 0) + (Number(line.credit || 0) - Number(line.debit || 0));
        } else if (sId.startsWith('5')) {
            costAccounts[sId] = (costAccounts[sId] || 0) + (Number(line.debit || 0) - Number(line.credit || 0));
        }
    });
});

console.log('--- REVENUE ACCOUNTS (4xxx) ---');
console.log(revenueAccounts);
let totalRev = 0;
for (let id in revenueAccounts) totalRev += revenueAccounts[id];
console.log('Total Revenue:', totalRev);

console.log('\n--- COST ACCOUNTS (5xxx) ---');
console.log(costAccounts);
let totalCost = 0;
for (let id in costAccounts) totalCost += costAccounts[id];
console.log('Total Cost:', totalCost);

console.log('\nTarget Sales:', 4759371.89);
console.log('Difference:', totalRev - 4759371.89);
