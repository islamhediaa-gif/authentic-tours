
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

const seen = new Map();
const duplicates = [];

transactions.forEach(t => {
    const key = `${t.date}|${t.description}|${t.amount}|${t.relatedEntityId}|${t.type}`;
    if (seen.has(key)) {
        duplicates.push({ original: seen.get(key), duplicate: t.id, desc: t.description, amount: t.amount });
    } else {
        seen.set(key, t.id);
    }
});

console.log(`Total Transactions: ${transactions.length}`);
console.log(`Duplicate Transactions: ${duplicates.length}`);

if (duplicates.length > 0) {
    console.log("\n--- Example Duplicates ---");
    duplicates.slice(0, 10).forEach(d => {
        console.log(`Date: ${d.date} | IDs: ${d.original}, ${d.duplicate} | Desc: ${d.desc}`);
    });
}
