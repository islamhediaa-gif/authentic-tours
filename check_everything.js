const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

// 1. Treasuries
console.log('--- TREASURIES ---');
backup.treasuries.forEach(t => {
    let balance = 0;
    backup.journalEntries.forEach(entry => {
        (entry.lines || []).forEach(line => {
            if (line.accountId === t.id || line.treasuryId === t.id) {
                balance += (Number(line.debit || 0) - Number(line.credit || 0));
            }
        });
    });
    console.log(`${t.name} (ID: ${t.id}): ${balance.toFixed(2)}`);
});

// 2. Trip Profits
function getTripProfit(namePart, linkedId) {
    let revenue = 0;
    let cost = 0;
    backup.transactions.forEach(t => {
        if (t.isVoided) return;
        const matchesName = namePart && t.description?.includes(namePart);
        const matchesId = linkedId && (t.masterTripId === linkedId || t.programId === linkedId);
        
        if (matchesName || matchesId) {
            if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
                revenue += Number(t.sellingPriceInBase || t.amountInBase || 0);
                cost += Number(t.purchasePriceInBase || 0);
            } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
                cost += Number(t.amountInBase || 0);
            } else if (t.type === 'CASH' && matchesName) {
                // Heuristic for unlinked transactions
                if (t.description.includes('قبض')) revenue += Number(t.amountInBase || 0);
                if (t.description.includes('صرف')) cost += Number(t.amountInBase || 0);
            }
        }
    });
    return { revenue, cost, profit: revenue - cost };
}

console.log('\n--- TRIP PROFITS ---');
const p22 = getTripProfit('22 يناير', '1768576135774');
console.log(`رحلة 22 يناير: ربح ${p22.profit.toFixed(2)} (إيراد ${p22.revenue.toFixed(2)}, تكلفة ${p22.cost.toFixed(2)})`);

const p26 = getTripProfit('26 يناير', '1768847095963');
const p26_alt = getTripProfit('26 يناير', '1768922423344');
const combinedProfit26 = p26.profit + p26_alt.profit; // Careful with overlap
// Let's just use text search for 26 since it covers both and unlinked
const p26_text = getTripProfit('26 يناير', null);
console.log(`رحلة 26 يناير: ربح ${p26_text.profit.toFixed(2)} (إيراد ${p26_text.revenue.toFixed(2)}, تكلفة ${p26_text.cost.toFixed(2)})`);

// 3. Admin Expenses
const ADMIN_CATEGORIES = [
  'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
  'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
  'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE'
];
const adminExp = backup.transactions
    .filter(t => t.type === 'EXPENSE' && ADMIN_CATEGORIES.includes(t.category) && !t.isVoided)
    .reduce((s, t) => s + Number(t.amountInBase || 0), 0);
console.log(`\nإجمالي المصاريف الإدارية: ${adminExp.toFixed(2)}`);
