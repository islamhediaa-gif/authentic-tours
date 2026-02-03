
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

// Find an individual flight in that program
const ind = transactions.find(t => t.description.includes('برايد اند جوي') && t.category === 'FLIGHT' && t.type === 'INCOME');

if (ind) {
    console.log(`Individual Tx: ID=${ind.id}, Desc=${ind.description}, PurchasePrice=${ind.purchasePrice}`);
    const je = journalEntries.find(j => j.id === ind.journalEntryId);
    console.log(`JE ${je?.id} lines:`);
    je?.lines?.forEach(l => console.log(`  ${l.accountType} | ${l.accountId} | ${l.debit} | ${l.credit}`));
} else {
    console.log("No individual flight found for this program.");
}
