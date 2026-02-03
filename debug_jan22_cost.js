const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const trips = data.masterTrips || [];
const jes = data.journalEntries || [];
const txs = data.transactions || [];

const targetTrip = trips.find(t => t.name.includes('22 يناير'));
if (!targetTrip) { console.log('Trip not found'); process.exit(1); }

const tripId = targetTrip.id;
const tripTxIds = new Set(txs.filter(t => t.masterTripId === tripId).map(t => t.id));
const tripJeIds = new Set(txs.filter(t => t.masterTripId === tripId && t.journalEntryId).map(t => t.journalEntryId));

console.log(`Trip: ${targetTrip.name} (ID: ${tripId})`);
console.log(`Transactions: ${tripTxIds.size}`);
console.log(`Journal Entries from Txs: ${tripJeIds.size}`);

let totalRev = 0;
let totalCost = 0;

const seenLines = new Set();

jes.forEach(je => {
  if (tripJeIds.has(je.id)) {
    je.lines.forEach(l => {
      const lineKey = `${je.id}-${l.accountId}-${l.debit}-${l.credit}`;
      if (seenLines.has(lineKey)) return;
      seenLines.add(lineKey);

      if (l.accountType === 'REVENUE') {
        totalRev += (Number(l.credit || 0) - Number(l.debit || 0));
      } else if (l.accountType === 'EXPENSE' && !['SALARY', 'RENT'].includes(l.accountId)) {
        totalCost += (Number(l.debit || 0) - Number(l.credit || 0));
      }
    });
  }
});

console.log(`Calculated Rev: ${totalRev}`);
console.log(`Calculated Cost: ${totalCost}`);
console.log(`Calculated Profit: ${totalRev - totalCost}`);
