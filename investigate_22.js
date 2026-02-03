const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const trip22Id = "1768576135774";
console.log('--- Detailed Costs for Trip 22 Jan ---');

data.transactions.forEach(tx => {
    if (tx.masterTripId === trip22Id && tx.type !== 'INCOME' && tx.type !== 'REVENUE_ONLY') {
        console.log(`TX: ${tx.description}, Amount: ${tx.amount}, Category: ${tx.category}, JE-ID: ${tx.journalEntryId || 'NONE'}`);
    }
});

data.journalEntries.forEach(je => {
    je.lines.forEach(line => {
        if (line.costCenterId === trip22Id && (line.debit || 0) > 0) {
            console.log(`JE: ${je.description} - ${line.accountName}, Amount: ${line.debit}, Type: ${line.accountType}`);
        }
    });
});
