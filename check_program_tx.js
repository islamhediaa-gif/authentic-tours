
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

const programTx = transactions.filter(t => t.description.includes('برايد اند جوي'));

console.log(`Total Transactions for "برايد اند جوي": ${programTx.length}`);

programTx.slice(0, 10).forEach(t => {
    console.log(`\nTx ${t.id} | ${t.type} | Cat: ${t.category}`);
    console.log(`  Desc: ${t.description}`);
    console.log(`  Selling: ${t.sellingPrice} | Purchase: ${t.purchasePrice}`);
});
