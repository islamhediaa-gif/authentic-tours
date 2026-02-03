const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip ID
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let totalIncome = 0;
let totalExpense = 0;

const jes = backup.journalEntries || [];
jes.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
        if (!isLinked) return;

        const isPL = line.accountType === 'REVENUE' || line.accountType === 'EXPENSE';
        if (!isPL) return;

        const amount = (line.credit || 0) > 0 ? line.credit : line.debit;
        const isIncome = (line.credit || 0) > 0;

        if (isIncome) totalIncome += amount;
        else totalExpense += amount;

        if (entry.refNo === 'RV-0347') {
            console.log(`RV-0347 Line: ${line.accountName}, Type: ${line.accountType}, Amount: ${amount}, IsIncome: ${isIncome}`);
        }
    });
});

console.log('--- FINAL TOTALS ---');
console.log('Total Income:', totalIncome);
console.log('Total Expense:', totalExpense);
console.log('Net Profit:', totalIncome - totalExpense);
