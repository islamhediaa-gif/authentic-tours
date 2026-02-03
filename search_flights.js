const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

console.log('--- Transactions with "طيران" ---');
transactions.forEach(tx => {
    if (tx.description && tx.description.includes('طيران')) {
        console.log(`${tx.date} | ${tx.description} | Amount: ${tx.amount} | Purchase: ${tx.purchasePrice} | Type: ${tx.type}`);
    }
});

console.log('\n--- Journal Entries with "طيران" ---');
journalEntries.forEach(entry => {
    entry.lines.forEach(line => {
        if (line.accountName && line.accountName.includes('طيران')) {
            console.log(`${entry.date} | ${line.accountName} | Debit: ${line.debit} | Credit: ${line.credit} | Desc: ${entry.description}`);
        }
    });
});
