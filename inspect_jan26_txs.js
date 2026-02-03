const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const tid = '1768922423344';
const txs = (backup.transactions || []).filter(tx => tx.masterTripId === tid && !tx.isVoided);
console.log(JSON.stringify(txs, null, 2));
