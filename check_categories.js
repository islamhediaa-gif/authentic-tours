
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];
const cats = {};
transactions.forEach(t => {
    cats[t.category] = (cats[t.category] || 0) + 1;
});
console.log(cats);
