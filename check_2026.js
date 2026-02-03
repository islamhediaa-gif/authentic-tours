
const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const ADMIN_CATEGORIES = [
  'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
  'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
  'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE'
];

function analyze2026() {
    const transactions = backup.transactions || [];
    const startDate = '2026-01-01';
    const endDate = '2026-12-31';

    let rev = 0;
    let cost = 0;
    let admin = 0;

    transactions.forEach(t => {
        if (t.isVoided || t.date < startDate || t.date > endDate) return;
        if (t.category === 'CASH') return;

        const type = t.type || 'INCOME';
        if (type === 'INCOME' || type === 'REVENUE_ONLY') {
            rev += Number(t.sellingPriceInBase || t.amountInBase || 0);
            cost += Number(t.purchasePriceInBase || 0);
        } else if (type === 'EXPENSE' || type === 'PURCHASE_ONLY') {
            if (ADMIN_CATEGORIES.includes(t.category)) {
                admin += Number(t.amountInBase || 0);
            } else {
                cost += Number(t.amountInBase || 0);
            }
        }
    });

    console.log(`Results for 2026:`);
    console.log(`Revenue: ${rev.toLocaleString()}`);
    console.log(`Direct Cost: ${cost.toLocaleString()}`);
    console.log(`Admin Expenses: ${admin.toLocaleString()}`);
    console.log(`Net Profit: ${(rev - cost - admin).toLocaleString()}`);
}

analyze2026();
