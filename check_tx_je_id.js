
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const tx = data.transactions.find(t => t.id === '1768672069492');
console.log(tx);
