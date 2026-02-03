
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

const sorted = transactions
    .map(t => ({ 
        ...t, 
        totalCost: (t.type === 'EXPENSE' ? t.amountInBase : (t.purchasePriceInBase || 0)) 
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

console.log("--- Top 20 Most Expensive Transactions ---");
sorted.slice(0, 20).forEach(t => {
    console.log(`${t.id.padEnd(20)} | ${t.category.padEnd(15)} | Cost=${t.totalCost.toFixed(2)} | Desc=${t.description}`);
});
