const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const selectedTripId = '1768576135774'; // Jan 22 Trip
const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];
const programs = data.programs || [];

const tripPrograms = programs.filter(p => p.masterTripId === selectedTripId);
const linkedProgramIds = new Set(tripPrograms.map(p => p.id));

const txByRef = new Map();
transactions.forEach(tx => {
    if (tx && tx.refNo) txByRef.set(tx.refNo, tx);
});

const transactionsInJs = new Set();
journalEntries.forEach(je => {
    (je.lines || []).forEach(l => {
        if (l.transactionId) transactionsInJs.add(l.transactionId);
    });
});

let expenses = [];

// Transactions
transactions.forEach(tx => {
    if (!tx || tx.isVoided || transactionsInJs.has(tx.id) || tx.journalEntryId) return;
    
    const isDirectlyLinked = tx.masterTripId === selectedTripId;
    const isLinkedViaProgram = tx.programId && linkedProgramIds.has(tx.programId);

    if (isDirectlyLinked || isLinkedViaProgram) {
        if (tx.type !== 'EXPENSE' && tx.type !== 'EXPENSE_ONLY') return;
        const rate = tx.exchangeRate || 1;
        const amountBase = (tx.amount || 0) * rate;
        expenses.push({
            amount: amountBase,
            account: 'TX_' + (tx.category || 'OTHER'),
            ref: tx.refNo,
            desc: tx.description
        });
    }
});

// Journal Entries
journalEntries.forEach(entry => {
    const lines = entry.lines || [];
    const revenueAmounts = new Set();
    lines.forEach(l => {
        if (l.accountType === 'REVENUE' && (l.credit || 0) > 0) {
            revenueAmounts.add(l.credit || 0);
        }
    });

    const entryRef = entry.refNo;
    const linkedTx = entryRef ? txByRef.get(entryRef) : null;
    const isEntryLinkedViaTx = linkedTx && (
        linkedTx.masterTripId === selectedTripId || 
        (linkedTx.programId && linkedProgramIds.has(linkedTx.programId))
    );

    lines.forEach(line => {
        let isLinked = line.costCenterId === selectedTripId || 
                       (line.programId && linkedProgramIds.has(line.programId));
        
        if (!isLinked && isEntryLinkedViaTx) isLinked = true;

        if (isLinked) {
            if (line.accountType !== 'EXPENSE') return;

            const amount = line.debit || 0;
            if (amount === 0) return;

            // Mirror Cost Filter
            if (revenueAmounts.has(amount)) {
                // Potential mirror cost
                return;
            }

            const rate = line.exchangeRate || 1;
            const amountBase = line.originalAmount ? (line.originalAmount * rate) : (amount * rate);

            expenses.push({
                amount: amountBase,
                account: line.accountName,
                ref: entry.refNo,
                desc: entry.description
            });
        }
    });
});

const grouped = {};
expenses.forEach(e => {
    grouped[e.account] = (grouped[e.account] || 0) + e.amount;
});

console.log('Expenses by Account:', grouped);
let total = 0;
Object.values(grouped).forEach(v => total += v);
console.log('Total Expenses:', total);
