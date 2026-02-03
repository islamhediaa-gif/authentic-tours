const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

const txJeIds = new Set(transactions.map(t => t.journalEntryId).filter(id => !!id));

let orphanExpJE = 0;
journalEntries.forEach(je => {
    if (je.isVoided) return;
    const isExpense = (je.lines || []).some(l => l.accountType === 'EXPENSE');
    if (isExpense && !txJeIds.has(je.id)) {
        orphanExpJE++;
        console.log(`Orphan Expense JE: ${je.id} | Date: ${je.date} | Desc: ${je.description}`);
    }
});

console.log(`Total Orphan Expense JEs: ${orphanExpJE}`);
