const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

let totalRevenue = 0;
let totalSalesCost = 0;
let totalExpenses = 0;

// Calculate from Transactions
transactions.forEach(t => {
    if (!t || t.isVoided) return;
    
    const rate = t.exchangeRate || 1;
    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        totalRevenue += (t.amount || 0) * rate;
        totalSalesCost += (t.purchasePrice || 0) * rate;
    } else if (t.type === 'EXPENSE') {
        // Only count general expenses, not bulk purchases (PURCHASE_ONLY)
        if (!t.isPurchaseOnly) {
            totalExpenses += (t.amount || 0) * rate;
        }
    }
});

// Add Journal Entries that are not linked to transactions and are Profit/Loss accounts
const txJeIds = new Set(transactions.map(t => t.journalEntryId).filter(Boolean));

journalEntries.forEach(entry => {
    if (txJeIds.has(entry.id)) return;

    entry.lines.forEach(line => {
        const rate = line.exchangeRate || 1;
        const amount = (line.originalAmount || (line.debit || line.credit)) * rate;

        if (line.accountType === 'REVENUE') {
            totalRevenue += (line.credit > 0 ? amount : -amount);
        } else if (line.accountType === 'EXPENSE') {
            totalExpenses += (line.debit > 0 ? amount : -amount);
        }
    });
});

const grossProfit = totalRevenue - totalSalesCost;
const netProfit = grossProfit - totalExpenses;

console.log(`TOTAL REVENUE:    ${totalRevenue.toLocaleString()}`);
console.log(`TOTAL SALES COST: ${totalSalesCost.toLocaleString()}`);
console.log(`GROSS PROFIT:     ${grossProfit.toLocaleString()}`);
console.log(`GENERAL EXPENSES: ${totalExpenses.toLocaleString()}`);
console.log(`NET PROFIT:       ${netProfit.toLocaleString()}`);
