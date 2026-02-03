const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

let assets = 0;
let liabilities = 0;

// Treasuries
data.treasuries.forEach(t => {
    const ob = t.openingBalance || 0;
    if (ob > 0) assets += ob;
    else liabilities += Math.abs(ob);
});

// Customers
data.customers.forEach(c => {
    const ob = c.openingBalanceInBase || 0;
    if (ob > 0) assets += ob;
    else liabilities += Math.abs(ob);
});

// Suppliers
data.suppliers.forEach(s => {
    const ob = s.openingBalanceInBase || 0;
    if (ob > 0) liabilities += ob; // Suppliers credit is liability
    else assets += Math.abs(ob);
});

// Partners
data.partners.forEach(p => {
    const ob = p.openingBalance || 0;
    if (ob > 0) liabilities += ob; // Partner credit is equity/liability
    else assets += Math.abs(ob);
});

console.log('Total Opening Assets:', assets);
console.log('Total Opening Liabilities:', liabilities);
console.log('Implied Capital:', assets - liabilities);
