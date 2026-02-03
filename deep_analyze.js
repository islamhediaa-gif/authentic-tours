const fs = require('fs');
const backupPath = 'd:/authentic/Backup_Nebras_2026-01-29.json';
const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('--- Master Trips Found ---');
data.masterTrips.forEach(trip => {
    console.log(`ID: ${trip.id}, Name: ${trip.name}, Date: ${trip.startDate}`);
});

const tripStats = {};
data.transactions.forEach(tx => {
    if (!tx.masterTripId) return;
    if (!tripStats[tx.masterTripId]) tripStats[tx.masterTripId] = { rev: 0, cost: 0, name: '' };
    if (tx.type === 'INCOME' || tx.type === 'REVENUE_ONLY') tripStats[tx.masterTripId].rev += tx.amount;
    else tripStats[tx.masterTripId].cost += tx.amount;
});

console.log('\n--- Financial Stats per Trip ---');
Object.keys(tripStats).forEach(id => {
    const trip = data.masterTrips.find(t => t.id === id);
    console.log(`Trip: ${trip ? trip.name : id}, Rev: ${tripStats[id].rev}, Cost: ${tripStats[id].cost}`);
});
