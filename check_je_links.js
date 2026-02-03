const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const countWithJE = transactions.filter(tx => tx.journalEntryId).length;
const countWithoutJE = transactions.filter(tx => !tx.journalEntryId).length;

console.log(`Transactions with journalEntryId: ${countWithJE}`);
console.log(`Transactions WITHOUT journalEntryId: ${countWithoutJE}`);

if (countWithoutJE > 0) {
    console.log('Sample without JE:');
    console.log(transactions.find(tx => !tx.journalEntryId));
}
