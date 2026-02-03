const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const flight = backup.transactions.find(t => t.category === 'FLIGHT' || t.type === 'FLIGHT');
console.log('Flight Transaction:', JSON.stringify(flight, null, 2));

const service = backup.transactions.find(t => t.category === 'GENERAL_SERVICE');
console.log('Service Transaction:', JSON.stringify(service, null, 2));
