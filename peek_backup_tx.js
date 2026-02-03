const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

console.log('Number of transactions:', backup.transactions.length);
console.log('First transaction:', JSON.stringify(backup.transactions[0], null, 2));

const types = [...new Set(backup.transactions.map(t => t.transaction_type))];
console.log('Transaction types present:', types);

const categories = [...new Set(backup.transactions.map(t => t.category))];
console.log('Categories present:', categories);

const ids = backup.transactions.map(t => t.transaction_id);
console.log('First 5 IDs:', ids.slice(0, 5));
