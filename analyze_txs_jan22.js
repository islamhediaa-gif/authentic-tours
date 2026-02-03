const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const txs = (backup.transactions || []).filter(tx => tx.masterTripId === TRIP_ID || tx.programId);

console.log('--- Jan 22 Transactions Analysis ---');
let totalSale = 0;
let totalPurchase = 0;

txs.forEach(tx => {
  if (tx.isVoided) return;
  const rate = tx.exchangeRate || 1;
  totalSale += (tx.amount || 0) * rate;
  totalPurchase += (tx.purchasePrice || 0) * rate;
});

console.log('Total Transactions Sale: ', totalSale);
console.log('Total Transactions Purchase: ', totalPurchase);
console.log('Estimated Profit from TXs: ', totalSale - totalPurchase);
