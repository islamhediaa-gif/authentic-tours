const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774';
const txs = (backup.transactions || []).filter(tx => tx.masterTripId === TRIP_ID && !tx.isVoided);

txs.forEach(tx => {
    if (tx.purchasePrice > 0) {
        console.log(`Ref: ${tx.refNo}, Desc: ${tx.description}, Purchase: ${tx.purchasePrice}`);
    }
});

console.log('Total TXs with Purchase > 0:', txs.filter(tx => tx.purchasePrice > 0).length);
console.log('Sum of Purchase Price:', txs.reduce((acc, tx) => acc + (tx.purchasePrice || 0), 0));
