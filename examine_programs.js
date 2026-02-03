const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const programs = data.programs || [];

console.log('--- Programs ---');
programs.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}, Type: ${p.type}`);
});
