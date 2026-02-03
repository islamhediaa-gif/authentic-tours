
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];

const txToJe = {};
journalEntries.forEach(je => {
    if (je.relatedTransactionId) {
        if (!txToJe[je.relatedTransactionId]) txToJe[je.relatedTransactionId] = [];
        txToJe[je.relatedTransactionId].push(je.id);
    }
});

const duplicates = Object.entries(txToJe).filter(([txId, jes]) => jes.length > 1);

console.log(`Total transactions with JEs: ${Object.keys(txToJe).length}`);
console.log(`Transactions with multiple JEs: ${duplicates.length}`);

if (duplicates.length > 0) {
    console.log("\n--- Example Duplicates ---");
    duplicates.slice(0, 5).forEach(([txId, jes]) => {
        console.log(`Tx ID: ${txId} | JEs: ${jes.join(', ')}`);
        jes.forEach(jeId => {
            const je = journalEntries.find(j => j.id === jeId);
            console.log(`  JE ${jeId}: Date=${je.date}, Description=${je.description}, Lines=${je.lines.length}`);
        });
    });
}
