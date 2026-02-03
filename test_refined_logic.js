const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22 Trip
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let revenue = 0;
let cost = 0;

const jes = backup.journalEntries || [];
jes.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
        if (!isLinked) return;

        const isPL = line.accountType === 'REVENUE' || line.accountType === 'EXPENSE';
        if (!isPL) return;

        const isIncome = (line.credit || 0) > 0;
        const amount = isIncome ? line.credit : line.debit;
        const rate = line.exchangeRate || 1;
        const amountBase = amount * rate;

        // MIRROR COST DETECTION
        // If it's an expense line named 'تكاليف حج وعمرة' and the JE has a revenue line with the same amount
        const isMirrorCost = !isIncome && line.accountName === 'تكاليف حج وعمرة' && entry.lines.some(l => 
            l.accountType === 'REVENUE' && Math.abs(l.credit - line.debit) < 0.01
        );

        if (isIncome) {
            revenue += amountBase;
        } else if (!isMirrorCost) {
            cost += amountBase;
        }
    });
});

console.log('--- Jan 22 REFINED LOGIC ---');
console.log('Target Revenue: 2,785,600');
console.log('Target Cost:    2,496,549.6');
console.log('Target Profit:  289,050.4');
console.log('----------------------------');
console.log('Calc Revenue:   ', revenue);
console.log('Calc Cost:      ', cost);
console.log('Calc Profit:    ', revenue - cost);
