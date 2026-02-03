
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));
const tx = data.transactions[0];
console.log("Keys in JSON transaction:", Object.keys(tx));
const withSaleOnly = data.transactions.filter(t => t.isSaleOnly).length;
const withPurchaseOnly = data.transactions.filter(t => t.isPurchaseOnly).length;
console.log(`Transactions with isSaleOnly: ${withSaleOnly}`);
console.log(`Transactions with isPurchaseOnly: ${withPurchaseOnly}`);
