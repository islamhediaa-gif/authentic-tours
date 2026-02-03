const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));

console.log("--- Transactions on 2026-01-26 ---");
const jan26Txs = data.transactions.filter(t => t.date === '2026-01-26');
jan26Txs.forEach(t => console.log(`- ${t.description} | Amount: ${t.amount}`));

console.log("\n--- All Transactions for 'بدر الماسه' ---");
const badrTxs = data.transactions.filter(t => t.description.includes('بدر الماسه'));
badrTxs.forEach(t => console.log(`- Date: ${t.date} | ${t.description} | Amount: ${t.amount}`));
