const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const flightTxs = data.transactions.filter(t => t.category === 'FLIGHT' || t.category === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REISSUE');

console.log('--- FLIGHT Transactions ---');
flightTxs.sort((a, b) => new Date(a.date) - new Date(b.date));
flightTxs.forEach(t => {
    console.log(`ID: ${t.id}, Date: ${t.date}, Type: ${t.type}, isPurOnly: ${t.isPurchaseOnly}, Amount: ${t.amountInBase}, Cost: ${t.purchasePriceInBase}, Desc: ${t.description}`);
});
