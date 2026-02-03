const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const janTxs = data.transactions.filter(t => JSON.stringify(t).includes('يناير'));
console.log(JSON.stringify(janTxs.slice(0, 5), null, 2));
