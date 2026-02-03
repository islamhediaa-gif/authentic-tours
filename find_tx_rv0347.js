const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const txs = (backup.transactions || []).filter(tx => tx.refNo === 'RV-0347');
console.log('Transactions for RV-0347:', JSON.stringify(txs, null, 2));
