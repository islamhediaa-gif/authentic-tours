const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const trips = backup.masterTrips || [];
const trip = trips.find(t => t.name.includes('26 يناير'));
console.log('Trip found:', trip);
