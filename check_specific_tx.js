const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const tx = data.transactions.find(t => t.id === '1769104210058');
console.log(JSON.stringify(tx, null, 2));
