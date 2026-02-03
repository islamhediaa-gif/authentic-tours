const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let totalIncome = 0;
let totalExpense = 0;
let mirrorCostExcluded = 0;

const jes = backup.journalEntries || [];

jes.forEach(entry => {
  (entry.lines || []).forEach((line, index) => {
    const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
    if (!isLinked) return;

    const isPL = line.accountType === 'REVENUE' || line.accountType === 'EXPENSE';
    if (!isPL) return;

    const isIncome = (line.credit || 0) > 0;
    const amount = isIncome ? line.credit : line.debit;
    const rate = line.exchangeRate || 1;
    const amountBase = amount * rate;

    // Detection logic for redundant "Accommodation Cost" that mirrors "Accommodation Sale"
    // Usually recorded in the same JE for inventory-less services
    const isMirrorCost = !isIncome && line.accountName === 'تكاليف حج وعمرة' && entry.lines.some(l => 
      l.accountType === 'REVENUE' && 
      l.credit === line.debit && 
      l.programId === line.programId && 
      l.componentId === line.componentId
    );

    if (isMirrorCost) {
      mirrorCostExcluded += amountBase;
    } else {
      if (isIncome) totalIncome += amountBase;
      else totalExpense += amountBase;
    }
  });
});

console.log('--- Jan 22 Analysis ---');
console.log('Target Revenue: 2,785,600');
console.log('Target Cost:    2,496,549.6');
console.log('Target Profit:  289,050.4');
console.log('-----------------------');
console.log('Calculated Revenue: ', totalIncome);
console.log('Calculated Cost:    ', totalExpense);
console.log('Calculated Profit:  ', totalIncome - totalExpense);
console.log('Mirror Cost Excl:   ', mirrorCostExcluded);
