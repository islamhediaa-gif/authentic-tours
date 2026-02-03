
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || data.journal || [];

const costAccounts = ['HAJJ_UMRAH_COST', 'FLIGHT_COST', 'SERVICE_COST'];

let totalCost = 0;
const details = {};

journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        if (costAccounts.includes(line.accountId)) {
            const amount = Number(line.debit || 0) - Number(line.credit || 0);
            totalCost += amount;
            if (!details[line.accountId]) details[line.accountId] = 0;
            details[line.accountId] += amount;
            
            if (amount > 100000) {
                // console.log(`Large entry: ${entry.description} | ${line.accountId} | ${amount}`);
            }
        }
    });
});

console.log('Total Cost from Journal Entries:', totalCost);
console.log('Breakdown:', details);

// Check transactions that might be causing this
const txCosts = transactions.reduce((sum, t) => sum + (Number(t.purchasePriceInBase || 0)), 0);
console.log('Total purchasePriceInBase from all transactions:', txCosts);

const purchaseOnlyTx = transactions.filter(t => t.type === 'PURCHASE_ONLY' || t.isPurchaseOnly).reduce((sum, t) => sum + Number(t.amountInBase || 0), 0);
console.log('Total from PURCHASE_ONLY transactions:', purchaseOnlyTx);

const incomeTxWithPurchase = transactions.filter(t => t.type === 'INCOME' && Number(t.purchasePriceInBase || 0) > 0).reduce((sum, t) => sum + Number(t.purchasePriceInBase || 0), 0);
console.log('Total purchasePrice from INCOME transactions:', incomeTxWithPurchase);
