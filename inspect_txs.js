const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const txs = data.transactions || [];

const types = {};
const categories = {};

txs.forEach(t => {
    types[t.type] = (types[t.type] || 0) + 1;
    categories[t.category] = (categories[t.category] || 0) + 1;
});

console.log('--- Transaction Types ---');
console.log(JSON.stringify(types, null, 2));
console.log('--- Categories ---');
console.log(JSON.stringify(categories, null, 2));

const zeroAmountWithPrice = txs.filter(t => (t.amount === 0 || !t.amount) && (t.sellingPrice > 0));
console.log(`\nTransactions with amount=0 but sellingPrice > 0: ${zeroAmountWithPrice.length}`);

const totalSellingPrice = zeroAmountWithPrice.reduce((acc, t) => acc + (parseFloat(t.sellingPriceInBase || t.sellingPrice) || 0), 0);
console.log(`Total Selling Price for these: ${totalSellingPrice}`);

const totalPurchasePrice = zeroAmountWithPrice.reduce((acc, t) => acc + (parseFloat(t.purchasePriceInBase || t.purchasePrice) || 0), 0);
console.log(`Total Purchase Price for these: ${totalPurchasePrice}`);
console.log(`Profit for these: ${totalSellingPrice - totalPurchasePrice}`);
