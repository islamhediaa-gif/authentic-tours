const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const jes = data.journalEntries || [];
const txs = data.transactions || [];

const tripId = '1768576135774';
const tripJeIds = new Set(txs.filter(t => t.masterTripId === tripId && t.journalEntryId).map(t => t.journalEntryId));

jes.forEach(je => {
  if (tripJeIds.has(je.id)) {
    const costLine = je.lines.find(l => l.accountId === 'HAJJ_UMRAH_COST');
    if (costLine) {
      console.log(`JE ${je.id}: ${je.description}`);
      je.lines.forEach(l => {
        console.log(`  ${l.accountType}:${l.accountId}:${l.accountName} - D:${l.debit} C:${l.credit}`);
      });
    }
  }
});
