
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const partner = data.partners.find(p => p.id === 'P-1768295924401');
console.log('Partner in JSON:', partner);
