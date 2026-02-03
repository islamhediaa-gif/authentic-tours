const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let revenue = 0;
let cost = 0;

const jes = backup.journalEntries || [];
jes.forEach(entry => {
  (entry.lines || []).forEach(line => {
    const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
    if (!isLinked) return;

    if (line.accountType === 'REVENUE') {
      revenue += (line.credit || 0) * (line.exchangeRate || 1);
    } else if (line.accountType === 'EXPENSE') {
      // MIRROR DETECTION
      const isMirror = entry.lines.some(l => l.accountType === 'REVENUE' && Math.abs(l.credit - line.debit) < 0.01);
      if (!isMirror) {
        cost += (line.debit || 0) * (line.exchangeRate || 1);
      }
    }
  });
});

console.log('Final Jan 22 Analysis (Ledger only, Mirror Excl):');
console.log('Revenue:', revenue);
console.log('Cost:', cost);
console.log('Profit:', revenue - cost);
