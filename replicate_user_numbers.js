const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const jan22Id = '1768576135774';
const jan26Ids = ['1768847095963', '1768922423344'];

function analyzeTrip(id, name) {
    const txs = backup.transactions.filter(t => (t.masterTripId === id || t.programId === id) && !t.isVoided);
    let rev = 0;
    let cost = 0;
    txs.forEach(t => {
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
            rev += Number(t.sellingPriceInBase || t.amountInBase || 0);
            cost += Number(t.purchasePriceInBase || 0);
        } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
            cost += Number(t.amountInBase || 0);
        }
    });
    console.log(`Trip: ${name}`);
    console.log(`- Revenue: ${rev}`);
    console.log(`- Cost: ${cost}`);
    console.log(`- Profit: ${rev - cost}`);
    console.log(`- Tx Count: ${txs.length}`);
}

analyzeTrip(jan22Id, '22 Jan');
analyzeTrip(jan26Ids[0], '26 Jan (1)');
analyzeTrip(jan26Ids[1], '26 Jan (2)');

// Find total sales target: 4,759,371.89
// Check all Income/Revenue types
let totalSales = 0;
backup.transactions.forEach(t => {
    if (t.isVoided) return;
    if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        const cat = t.category || '';
        if (cat !== 'CASH' && cat !== 'TRANSFER' && cat !== 'PARTNER_WITHDRAWAL' && 
            cat !== 'EMPLOYEE_ADVANCE' && cat !== 'ACCOUNT_CLEARING' && cat !== 'PARTNER_DEPOSIT') {
            totalSales += Number(t.sellingPriceInBase || t.amountInBase || 0);
        }
    }
});
console.log('\nTotal Sales calculated:', totalSales);
console.log('Target Total Sales:', 4759371.89);
console.log('Difference:', totalSales - 4759371.89);
