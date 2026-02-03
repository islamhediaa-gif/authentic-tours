const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const progId = '1768856031486';
const txs = data.transactions.filter(t => t.programId === progId);

console.log(`--- Transactions for Program ${progId} ---`);
txs.forEach(t => {
    console.log(`ID: ${t.id}, Type: ${t.type}, isPurchaseOnly: ${t.isPurchaseOnly}, Amount: ${t.amountInBase}, Desc: ${t.description}`);
});
