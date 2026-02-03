const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

let ppLinked = 0;
let ppUnlinked = 0;
let expLinked = 0;

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    const rate = t.exchangeRate || 1;
    const amount = (t.amountInBase || (t.amount || 0) * rate);
    const pPrice = (t.purchasePriceInBase || (t.purchasePrice || 0) * rate);

    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        if (t.masterTripId || t.programId) {
            ppLinked += pPrice;
        } else {
            ppUnlinked += pPrice;
        }
    } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        if (t.masterTripId || t.programId) {
            expLinked += amount;
        }
    }
});

console.log(`Purchase Price on Linked Sales: ${ppLinked.toFixed(2)}`);
console.log(`Purchase Price on Unlinked Sales: ${ppUnlinked.toFixed(2)}`);
console.log(`Linked Expenses: ${expLinked.toFixed(2)}`);
console.log(`Sum of all three: ${(ppLinked + ppUnlinked + expLinked).toFixed(2)}`);
