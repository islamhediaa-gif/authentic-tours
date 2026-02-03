const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const cashIncome = backup.transactions.filter(t => t.type === 'INCOME' && t.category === 'CASH');

console.log('Sample Cash Income Transactions:');
cashIncome.slice(0, 10).forEach(t => {
    console.log(`- [${t.date}] ${t.amountInBase} EGP: ${t.description}`);
});

const total = cashIncome.reduce((sum, t) => sum + Number(t.amountInBase || 0), 0);
console.log('Total Cash Income:', total);
