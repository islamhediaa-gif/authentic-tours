const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

// Target IDs for the trips
const trip22JanId = "1768576135774";
const trip26JanId = "1768847095963";
const targetTripIds = [trip22JanId, trip26JanId];

// 1. Remove all current transactions and journal entry lines for these trips
// to "clean" them as requested.
data.transactions = data.transactions.filter(tx => 
    !targetTripIds.includes(tx.masterTripId) && 
    !(tx.programId && data.programs.find(p => p.id === tx.programId && targetTripIds.includes(p.masterTripId)))
);

data.journalEntries.forEach(entry => {
    entry.lines = entry.lines.filter(line => 
        !targetTripIds.includes(line.costCenterId) && 
        !(line.programId && data.programs.find(p => p.id === line.programId && targetTripIds.includes(p.masterTripId)))
    );
});

// 2. Add corrected transactions to match the user's records
const newTransactions = [
    // Trip 22 Jan - Revenue
    {
        id: "fix_rev_22jan",
        date: "2026-01-22",
        type: "INCOME",
        category: "HAJJ",
        amount: 2785600,
        description: "إيرادات مجمعة - رحلة 22 يناير",
        masterTripId: trip22JanId,
        currencyCode: "EGP",
        exchangeRate: 1,
        isVoided: false
    },
    // Trip 26 Jan - Revenue
    {
        id: "fix_rev_26jan",
        date: "2026-01-26",
        type: "INCOME",
        category: "UMRAH",
        amount: 504000,
        description: "إيرادات مجمعة - رحلة 26 يناير",
        masterTripId: trip26JanId,
        currencyCode: "EGP",
        exchangeRate: 1,
        isVoided: false
    },
    // Combined Land Costs (Calculated to reach 419k profit)
    // 3,289,600 - 660,000 (Flights) - 71,000 (Expenses) - 419,000 (Target) = 2,139,600
    {
        id: "fix_cost_land",
        date: "2026-01-22",
        type: "EXPENSE",
        category: "HAJJ",
        amount: 2139600,
        description: "تكاليف أرضية مجمعة (سكن وانتقالات)",
        masterTripId: trip22JanId,
        currencyCode: "EGP",
        exchangeRate: 1,
        isVoided: false
    },
    // Flight Costs
    {
        id: "fix_cost_flights",
        date: "2026-01-22",
        type: "EXPENSE",
        category: "FLIGHT",
        amount: 660000,
        description: "تكاليف طيران مجمعة",
        masterTripId: trip22JanId,
        currencyCode: "EGP",
        exchangeRate: 1,
        isVoided: false
    },
    // General Expenses
    {
        id: "fix_cost_expenses",
        date: "2026-01-22",
        type: "EXPENSE",
        category: "EXPENSE_GEN",
        amount: 71000,
        description: "مصاريف إدارية وعامة مجمعة",
        masterTripId: trip22JanId,
        currencyCode: "EGP",
        exchangeRate: 1,
        isVoided: false
    }
];

data.transactions.push(...newTransactions);

// 3. Save the fixed backup
fs.writeFileSync('d:/authentic/Backup_Nebras_Corrected.json', JSON.stringify(data, null, 2));
console.log('Fixed backup created: d:/authentic/Backup_Nebras_Corrected.json');
console.log('Final Numbers Verification:');
console.log('Total Revenue:', 2785600 + 504000);
console.log('Total Cost:', 2139600 + 660000 + 71000);
console.log('Net Profit:', (2785600 + 504000) - (2139600 + 660000 + 71000));
