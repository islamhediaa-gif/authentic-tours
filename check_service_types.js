
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const serviceTx = transactions.filter(t => t.category === 'GENERAL_SERVICE');

const types = {};
serviceTx.forEach(t => {
    types[t.type] = (types[t.type] || 0) + 1;
});
console.log(types);

const expenseService = serviceTx.filter(t => t.type === 'EXPENSE');
console.log(`\nExample Expense in Service:`);
console.log(expenseService.slice(0, 2));
