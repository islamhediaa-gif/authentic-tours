const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const jes = data.journalEntries || [];
const txs = data.transactions || [];

const tripId = '1768922423344'; // Jan 26
const tripJeIds = new Set(txs.filter(t => t.masterTripId === tripId && t.journalEntryId).map(t => t.journalEntryId));

let totalRev = 0;
let totalCost = 0;

jes.forEach(je => {
  if (tripJeIds.has(je.id)) {
    const revLine = je.lines.find(l => l.accountId === 'HAJJ_UMRAH_REVENUE');
    const costLine = je.lines.find(l => l.accountId === 'HAJJ_UMRAH_COST');
    const isMirror = revLine && costLine && Math.abs(revLine.credit - costLine.debit) < 0.01;

    je.lines.forEach(l => {
      if (l.accountType === 'REVENUE') {
        totalRev += (Number(l.credit || 0) - Number(l.debit || 0));
      } else if (l.accountType === 'EXPENSE' && !['SALARY', 'RENT'].includes(l.accountId)) {
        if (l.accountId === 'HAJJ_UMRAH_COST' && isMirror) return;
        totalCost += (Number(l.debit || 0) - Number(l.credit || 0));
      } else if (l.accountType === 'ASSET' && l.accountId === 'ASSET_GUARANTEES') {
         // Testing if asset guarantees are counted as cost in trip analysis
         totalCost += (Number(l.debit || 0) - Number(l.credit || 0));
      }
    });
  }
});

console.log(`Trip 26 Jan (With Mirror + Asset Logic):`);
console.log(`Rev: ${totalRev}`);
console.log(`Cost: ${totalCost}`);
console.log(`Profit: ${totalRev - totalCost}`);
