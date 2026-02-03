const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const types = {};
data.transactions.forEach(t => {
    types[t.type] = (types[t.type] || 0) + 1;
});
console.log(types);
