const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

const jeToTxTypes = new Map();
const jeToProgramId = new Map();
const programBulkPurchases = new Set();
const categoryBulkPurchases = new Set();

transactions.forEach(t => {
  if (t && t.journalEntryId) {
    if (!jeToTxTypes.has(t.journalEntryId)) jeToTxTypes.set(t.journalEntryId, new Set());
    let type = t.type || 'NORMAL';
    if (t.isSaleOnly) type = 'REVENUE_ONLY';
    if (t.isPurchaseOnly) type = 'PURCHASE_ONLY';
    jeToTxTypes.get(t.journalEntryId).add(type);
    if (t.programId) {
      jeToProgramId.set(t.journalEntryId, t.programId);
      if (t.isPurchaseOnly) programBulkPurchases.add(t.programId);
    }
    if (t.isPurchaseOnly && t.category) {
      categoryBulkPurchases.add(t.category);
    }
  }
});

let netProfit = 0;
let totalFiltered = 0;
let revenueFiltered = 0;
let expenseFiltered = 0;

journalEntries.forEach(entry => {
  const types = jeToTxTypes.get(entry.id) || new Set(['NORMAL']);
  const isPurchaseOnly = types.has('PURCHASE_ONLY');
  const isRevenueOnly = types.has('REVENUE_ONLY');
  const programId = jeToProgramId.get(entry.id);
  
  let categoryHint = '';
  if (!isPurchaseOnly && !isRevenueOnly) {
    const hasFlightCost = (entry.lines || []).some(l => l.accountId === 'FLIGHT_COST');
    const hasUmrahCost = (entry.lines || []).some(l => l.accountId === 'HAJJ_UMRAH_COST');
    if (hasFlightCost) categoryHint = 'FLIGHT';
    else if (hasUmrahCost) categoryHint = 'HAJJ_UMRAH';
  }

  (entry.lines || []).forEach(line => {
    let filtered = false;
    if (isPurchaseOnly && !isRevenueOnly && (line.accountType === 'REVENUE' || line.accountType === 'CUSTOMER')) filtered = true;
    else if (isRevenueOnly && !isPurchaseOnly && (line.accountType === 'EXPENSE' || line.accountType === 'SUPPLIER')) filtered = true;
    else if (programId && programBulkPurchases.has(programId) && !isPurchaseOnly && (line.accountType === 'EXPENSE' || line.accountType === 'SUPPLIER')) filtered = true;
    else if (!isPurchaseOnly && (line.accountType === 'EXPENSE' || line.accountType === 'SUPPLIER') && categoryBulkPurchases.has(categoryHint)) filtered = true;

    if (filtered) {
      totalFiltered++;
      if (line.accountType === 'REVENUE') revenueFiltered++;
      if (line.accountType === 'EXPENSE') expenseFiltered++;
      return;
    }

    if (line.accountType === 'REVENUE') {
      netProfit += (line.credit || 0) - (line.debit || 0);
    } else if (line.accountType === 'EXPENSE') {
      netProfit -= (line.debit || 0) - (line.credit || 0);
    }
  });
});

console.log('Calculated Net Profit:', netProfit);
console.log('Total Filtered Lines:', totalFiltered);
console.log('Revenue Lines Filtered:', revenueFiltered);
console.log('Expense Lines Filtered:', expenseFiltered);
