
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

let totalIncome = 0;
let totalExpense = 0;

// Transactions
transactions.forEach(tx => {
    if (!tx || tx.isVoided || transactionsInJs.has(tx.id) || tx.journalEntryId) return;
    
    const isDirectlyLinked = tx.masterTripId === selectedTripId;
    const isLinkedViaProgram = tx.programId && linkedProgramIds.has(tx.programId);

    if (isDirectlyLinked || isLinkedViaProgram) {
        const rate = tx.exchangeRate || 1;
        const amountBase = (tx.amount || 0) * rate;
        if (tx.type === 'INCOME' || tx.type === 'REVENUE_ONLY') {
            totalIncome += amountBase;
        } else {
            totalExpense += amountBase;
        }
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
            const isPLAccount = line.accountType === 'EXPENSE' || line.accountType === 'REVENUE';
            if (!isPLAccount) return;

            const isIncome = (line.credit || 0) > 0;
            const amount = isIncome ? (line.credit || 0) : (line.debit || 0);
            
            // Mirror Cost Filter
            let isFiltered = false;
            if (line.accountType === 'EXPENSE' && amount > 0 && revenueAmounts.has(amount)) {
                // Check if account name contains 'تسكين' or similar to be sure it's a mirror cost
                if (line.accountName && (line.accountName.includes('تسكين') || line.accountName.includes('إقامة'))) {
                    isFiltered = true;
                }
            }

            const rate = line.exchangeRate || 1;
            const amountBase = line.originalAmount ? (line.originalAmount * rate) : (amount * rate);

            if (isFiltered) {
                console.log('Filtered Mirror Cost:', amountBase, line.accountName, entry.refNo);
                return; 
            }

            if (isIncome) totalIncome += amountBase;
            else {
                totalExpense += amountBase;
                // console.log('Expense Added:', amountBase, line.accountName, entry.refNo);
            }
        }
    });
});

console.log('Total Income:', totalIncome);
console.log('Total Expense:', totalExpense);
console.log('Net Profit:', totalIncome - totalExpense);
console.log('Target Profit: 289,050.4');
console.log('Difference:', (totalIncome - totalExpense) - 289050.4);
