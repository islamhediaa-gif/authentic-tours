const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
console.log(data.programs.filter(p => p.name.includes('بدر الماسه')).map(p => ({id: p.id, name: p.name, tripId: p.masterTripId})));

