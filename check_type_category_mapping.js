const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const mapping = {};
backup.transactions.forEach(t => {
    const key = `${t.type} | ${t.category}`;
    mapping[key] = (mapping[key] || 0) + parseFloat(t.amountInBase || 0);
});

console.log('Mapping of Type | Category to Amount:');
console.log(JSON.stringify(mapping, null, 2));
