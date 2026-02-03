const fs = require('fs');

const files = [
    'd:/authentic/Backup_Nebras_2026-01-29.json',
    'd:/authentic/Backup_Nebras_Cleaned.json',
    'd:/authentic/Backup_Nebras_Deduplicated.json',
    'd:/authentic/Backup_Nebras_Updated.json'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;

    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const txs = data.transactions || [];
        
        let sales = 0;
        let costs = 0;
        let expenses = 0;
        
        txs.forEach(t => {
            const type = (t.type || '').toUpperCase();
            
            if (type === 'INCOME' || type === 'SALE' || type === 'REVENUE_ONLY') {
                sales += (Number(t.sellingPriceInBase) || 0);
                costs += (Number(t.purchasePriceInBase) || 0);
            } else if (type === 'EXPENSE' || type === 'OPERATIONAL_EXPENSE') {
                expenses += (Number(t.amountInBase) || 0);
            }
        });
            
        const profit = sales - costs - expenses;

        console.log(`--- Results for ${file} ---`);
        console.log(`TX Count: ${txs.length}`);
        console.log(`Total Sales: ${sales.toLocaleString()}`);
        console.log(`Total Costs: ${costs.toLocaleString()}`);
        console.log(`Total Expenses: ${expenses.toLocaleString()}`);
        console.log(`NET PROFIT: ${profit.toLocaleString()}`);
        console.log('----------------------------\n');
    } catch (e) {
        console.log(`Error parsing ${file}: ${e.message}`);
    }
});
