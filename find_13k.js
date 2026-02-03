const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];

const target = 13396;
const tolerance = 10;

transactions.forEach(t => {
    if (!t || t.isVoided) return;
    const amount = (t.amountInBase || (t.amount || 0) * (t.exchangeRate || 1));
    const pPrice = (t.purchasePriceInBase || (t.purchasePrice || 0) * (t.exchangeRate || 1));
    
    if (Math.abs(amount - target) < tolerance || Math.abs(pPrice - target) < tolerance) {
        console.log(`Found Match: Date=${t.date} | Type=${t.type} | Amount=${amount} | PP=${pPrice} | Cat=${t.category} | Desc=${t.details}`);
    }
});
