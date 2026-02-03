
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const tx = data.transactions || [];
const je = data.journalEntries || [];

console.log('Transactions Count:', tx.length);
console.log('Journal Entries Count:', je.length);

const ADMIN_CATEGORIES = [
  'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
  'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
  'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE'
];

let hajjRev = 0, flightRev = 0, otherRev = 0;
let hajjCost = 0, flightCost = 0, otherCost = 0;
let adminExpenses = 0;

const processedRefNos = new Set();

tx.forEach(t => {
  if (t.isVoided) return;
  const amount = Number(t.amountInBase || t.sellingPriceInBase || 0);
  const cost = Number(t.purchasePriceInBase || 0);
  const cat = t.category || '';
  
  if (cat === 'HAJJ_UMRAH' || t.programId || t.masterTripId) {
    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        hajjRev += amount;
        hajjCost += cost;
    } else {
        hajjCost += amount;
    }
    if (t.refNo) processedRefNos.add(t.refNo);
  }
});

tx.forEach(t => {
    if (t.isVoided) return;
    const cat = t.category || '';
    if (cat === 'HAJJ_UMRAH' || t.programId || t.masterTripId) return;
    
    // Skip if already processed in Hajj (tickets/visas)
    if (t.refNo && processedRefNos.has(t.refNo)) return;

    const amount = Number(t.amountInBase || t.sellingPriceInBase || 0);
    const cost = Number(t.purchasePriceInBase || 0);

    if (cat.startsWith('FLIGHT')) {
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
            flightRev += amount;
            flightCost += cost;
        } else {
            flightCost += amount;
        }
    } else if (ADMIN_CATEGORIES.includes(cat)) {
        adminExpenses += (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') ? amount : -amount;
    } else if (cat !== 'CASH') {
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
            otherRev += amount;
            otherCost += cost;
        } else {
            otherCost += amount;
        }
    }
});

const totalRev = hajjRev + flightRev + otherRev;
const totalDirectCost = hajjCost + flightCost + otherCost;
const grossProfit = totalRev - totalDirectCost;
const netProfit = grossProfit - adminExpenses;

console.log('--- Results from Backup Jan 29 ---');
console.log('Hajj Revenue:', hajjRev);
console.log('Hajj Cost:', hajjCost);
console.log('Flight Revenue:', flightRev);
console.log('Flight Cost:', flightCost);
console.log('Other Revenue:', otherRev);
console.log('Other Cost:', otherCost);
console.log('Admin Expenses:', adminExpenses);
console.log('Total Revenue:', totalRev);
console.log('Total Direct Cost:', totalDirectCost);
console.log('Gross Profit:', grossProfit);
console.log('Net Profit:', netProfit);
