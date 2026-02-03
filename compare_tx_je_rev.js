const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

let flightRev = 0;
let serviceRev = 0;
let flightCost = 0;
let serviceCost = 0;

backup.transactions.forEach(t => {
    if (t.isVoided) return;
    const cat = t.category || '';
    const type = t.type || '';
    
    if (cat.startsWith('FLIGHT') || type.startsWith('FLIGHT')) {
        flightRev += Number(t.sellingPriceInBase || t.amountInBase || 0);
        flightCost += Number(t.purchasePriceInBase || (type === 'EXPENSE' ? t.amountInBase : 0));
    } else if (cat === 'GENERAL_SERVICE' || type === 'GENERAL_SERVICE') {
        serviceRev += Number(t.sellingPriceInBase || t.amountInBase || 0);
        serviceCost += Number(t.purchasePriceInBase || (type === 'EXPENSE' ? t.amountInBase : 0));
    }
});

console.log('Flight Revenue (Transactions):', flightRev);
console.log('Flight Cost (Transactions):', flightCost);
console.log('Service Revenue (Transactions):', serviceRev);
console.log('Service Cost (Transactions):', serviceCost);

console.log('\nFrom JEs:');
console.log('Flight Rev (JEs): 671669');
console.log('Service Rev (JEs): 798102.89');
