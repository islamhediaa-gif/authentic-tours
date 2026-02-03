const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const tripId = '1768686066932';
const tripProgs = data.programs.filter(p => p.masterTripId === tripId);
console.log(`Programs for trip: ${tripProgs.length}`);
console.log(tripProgs.map(p => ({ id: p.id, name: p.name })));
