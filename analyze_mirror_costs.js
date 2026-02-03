const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774';
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let totalIncome = 0;
let totalExpense = 0;
let mirrorCosts = 0;

const jes = backup.journalEntries || [];
jes.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
        if (!isLinked) return;

        const isPL = line.accountType === 'REVENUE' || line.accountType === 'EXPENSE';
        if (!isPL) return;

        const amount = (line.credit || 0) > 0 ? line.credit : line.debit;
        const isIncome = (line.credit || 0) > 0;

        if (isIncome) {
            totalIncome += amount;
        } else {
            // Check if this expense is a "Mirror" cost in the same JE
            const hasMirrorRevenue = entry.lines.some(l => 
                l.accountType === 'REVENUE' && 
                Math.abs(l.credit - line.debit) < 0.01 && 
                l.programId === line.programId &&
                l.componentId === line.componentId
            );
            
            if (hasMirrorRevenue && line.accountName === 'تكاليف حج وعمرة') {
                mirrorCosts += amount;
            } else {
                totalExpense += amount;
            }
        }
    });
});

console.log('--- ANALYSIS ---');
console.log('Total Income:', totalIncome);
console.log('Actual Expense:', totalExpense);
console.log('Mirror Costs (Excluded):', mirrorCosts);
console.log('Net Profit:', totalIncome - totalExpense);
