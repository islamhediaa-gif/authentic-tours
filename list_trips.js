const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
console.log(data.masterTrips.map(t => ({id: t.id, name: t.name})));