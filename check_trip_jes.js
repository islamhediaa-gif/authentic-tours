const fs = require('fs');
// Mocking the environment to read the data if available, or just analysis logic
// Since I can't read the JSON backup anymore (it seems it was deleted or moved), 
// I will rely on the current transaction -> JE mapping.

// I'll search for the masterTripId for '22 يناير' and '26 يناير'
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const trips = data.masterTrips || [];
const jes = data.journalEntries || [];
const txs = data.transactions || [];

const tripMap = {};
trips.forEach(t => {
  tripMap[t.id] = { name: t.name, revenue: 0, cost: 0 };
});

const jeToTrip = {};
txs.forEach(t => {
  if (t.journalEntryId && t.masterTripId) {
    jeToTrip[t.journalEntryId] = t.masterTripId;
  }
});

jes.forEach(je => {
  const tripId = jeToTrip[je.id];
  if (tripId && tripMap[tripId]) {
    je.lines.forEach(l => {
      if (l.accountType === 'REVENUE') {
        tripMap[tripId].revenue += (Number(l.credit || 0) - Number(l.debit || 0));
      } else if (l.accountType === 'EXPENSE' && !['SALARY', 'RENT'].includes(l.accountId)) {
        tripMap[tripId].cost += (Number(l.debit || 0) - Number(l.credit || 0));
      }
    });
  }
});

console.log('Trip Analysis from JEs:');
Object.values(tripMap).forEach(t => {
  if (t.revenue > 0 || t.cost > 0) {
    console.log(`${t.name}: Rev=${t.revenue}, Cost=${t.cost}, Profit=${t.revenue - t.cost}`);
  }
});
