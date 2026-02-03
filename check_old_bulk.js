
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

const bulkCandidates = transactions.filter(t => t.type === 'EXPENSE' && t.amountInBase > 20000 && t.date < '2026-01-20');

console.log("--- Large Expenses before Jan 20 ---");
bulkCandidates.forEach(t => {
    console.log(`Date: ${t.date} | ID: ${t.id} | Amount: ${t.amountInBase} | Cat: ${t.category} | Desc: ${t.description}`);
});
