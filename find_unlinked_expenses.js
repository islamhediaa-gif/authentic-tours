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
    if (tx && tx.refNo && !tx.isVoided) txByRef.set(tx.refNo, tx);
});

journalEntries.forEach(entry => {
    // Only look at Jan 22 period (approx)
    if (!entry.date || !entry.date.startsWith('2026-01')) return;

    const lines = entry.lines || [];
    const entryRef = entry.refNo;
    const linkedTx = entryRef ? txByRef.get(entryRef) : null;
    const isEntryLinkedViaTx = linkedTx && (
        linkedTx.masterTripId === selectedTripId || 
        (linkedTx.programId && linkedProgramIds.has(linkedTx.programId))
    );

    let hasUnlinkedExpense = false;
    lines.forEach(l => {
        if (l.accountType === 'EXPENSE' && (l.debit || 0) > 0) {
            const isLinked = l.costCenterId === selectedTripId || (l.programId && linkedProgramIds.has(l.programId)) || isEntryLinkedViaTx;
            if (!isLinked) {
                console.log('Unlinked Expense:', entry.refNo, entry.description, l.accountName, l.debit);
            }
        }
    });
});
