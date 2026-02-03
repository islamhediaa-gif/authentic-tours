
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const flightTx = transactions.filter(t => t.category === 'FLIGHT' || t.category === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REISSUE');
console.log(flightTx.slice(0, 2));
