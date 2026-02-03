
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];
const balances = {};

// Initial balances from entities
(data.customers || []).forEach(c => {
    const key = 'CUSTOMER';
    if (!balances[key]) balances[key] = { debit: 0, credit: 0 };
    const ob = c.openingBalanceInBase || 0;
    if (ob > 0) balances[key].debit += ob;
    else balances[key].credit += Math.abs(ob);
});
(data.suppliers || []).forEach(s => {
    const key = 'SUPPLIER';
    if (!balances[key]) balances[key] = { debit: 0, credit: 0 };
    const ob = s.openingBalanceInBase || 0;
    if (ob > 0) balances[key].credit += ob; // Suppliers credit is liability
    else balances[key].debit += Math.abs(ob);
});
(data.treasuries || []).forEach(t => {
    const key = 'TREASURY';
    if (!balances[key]) balances[key] = { debit: 0, credit: 0 };
    const ob = t.openingBalance || 0;
    if (ob > 0) balances[key].debit += ob;
    else balances[key].credit += Math.abs(ob);
});
(data.partners || []).forEach(p => {
    const key = 'PARTNER';
    if (!balances[key]) balances[key] = { debit: 0, credit: 0 };
    const ob = p.openingBalance || 0;
    if (ob > 0) balances[key].credit += ob;
    else balances[key].debit += Math.abs(ob);
});
(data.employees || []).forEach(e => {
    const key1 = 'LIABILITY';
    if (!balances[key1]) balances[key1] = { debit: 0, credit: 0 };
    const ob1 = e.openingBalance || 0;
    if (ob1 > 0) balances[key1].credit += ob1;
    else balances[key1].debit += Math.abs(ob1);

    const key2 = 'EMPLOYEE_ADVANCE';
    if (!balances[key2]) balances[key2] = { debit: 0, credit: 0 };
    const ob2 = e.openingAdvances || 0;
    if (ob2 > 0) balances[key2].debit += ob2;
    else balances[key2].credit += Math.abs(ob2);
});

// Transactions
if (data.transactions && data.transactions.length > 0) {
    console.log("Tx Keys:", Object.keys(data.transactions[0]));
}
// Journal entries
if (journalEntries.length > 0) {
    console.log("JE Keys:", Object.keys(journalEntries[0]));
    if (journalEntries[0].lines && journalEntries[0].lines.length > 0) {
        console.log("Line Keys:", Object.keys(journalEntries[0].lines[0]));
    }
}
journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const key = line.accountType;
        if (!balances[key]) balances[key] = { debit: 0, credit: 0 };
        balances[key].debit += (line.debit || 0);
        balances[key].credit += (line.credit || 0);
    });
});

console.log("--- Balances by Type ---");
Object.entries(balances).forEach(([type, b]) => {
    const net = b.debit - b.credit;
    console.log(`${type.padEnd(20)}: Debit=${b.debit.toFixed(2)}, Credit=${b.credit.toFixed(2)}, Net=${net.toFixed(2)}`);
});

const assets = (balances['TREASURY']?.debit - balances['TREASURY']?.credit || 0) +
               (balances['CUSTOMER']?.debit - balances['CUSTOMER']?.credit || 0) +
               (balances['EMPLOYEE_ADVANCE']?.debit - balances['EMPLOYEE_ADVANCE']?.credit || 0) +
               (balances['ASSET']?.debit - balances['ASSET']?.credit || 0);

const liabilities = (balances['SUPPLIER']?.credit - balances['SUPPLIER']?.debit || 0) +
                    (balances['LIABILITY']?.credit - balances['LIABILITY']?.debit || 0);

const equity = (balances['PARTNER']?.credit - balances['PARTNER']?.debit || 0) +
               (balances['EQUITY']?.credit - balances['EQUITY']?.debit || 0);

const revenues = (balances['REVENUE']?.credit - balances['REVENUE']?.debit || 0);
const expenses = (balances['EXPENSE']?.debit - balances['EXPENSE']?.credit || 0);
const netProfit = revenues - expenses;

console.log("\n--- Balance Sheet ---");
console.log(`Assets: ${assets.toFixed(2)}`);
console.log(`Liabilities: ${liabilities.toFixed(2)}`);
console.log(`Partners Equity: ${equity.toFixed(2)}`);
console.log(`Net Profit: ${netProfit.toFixed(2)}`);
console.log(`Total Equity: ${(equity + netProfit).toFixed(2)}`);
console.log(`L + E: ${(liabilities + equity + netProfit).toFixed(2)}`);
console.log(`Difference (A - (L+E)): ${(assets - (liabilities + equity + netProfit)).toFixed(2)}`);
