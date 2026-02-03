
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

const bulkCandidates = transactions.filter(t => t.type === 'EXPENSE' && (t.category === 'FLIGHT' || t.category === 'GENERAL_SERVICE') && t.amountInBase > 50000);

console.log("--- Large Bulk Purchases ---");
bulkCandidates.forEach(t => {
    console.log(`Date: ${t.date} | ID: ${t.id} | Amount: ${t.amountInBase} | Desc: ${t.description}`);
});
