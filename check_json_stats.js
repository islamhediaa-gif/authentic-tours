const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'Backup_Nebras_2026-01-29.json'), 'utf8'));
const transactions = data.transactions || [];

const purchaseOnly = transactions.filter(t => t.isPurchaseOnly);
const saleOnly = transactions.filter(t => t.isSaleOnly);
const bulkPurchase = transactions.filter(t => t.isPurchaseOnly && t.programId);

console.log('JSON Stats:');
console.log('Total Transactions:', transactions.length);
console.log('Purchase Only:', purchaseOnly.length);
console.log('Sale Only:', saleOnly.length);
console.log('Bulk Purchase (Program):', bulkPurchase.length);

const categories = new Set(purchaseOnly.map(t => t.category).filter(Boolean));
console.log('JSON JEs:', data.journalEntries.length);
let revenueMissingId = 0;
let expenseMissingId = 0;
let revenueMissingIdAmount = 0;
let expenseMissingIdAmount = 0;

data.journalEntries.forEach(entry => {
  (entry.lines || []).forEach(line => {
    if (!line.accountId) {
      if (line.accountType === 'REVENUE') {
        revenueMissingId++;
        revenueMissingIdAmount += (line.credit || 0) - (line.debit || 0);
      } else if (line.accountType === 'EXPENSE') {
        expenseMissingId++;
        expenseMissingIdAmount += (line.debit || 0) - (line.credit || 0);
      }
    }
  });
});

const treasuries = data.treasuries || [];
const customers = data.customers || [];
const suppliers = data.suppliers || [];
const partners = data.partners || [];

const tOB = treasuries.reduce((sum, t) => sum + (t.openingBalance || 0) * (t.exchangeRate || 1), 0);
const cOB = customers.reduce((sum, c) => sum + (c.openingBalanceInBase || 0), 0);
const sOB = suppliers.reduce((sum, s) => sum + (s.openingBalanceInBase || 0), 0);
const pOB = partners.reduce((sum, p) => sum + (p.openingBalance || 0), 0);

console.log('JSON Opening Balances:');
console.log('Treasuries:', tOB);
console.log('Customers:', cOB);
console.log('Suppliers:', sOB);
console.log('Partners:', pOB);
console.log('Implied Capital:', tOB + cOB - sOB - pOB);
