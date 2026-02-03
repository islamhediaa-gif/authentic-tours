const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
Object.keys(data).forEach(k => {
    if (Array.isArray(data[k])) {
        console.log(`${k}: ${data[k].length}`);
    } else if (typeof data[k] === 'object' && data[k] !== null) {
        console.log(`${k}: (object)`);
    }
});
