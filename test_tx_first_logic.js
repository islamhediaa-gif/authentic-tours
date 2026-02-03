const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const TRIP_ID = '1768576135774'; // Jan 22
const programs = (backup.programs || []).filter(p => p.masterTripId === TRIP_ID);
const programIds = new Set(programs.map(p => p.id));

let revenue = 0;
let cost = 0;

const txRefs = new Set();
const txIds = new Set();

(backup.transactions || []).forEach(tx => {
    if (tx.isVoided) return;
    const isLinked = tx.masterTripId === TRIP_ID || (tx.programId && programIds.has(tx.programId));
    if (!isLinked) return;

    txRefs.add(tx.refNo);
    txIds.add(tx.id);

    const amount = (tx.amount || 0) * (tx.exchangeRate || 1);
    if (tx.type === 'INCOME' || tx.type === 'REVENUE_ONLY') {
        revenue += amount;
    } else {
        cost += amount;
    }
});

(backup.journalEntries || []).forEach(je => {
    if (txRefs.has(je.refNo)) return; // Exclude JEs that have transactions
    
    (je.lines || []).forEach(line => {
        if (line.transactionId && txIds.has(line.transactionId)) return;
        
        const isLinked = line.costCenterId === TRIP_ID || (line.programId && programIds.has(line.programId));
        if (!isLinked) return;

        if (line.accountType === 'REVENUE') {
            revenue += (line.credit || 0) * (line.exchangeRate || 1);
        } else if (line.accountType === 'EXPENSE') {
            cost += (line.debit || 0) * (line.exchangeRate || 1);
        }
    });
});

console.log('--- Jan 22 TRANSACTION-FIRST LOGIC ---');
console.log('Revenue:', revenue);
console.log('Cost:', cost);
console.log('Profit:', revenue - cost);
