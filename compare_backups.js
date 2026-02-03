const fs = require('fs');

function getCounts(filePath) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const counts = {};
        for (const key in data) {
            if (Array.isArray(data[key])) {
                counts[key] = data[key].length;
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                counts[key] = 1; // settings
            }
        }
        return counts;
    } catch (e) {
        return { error: e.message };
    }
}

console.log('--- 29 Jan Backup Counts ---');
console.log(getCounts('Backup_Nebras_2026-01-29.json'));

console.log('\n--- Updated Backup Counts ---');
console.log(getCounts('Backup_Nebras_Updated.json'));
