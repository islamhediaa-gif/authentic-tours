const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const txs = (backup.transactions || []).filter(tx => tx.masterTripId === TRIP_ID && !tx.isVoided);

let flightSum = 0;
let expenseSum = 0;
let otherSum = 0;

txs.forEach(tx => {
  const amount = (tx.amount || 0) * (tx.exchangeRate || 1);
  if (tx.category === 'FLIGHT' || tx.description?.includes('طيران')) {
    flightSum += amount;
  } else if (tx.category === 'EXPENSE_GEN' || tx.description?.includes('مصاريف')) {
    expenseSum += amount;
  } else {
    otherSum += amount;
  }
});

console.log('TX Flight Sum:', flightSum);
console.log('TX Expense Sum:', expenseSum);
console.log('TX Other Sum:', otherSum);
