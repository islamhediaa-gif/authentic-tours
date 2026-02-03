const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'public', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const txs = db.transactions || [];
const accounts = db.accounts || [];

// Calculate Gross Profit from Sales (Revenue - Purchase Price)
let totalRevenue = 0;
let totalDirectCosts = 0;

txs.forEach(tx => {
    if (tx.type === 'income' || tx.type === 'sale') {
        const revenue = parseFloat(tx.amount) || 0;
        const purchasePrice = parseFloat(tx.purchasePrice) || 0;
        
        totalRevenue += revenue;
        totalDirectCosts += purchasePrice;
    }
});

const grossProfit = totalRevenue - totalDirectCosts;

// Calculate General Expenses from Trial Balance (Account Types: Expense)
// Note: We ignore "Direct Costs" accounts if we are using purchasePrice logic
const expenseAccounts = accounts.filter(acc => acc.type === 'expense' && acc.category !== 'Direct Cost');
let totalGeneralExpenses = 0;

expenseAccounts.forEach(acc => {
    const balance = parseFloat(acc.balance) || 0;
    totalGeneralExpenses += balance;
});

const netProfit = grossProfit - totalGeneralExpenses;

console.log('--- P&L Analysis ---');
console.log(`Total Revenue: ${totalRevenue.toLocaleString()}`);
console.log(`Total Direct Costs (from sales): ${totalDirectCosts.toLocaleString()}`);
console.log(`Gross Profit: ${grossProfit.toLocaleString()}`);
console.log(`Total General Expenses: ${totalGeneralExpenses.toLocaleString()}`);
console.log(`Net Profit: ${netProfit.toLocaleString()}`);
console.log('--------------------');
