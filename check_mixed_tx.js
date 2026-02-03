const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const mixed = backup.transactions.filter(t => t.type === 'EXPENSE' && Number(t.sellingPriceInBase || 0) > 0);

console.log('Expense transactions with a selling price:', mixed.length);
let totalSellingPrice = 0;
mixed.forEach(t => {
    totalSellingPrice += Number(t.sellingPriceInBase || 0);
});
console.log('Total Selling Price in Expenses:', totalSellingPrice);
