const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

// Similar logic to useIncomeStatement.ts
const ADMIN_CATEGORIES = [
  'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
  'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
  'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE'
];

let totalRevenue = 0;
let totalDirectCost = 0;
const costRefs = new Set();

backup.transactions.forEach(t => {
    const type = t.type || 'INCOME';
    const cat = t.category || '';
    if (cat === 'CASH') return; // Skip Receipt/Payment Vouchers

    const isHajj = cat === 'HAJJ_UMRAH' || !!t.programId || !!t.masterTripId;
    const isFlight = !isHajj && cat.startsWith('FLIGHT');
    const isService = !isHajj && !isFlight && cat !== 'CASH' && !ADMIN_CATEGORIES.includes(cat);

    if (type === 'INCOME' || type === 'REVENUE_ONLY') {
        const amount = Number(t.sellingPriceInBase || t.amountInBase || 0);
        totalRevenue += amount;
        
        const saleCost = Number(t.purchasePriceInBase || 0);
        if (saleCost > 0) {
            totalDirectCost += saleCost;
            if (t.refNo) costRefs.add(t.refNo);
        }
    } else if ((type === 'EXPENSE' || type === 'PURCHASE_ONLY') && !ADMIN_CATEGORIES.includes(cat)) {
        if (!t.refNo || !costRefs.has(t.refNo)) {
            const amount = Number(t.amountInBase || 0);
            totalDirectCost += amount;
            if (t.refNo) costRefs.add(t.refNo);
        }
    }
});

console.log('Calculated Revenue:', totalRevenue);
console.log('Calculated Direct Cost:', totalDirectCost);
console.log('Gross Profit:', totalRevenue - totalDirectCost);
