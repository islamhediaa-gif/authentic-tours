const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const years = {};
backup.transactions.forEach(t => {
    const year = t.date ? t.date.substring(0, 4) : 'UNKNOWN';
    years[year] = (years[year] || 0) + 1;
});
console.log('Transaction counts by year:', years);

const sales2026 = backup.transactions
    .filter(t => t.date && t.date.startsWith('2026') && (t.type === 'HAJJ_UMRAH' || t.type === 'FLIGHT' || t.type === 'GENERAL_SERVICE' || t.category === 'HAJJ_UMRAH' || t.category === 'FLIGHT'))
    .reduce((sum, t) => sum + parseFloat(t.amountInBase || 0), 0);

console.log('Total Sales in 2026:', sales2026);

const totalSalesAll = backup.transactions
    .filter(t => (t.type === 'HAJJ_UMRAH' || t.type === 'FLIGHT' || t.type === 'GENERAL_SERVICE' || t.category === 'HAJJ_UMRAH' || t.category === 'FLIGHT'))
    .reduce((sum, t) => sum + parseFloat(t.amountInBase || 0), 0);

console.log('Total Sales All Time:', totalSalesAll);
