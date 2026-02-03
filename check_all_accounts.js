
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));

const balances = {};
data.journalEntries.forEach(entry => {
    if (entry.date >= '2025-12-31' && entry.date <= '2026-01-28') {
        (entry.lines || []).forEach(line => {
            const key = line.accountId || line.accountName;
            if (!balances[key]) {
                balances[key] = { 
                    name: line.accountName, 
                    type: line.accountType, 
                    credit: 0, 
                    debit: 0 
                };
            }
            balances[key].credit += (line.credit || 0);
            balances[key].debit += (line.debit || 0);
        });
    }
});

console.log("--- All Revenue Accounts ---");
Object.entries(balances).forEach(([id, b]) => {
    if (b.type === 'REVENUE' || id.includes('REVENUE')) {
        console.log(`${id} (${b.name}): Credit ${b.credit}, Debit ${b.debit}, Net ${b.credit - b.debit}`);
    }
});

console.log("--- All Expense Accounts ---");
Object.entries(balances).forEach(([id, b]) => {
    if (b.type === 'EXPENSE' || id.includes('COST')) {
        console.log(`${id} (${b.name}): Debit ${b.debit}, Credit ${b.credit}, Net ${b.debit - b.credit}`);
    }
});
