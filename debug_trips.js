const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

console.log('--- MASTER TRIPS ---');
backup.masterTrips.forEach(t => console.log(`ID: ${t.id}, Name: ${t.name}, Date: ${t.startDate}`));

console.log('\n--- PROGRAMS ---');
backup.programs.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}, Date: ${p.date}`));

console.log('\n--- SEARCHING FOR JAN 26 IN DESCRIPTIONS ---');
const jan26Txs = backup.transactions.filter(t => t.description?.includes('26 يناير'));
console.log(`Found ${jan26Txs.length} transactions with "26 يناير" in description.`);
if (jan26Txs.length > 0) {
    jan26Txs.forEach(t => console.log(`- [${t.date}] ${t.amount} EGP: ${t.description} (ProgID: ${t.programId}, TripID: ${t.masterTripId})`));
}
