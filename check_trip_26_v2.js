const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const jes = data.journalEntries || [];
const txs = data.transactions || [];

const tripIds = ['1768847095963', '1768922423344'];

tripIds.forEach(tripId => {
  const trip = data.masterTrips.find(t => t.id === tripId);
  console.log(`\nAccount breakdown for Trip ${trip.name} (${tripId}):`);
  const tripJeIds = new Set(txs.filter(t => t.masterTripId === tripId && t.journalEntryId).map(t => t.journalEntryId));

  const accounts = {};
  jes.forEach(je => {
    if (tripJeIds.has(je.id)) {
      je.lines.forEach(l => {
        const key = `${l.accountType}:${l.accountId}:${l.accountName}`;
        if (!accounts[key]) accounts[key] = { debit: 0, credit: 0 };
        accounts[key].debit += Number(l.debit || 0);
        accounts[key].credit += Number(l.credit || 0);
      });
    }
  });

  Object.entries(accounts).forEach(([key, val]) => {
    console.log(`${key}: Debit=${val.debit}, Credit=${val.credit}, Net=${val.credit - val.debit}`);
  });
});
