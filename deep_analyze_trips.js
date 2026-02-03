const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const jan22Id = '1768576135774';
const jan26Ids = ['1768847095963', '1768922423344'];

function analyze(id, label) {
    const txs = backup.transactions.filter(t => (t.masterTripId === id || t.programId === id) && !t.isVoided);
    let rev = 0;
    let cost = 0;
    
    txs.forEach(t => {
        // Same logic as IncomeStatement
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
            rev += Number(t.sellingPriceInBase || t.amountInBase || 0);
            cost += Number(t.purchasePriceInBase || 0);
        } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
            cost += Number(t.amountInBase || 0);
        }
    });
    
    console.log(`\n--- ${label} ---`);
    console.log(`Total Revenue: ${rev}`);
    console.log(`Total Cost: ${cost}`);
    console.log(`Net Profit: ${rev - cost}`);
}

analyze(jan22Id, 'Jan 22 MasterTrip');
analyze(jan26Ids[0], 'Jan 26 MasterTrip (1)');
analyze(jan26Ids[1], 'Jan 26 MasterTrip (2)');

// Let's also check programs linked to these trips
const jan22Progs = backup.programs.filter(p => p.masterTripId === jan22Id).map(p => p.id);
console.log('Programs for Jan 22:', jan22Progs);
jan22Progs.forEach(pid => analyze(pid, `Program ${pid}`));
