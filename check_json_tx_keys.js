const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const purchaseOnly = data.transactions.filter(t => t.isPurchaseOnly);
console.log('isPurchaseOnly count:', purchaseOnly.length);
if (purchaseOnly.length > 0) console.log('Sample:', purchaseOnly[0]);
