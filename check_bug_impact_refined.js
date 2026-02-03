
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const costCategories = ['FLIGHT', 'HAJJ_UMRAH', 'GENERAL_SERVICE', 'FLIGHT_REISSUE'];

const problematic = transactions.filter(t => 
    costCategories.includes(t.category) && 
    (t.purchasePrice === 0 || t.purchasePrice === undefined) && 
    (t.amount > 0)
);

console.log('Total Transactions:', transactions.length);
console.log('Problematic Sales Transactions (purchasePrice=0, amount>0):', problematic.length);

let totalExtraCost = 0;
problematic.forEach(t => {
    totalExtraCost += (t.amount * (t.exchangeRate || 1));
});
console.log('Total Extra Cost added by this bug:', totalExtraCost);

if (problematic.length > 0) {
    console.log('Top 5 problematic entries:');
    problematic.slice(0, 5).forEach(t => console.log(`- ${t.description}: ${t.amount}`));
}
