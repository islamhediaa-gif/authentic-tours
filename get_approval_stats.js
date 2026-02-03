const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

// 1. Identify trips for Jan 22 and Jan 26
const trips = backup.masterTrips || [];
const jan22Trip = trips.find(t => t.startDate === '2026-01-22' || t.name?.includes('22 يناير'));
const jan26Trip = trips.find(t => t.startDate === '2026-01-26' || t.name?.includes('26 يناير'));

function calculateProfitDeep(searchString, linkedId) {
    let revenue = 0;
    let cost = 0;
    
    backup.transactions.forEach(t => {
        if (t.isVoided) return;
        const isLinked = linkedId && (t.masterTripId === linkedId || t.programId === linkedId);
        const matchesText = searchString && t.description?.includes(searchString);
        
        if (isLinked || matchesText) {
            if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY' || (t.type === 'CASH' && matchesText && t.category === 'CASH')) {
                // If it matches text but is category CASH, we have to guess if it's revenue or cost
                // Usually Income/Revenue is positive
                if (t.description?.includes('قبض') || t.type === 'INCOME') {
                    revenue += Number(t.sellingPriceInBase || t.amountInBase || 0);
                    cost += Number(t.purchasePriceInBase || 0);
                } else if (t.description?.includes('صرف') || t.type === 'EXPENSE') {
                    cost += Number(t.amountInBase || 0);
                }
            } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
                cost += Number(t.amountInBase || 0);
            }
        }
    });
    return { revenue, cost, profit: revenue - cost };
}

const jan22 = calculateProfitDeep('22 يناير', '1768576135774');
const jan26_1 = calculateProfitDeep('26 يناير', '1768847095963');
const jan26_2 = calculateProfitDeep('26 يناير', '1768922423344');

console.log('--- Trip Profits (Deep Search) ---');
console.log(`Jan 22 Trip: Revenue: ${jan22.revenue}, Cost: ${jan22.cost}, Profit: ${jan22.profit}`);
console.log(`Jan 26 Trip: Revenue: ${jan26_1.revenue + jan26_2.revenue}, Cost: ${jan26_1.cost + jan26_2.cost}, Profit: ${jan22.profit - (jan26_1.cost + jan26_2.cost)}`);
// Actually jan26 search will find same transactions twice if I'm not careful. Let's do it right.

const jan26Final = calculateProfitDeep('26 يناير', null); // Text search is more reliable here since IDs are empty
// Wait, 'رحله' vs 'رحلة'.
const jan26Final2 = calculateProfitDeep('رحله 26 يناير', null); 

console.log(`\nJan 22 Final:`, jan22.profit);
console.log(`Jan 26 Final (Text Search):`, jan26Final.profit);

// If not found by date, list all trips to identify them
if (!jan22Trip || !jan26Trip) {
    console.log('\nAll Trips found:');
    trips.forEach(t => console.log(`- ID: ${t.id}, Name: ${t.name}, Date: ${t.startDate}`));
}

// 2. Total Expenses (Admin)
const ADMIN_CATEGORIES = [
  'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
  'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
  'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE'
];

const totalExpenses = backup.transactions
    .filter(t => t.type === 'EXPENSE' && ADMIN_CATEGORIES.includes(t.category) && !t.isVoided)
    .reduce((sum, t) => sum + Number(t.amountInBase || 0), 0);

console.log('\nTotal Admin Expenses:', totalExpenses);

// 3. Main Treasury Balance
const mainTreasury = (backup.treasuries || []).find(t => t.name?.includes('رئيسية') || t.id === 't1');
let treasuryBalance = 0;

if (mainTreasury) {
    backup.journalEntries.forEach(entry => {
        (entry.lines || []).forEach(line => {
            if (line.accountId === mainTreasury.id || line.treasuryId === mainTreasury.id) {
                treasuryBalance += (Number(line.debit || 0) - Number(line.credit || 0));
            }
        });
    });
    console.log(`\nMain Treasury (${mainTreasury.name}) Balance:`, treasuryBalance);
} else {
    console.log('\nMain Treasury not found.');
}
