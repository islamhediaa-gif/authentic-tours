const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

transactions.forEach(t => {
    if (t.date === '2026-01-13' && (t.purchasePrice === 13400 || t.purchasePriceInBase === 13400)) {
        console.log(JSON.stringify(t, null, 2));
    }
});
