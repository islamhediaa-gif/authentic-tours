
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const problematic = transactions.filter(t => 
    (t.type === 'INCOME' || t.category === 'FLIGHT' || t.category === 'HAJJ_UMRAH') && 
    (t.purchasePrice === 0 || t.purchasePrice === undefined) && 
    (t.amount > 0)
);

console.log('Total Transactions:', transactions.length);
console.log('Problematic INCOME Transactions (purchasePrice=0, amount>0):', problematic.length);
if (problematic.length > 0) {
    console.log('Example:', { 
        description: problematic[0].description, 
        amount: problematic[0].amount, 
        purchasePrice: problematic[0].purchasePrice,
        category: problematic[0].category
    });
}

let totalExtraCost = 0;
problematic.forEach(t => totalExtraCost += (t.amount * (t.exchangeRate || 1)));
console.log('Total Extra Cost added by this bug:', totalExtraCost);
