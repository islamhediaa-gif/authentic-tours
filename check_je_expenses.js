const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const jes = data.journalEntries || [];
const expenseAccounts = new Map();

jes.forEach(entry => {
    (entry.lines || []).forEach(line => {
        if (line.accountType === 'EXPENSE' || line.accountType === 'COST') {
            const key = line.accountId;
            if (!expenseAccounts.has(key)) {
                expenseAccounts.set(key, { name: line.accountName, debit: 0, credit: 0 });
            }
            const acc = expenseAccounts.get(key);
            acc.debit += (line.debit || 0);
            acc.credit += (line.credit || 0);
        }
    });
});

console.log('--- Expense Accounts from Journal Entries ---');
for (const [id, data] of expenseAccounts.entries()) {
    const balance = data.debit - data.credit;
    if (balance !== 0) {
        console.log(`ID: ${id.padEnd(20)} Name: ${(data.name || '').padEnd(30)} Balance: ${balance.toFixed(2)}`);
    }
}
