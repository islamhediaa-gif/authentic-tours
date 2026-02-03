const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
if (data.transactions && data.transactions.length > 0) {
    // Collect all unique keys from all transactions to be safe
    const allKeys = new Set();
    data.transactions.forEach(tx => Object.keys(tx).forEach(k => allKeys.add(k)));
    console.log(Array.from(allKeys));
}
