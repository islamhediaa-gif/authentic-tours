
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const found = data.transactions.find(t => t.isSaleOnly || t.isPurchaseOnly);
console.log('Transaction with flags:', found);
