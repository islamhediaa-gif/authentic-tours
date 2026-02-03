const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const analysis = {};

backup.transactions.forEach(t => {
    const key = `${t.type} | ${t.category}`;
    const amount = Number(t.sellingPriceInBase || t.amountInBase || 0);
    if (!analysis[key]) analysis[key] = { count: 0, total: 0 };
    analysis[key].count++;
    analysis[key].total += amount;
});

console.log('Mapping of Type | Category to Total (using sellingPrice fallback):');
console.log(JSON.stringify(analysis, null, 2));
