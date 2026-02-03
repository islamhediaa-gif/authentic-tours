const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const trips = backup.masterTrips || [];
trips.forEach(t => console.log(`ID: ${t.id}, Name: ${t.name}, Voided: ${t.isVoided}`));
