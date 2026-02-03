const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let flightSum = 0;
let expenseSum = 0;
let umrahCostSum = 0;

const jes = backup.journalEntries || [];
jes.forEach(entry => {
  (entry.lines || []).forEach(line => {
    const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
    if (!isLinked) return;

    if (line.accountType !== 'EXPENSE') return;

    const amount = (line.debit || 0) * (line.exchangeRate || 1);

    if (line.accountName && line.accountName.includes('طيران')) {
      flightSum += amount;
    } else if (line.accountName && (line.accountName.includes('عامة') || line.accountName.includes('إدارية') || line.accountName.includes('مصروف'))) {
      expenseSum += amount;
    } else {
      umrahCostSum += amount;
    }
  });
});

console.log('Flight Sum:', flightSum);
console.log('Expense Sum:', expenseSum);
console.log('Umrah Cost Sum (including mirror):', umrahCostSum);
