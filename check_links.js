
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || data.journal || [];

const txIdsInJE = new Set();
const jeIdsInTx = new Set();

transactions.forEach(t => {
    if (t.journalEntryId) jeIdsInTx.add(t.journalEntryId);
});

journalEntries.forEach(e => {
    txIdsInJE.add(e.id); // Assuming e.id matches tx.journalEntryId
});

console.log('Total Transactions:', transactions.length);
console.log('Total Journal Entries:', journalEntries.length);

const jesWithoutTx = journalEntries.filter(e => !jeIdsInTx.has(e.id));
console.log('Journal Entries not linked to any Transaction:', jesWithoutTx.length);

const costAccounts = ['HAJJ_UMRAH_COST', 'FLIGHT_COST', 'SERVICE_COST'];
let unlinkedCost = 0;
jesWithoutTx.forEach(e => {
    (e.lines || []).forEach(l => {
        if (costAccounts.includes(l.accountId)) {
            unlinkedCost += (Number(l.debit || 0) - Number(l.credit || 0));
        }
    });
});
console.log('Cost from unlinked Journal Entries:', unlinkedCost);

// Check if some transactions share the same journal entry id
const jeUsage = {};
transactions.forEach(t => {
    if (t.journalEntryId) {
        if (!jeUsage[t.journalEntryId]) jeUsage[t.journalEntryId] = 0;
        jeUsage[t.journalEntryId]++;
    }
});
const sharedJEs = Object.entries(jeUsage).filter(([id, count]) => count > 1);
console.log('Journal Entries shared by multiple Transactions:', sharedJEs.length);
