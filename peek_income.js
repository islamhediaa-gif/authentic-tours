const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const incomeTx = data.transactions.find(t => t.type === 'INCOME');
console.log(JSON.stringify(incomeTx, null, 2));
const expenseTx = data.transactions.find(t => t.type === 'EXPENSE');
console.log(JSON.stringify(expenseTx, null, 2));
