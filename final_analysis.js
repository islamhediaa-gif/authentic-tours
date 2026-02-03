const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const categories = [
    'HAJJ_UMRAH', 'FLIGHT', 'GENERAL_SERVICE', 'FLIGHT_REISSUE', 'FLIGHT_REFUND'
];

let total = 0;
const breakdown = {};

backup.transactions.forEach(t => {
    const isSaleCat = categories.includes(t.category);
    const isSaleType = categories.includes(t.type);
    
    if (isSaleCat || isSaleType) {
        const amount = Number(t.sellingPriceInBase || t.amountInBase || 0);
        const sign = t.type === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REFUND' ? -1 : 1;
        total += (amount * sign);
        
        const cat = t.category || 'NO_CAT';
        breakdown[cat] = (breakdown[cat] || 0) + (amount * sign);
    }
});

console.log('Total "Real" Sales (Hajj/Flight/Service):', total);
console.log('Breakdown:', breakdown);
