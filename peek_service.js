
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const serviceTx = transactions.filter(t => t.category === 'GENERAL_SERVICE');
console.log(serviceTx.slice(0, 2));
