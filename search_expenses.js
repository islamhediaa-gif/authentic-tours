const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

console.log('--- Transactions with "مصاريف" ---');
transactions.forEach(tx => {
    if (tx.description && tx.description.includes('مصاريف') || (tx.category === 'EXPENSE')) {
        console.log(`${tx.date} | ${tx.description} | Amount: ${tx.amount} | Cat: ${tx.category}`);
    }
});

console.log('\n--- Journal Entries with "مصاريف" ---');
journalEntries.forEach(entry => {
    entry.lines.forEach(line => {
        if ((line.accountName && line.accountName.includes('مصاريف')) || line.accountType === 'EXPENSE') {
            console.log(`${entry.date} | ${line.accountName} | Debit: ${line.debit} | Credit: ${line.credit} | Desc: ${entry.description}`);
        }
    });
});
