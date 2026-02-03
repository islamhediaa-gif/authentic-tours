const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774';
const txs = (backup.transactions || []).filter(tx => tx.masterTripId === TRIP_ID && !tx.isVoided);

const byRef = {};
txs.forEach(tx => {
  if (!byRef[tx.refNo]) byRef[tx.refNo] = 0;
  byRef[tx.refNo] += (tx.amount || 0);
});

console.log('Total Sale Sum:', txs.reduce((acc, tx) => acc + (tx.amount || 0), 0));
console.log('Unique Refs Count:', Object.keys(byRef).length);
console.log('Example RV-0347 Sum:', byRef['RV-0347']);
