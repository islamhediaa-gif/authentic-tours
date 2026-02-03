const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));
const mismatchSales = data.transactions.filter(t => t.isSaleOnly && t.type !== 'REVENUE_ONLY');
console.log('Mismatch Sales:', mismatchSales.length);
if (mismatchSales.length > 0) console.log(JSON.stringify(mismatchSales[0], null, 2));

const mismatchPurchases = data.transactions.filter(t => t.isPurchaseOnly && t.type !== 'PURCHASE_ONLY');
console.log('Mismatch Purchases:', mismatchPurchases.length);
if (mismatchPurchases.length > 0) console.log(JSON.stringify(mismatchPurchases[0], null, 2));
