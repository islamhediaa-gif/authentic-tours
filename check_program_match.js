
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

const bulk = transactions.find(t => t.id === '1768910363174');
const individual = transactions.find(t => t.id === 'TX-1769649582029');

console.log(`Bulk Flight Tx: ID=${bulk?.id}, ProgramID=${bulk?.programId}, Cost=${bulk?.purchasePriceInBase}`);
console.log(`Individual Flight Tx: ID=${individual?.id}, ProgramID=${individual?.programId}, Cost=${individual?.purchasePriceInBase}`);
