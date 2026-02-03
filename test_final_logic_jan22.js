const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let totalIncome = 0;
let totalExpense = 0;

const jes = backup.journalEntries || [];
jes.forEach(entry => {
  (entry.lines || []).forEach(line => {
    const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
    if (!isLinked) return;

    const isPL = line.accountType === 'REVENUE' || line.accountType === 'EXPENSE';
    if (!isPL) return;

    const isIncome = (line.credit || 0) > 0;
    const amount = isIncome ? line.credit : line.debit;
    const rate = line.exchangeRate || 1;
    const amountBase = amount * rate;

    // MIRROR DETECTION:
    // If it's an expense line that exactly matches a revenue line in the same JE
    const hasMatchingRevenue = entry.lines.some(l => 
      l.accountType === 'REVENUE' && 
      Math.abs(l.credit - line.debit) < 0.01 && 
      l.programId === line.programId && 
      l.componentId === line.componentId
    );

    if (isIncome) {
      totalIncome += amountBase;
    } else {
      if (hasMatchingRevenue) {
        // Exclude mirror cost
      } else {
        totalExpense += amountBase;
      }
    }
  });
});

console.log('Calculated Income:', totalIncome);
console.log('Calculated Expense (Mirror Excl):', totalExpense);
console.log('Net Profit:', totalIncome - totalExpense);
