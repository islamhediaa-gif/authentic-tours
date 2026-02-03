const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let supplierCosts = 0;
let flightCosts = 0;
let generalExpenses = 0;

const jes = backup.journalEntries || [];
jes.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
        if (!isLinked) return;

        const rate = line.exchangeRate || 1;
        const amount = (line.debit || 0) * rate;

        if (line.accountType === 'SUPPLIER') {
            supplierCosts += amount;
        } else if (line.accountName && line.accountName.includes('طيران')) {
            flightCosts += amount;
        } else if (line.accountType === 'EXPENSE' && !line.accountName.includes('تكاليف حج وعمرة')) {
            generalExpenses += amount;
        }
    });
});

console.log('Supplier Costs (Debit):', supplierCosts);
console.log('Flight Costs (Debit):', flightCosts);
console.log('General Expenses (Debit):', generalExpenses);
console.log('Sum:', supplierCosts + flightCosts + generalExpenses);
