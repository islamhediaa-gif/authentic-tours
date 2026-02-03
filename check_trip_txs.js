const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const tripId = '1768686066932';
const tripTxs = data.transactions.filter(t => t.masterTripId === tripId);
console.log(`Transactions for trip: ${tripTxs.length}`);
const totalRev = tripTxs.reduce((s, t) => s + (t.amountInBase || 0), 0);
console.log(`Total Revenue from these: ${totalRev}`);
if (tripTxs.length > 0) console.log(JSON.stringify(tripTxs[0], null, 2));
