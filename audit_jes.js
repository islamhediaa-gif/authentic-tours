const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const jes = data.journalEntries || [];
const accountBalances = {};

jes.forEach(je => {
    (je.lines || []).forEach(line => {
        const id = line.accountId;
        if (!accountBalances[id]) accountBalances[id] = { debit: 0, credit: 0, type: line.accountType, name: line.accountName };
        accountBalances[id].debit += (line.debit || 0);
        accountBalances[id].credit += (line.credit || 0);
    });
});

console.log('--- Key Account Balances (from JEs) ---');
const accounts = Object.entries(accountBalances).map(([id, b]) => ({
    id,
    ...b,
    net: b.type === 'REVENUE' || b.type === 'SUPPLIER' || b.type === 'PARTNER' ? b.credit - b.debit : b.debit - b.credit
}));

accounts.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

accounts.slice(0, 20).forEach(a => {
    console.log(`${a.id.padEnd(20)} (${a.type.padEnd(10)}): Net=${a.net.toFixed(2)} [D:${a.debit.toFixed(2)}, C:${a.credit.toFixed(2)}] Name: ${a.name}`);
});

const revenue = accounts.filter(a => a.type === 'REVENUE').reduce((s, a) => s + a.net, 0);
const expense = accounts.filter(a => a.type === 'EXPENSE').reduce((s, a) => s + a.net, 0);

console.log('\nTotal Revenue (JEs):', revenue.toFixed(2));
console.log('Total Expense (JEs):', expense.toFixed(2));
console.log('Net Profit (JEs):', (revenue - expense).toFixed(2));
