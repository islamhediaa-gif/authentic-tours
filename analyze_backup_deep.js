
const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

function analyzeData() {
    const transactions = backup.transactions || [];
    console.log(`Total Transactions in Backup: ${transactions.length}`);

    let totalRevenue = 0;
    let totalCost = 0;
    let transactionsMissingCost = [];

    transactions.forEach(t => {
        if (t.isVoided) return;
        
        const type = t.type || 'INCOME';
        if (type === 'INCOME' || type === 'REVENUE_ONLY') {
            const rev = Number(t.sellingPriceInBase || t.amountInBase || 0);
            const cost = Number(t.purchasePriceInBase || 0);
            
            totalRevenue += rev;
            totalCost += cost;

            if (rev > 0 && cost === 0) {
                transactionsMissingCost.push({
                    date: t.date,
                    desc: t.description,
                    amount: rev
                });
            }
        } else if (type === 'EXPENSE' || type === 'PURCHASE_ONLY') {
            // General expenses already handled in net profit calculation if we want bottom line
            // But here we are looking for operational profit
        }
    });

    console.log(`\nGross Profit (Revenue - Direct Cost): ${(totalRevenue - totalCost).toLocaleString()} EGP`);
    console.log(`Total Transactions with 0 Cost: ${transactionsMissingCost.length}`);
    
    const potentialLostCosts = transactionsMissingCost.reduce((sum, t) => sum + t.amount, 0);
    console.log(`Potential hidden costs (if margin is 10%): ${(potentialLostCosts * 0.9).toLocaleString()} EGP`);

    console.log("\nTop 10 Transactions with 0 Cost:");
    console.table(transactionsMissingCost.sort((a, b) => b.amount - a.amount).slice(0, 10));
}

analyzeData();
