const fs = require('fs');
const files = [
    'D:\\authentic\\Backup_Nebras_2026-01-29.json',
    'D:\\backup\\Backup_Nebras_2026-01-25.json',
    'D:\\backup\\Backup_Nebras_2026-01-23.json',
    'D:\\backup\\Backup_Nebras_2026-01-22.json',
    'D:\\backup\\Backup_Nebras_2026-01-21.json'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        try {
            const data = JSON.parse(fs.readFileSync(f, 'utf8'));
            const tx = data.transactions || [];
            let income = 0;
            let costs = 0;
            let expenses = 0;
            
            tx.forEach(t => {
                const sell = Number(t.sellingPriceInBase || 0);
                const buy = Number(t.purchasePriceInBase || 0);
                const amt = Number(t.amountInBase || 0);
                
                if (t.type === 'INCOME') {
                    income += sell > 0 ? sell : amt;
                    costs += buy;
                } else if (t.type === 'EXPENSE' || t.type === 'PARTNER_WITHDRAWAL') {
                    expenses += amt;
                }
            });
            
            const profit = income - costs - expenses;
            console.log(`File: ${f}`);
            console.log(`- Transactions: ${tx.length}`);
            console.log(`- Total Sales: ${income.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
            console.log(`- Op Costs: ${costs.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
            console.log(`- Expenses: ${expenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
            console.log(`- Net Profit: ${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
            console.log('-------------------');
        } catch (e) {
            console.log(`Error reading ${f}: ${e.message}`);
        }
    }
});