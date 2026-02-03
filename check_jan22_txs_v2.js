const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774';
const txs = (backup.transactions || []).filter(tx => tx.masterTripId === TRIP_ID && !tx.isVoided);

let totalSale = 0;
let totalPurchase = 0;

txs.forEach(tx => {
    const rate = tx.exchangeRate || 1;
    totalSale += (tx.amount || 0) * rate;
    totalPurchase += (tx.purchasePrice || 0) * rate;
});

console.log('--- Non-Voided TXs for Jan 22 ---');
console.log('Total Sale: ', totalSale);
console.log('Total Purchase: ', totalPurchase);
console.log('Profit: ', totalSale - totalPurchase);
console.log('Count: ', txs.length);
