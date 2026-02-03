const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];
const programs = data.programs || [];
const tripIds = ["1768576135774", "1768847095963"]; // 22 Jan and 26 Jan

const tripPrograms = programs.filter(p => tripIds.includes(p.masterTripId));
const linkedProgramIds = new Set(tripPrograms.map(p => p.id));

let totalIncome = 0;
let totalExpense = 0;

const FLIGHT_GROUP_ID = 'FLIGHT_GROUP';
const EXPENSE_GROUP_ID = 'EXPENSE_GROUP';
const programGroups = {
    [FLIGHT_GROUP_ID]: { income: 0, expense: 0 },
    [EXPENSE_GROUP_ID]: { income: 0, expense: 0 },
    'GENERAL': { income: 0, expense: 0 }
};

const movements = [];

transactions.forEach(tx => {
    if (!tx || tx.isVoided) return;
    const isDirectlyLinked = tripIds.includes(tx.masterTripId);
    const isLinkedViaProgram = tx.programId && linkedProgramIds.has(tx.programId);

    if (isDirectlyLinked || isLinkedViaProgram) {
        const rate = tx.exchangeRate || 1;
        const amountBase = (tx.amount || 0) * rate;
        const purchaseBase = (tx.purchasePrice || 0) * rate;

        let category = tx.category || 'OTHER';
        const isFlight = tx.description?.includes('طيران') || category === 'FLIGHT' || tx.accountName?.includes('طيران');
        const isGeneralExpense = tx.type === 'EXPENSE' && (category === 'EXPENSE_GEN' || tx.description?.includes('مصاريف'));

        let pid = tx.programId || 'GENERAL';
        if (isFlight) pid = FLIGHT_GROUP_ID;
        else if (isGeneralExpense) pid = EXPENSE_GROUP_ID;

        if (!programGroups[pid]) programGroups[pid] = { income: 0, expense: 0 };

        if (tx.type === 'INCOME' || tx.type === 'REVENUE_ONLY') {
            programGroups[pid].income += amountBase;
            if (purchaseBase > 0) programGroups[pid].expense += purchaseBase;
        } else if (tx.type === 'EXPENSE' || tx.type === 'PURCHASE_ONLY') {
            programGroups[pid].expense += amountBase;
        }
    }
});

journalEntries.forEach(entry => {
    if (!entry) return;
    const isEntryLinked = entry.lines.some(l => tripIds.includes(l.costCenterId) || (l.programId && linkedProgramIds.has(l.programId)));
    if (!isEntryLinked) return;

    entry.lines.forEach(line => {
        const isLinkedToTrip = tripIds.includes(line.costCenterId);
        const isLinkedToProgram = line.programId && linkedProgramIds.has(line.programId);

        if (isLinkedToTrip || isLinkedToProgram) {
            const isGuaranteeLetter = line.accountType === 'ASSET' && line.accountName?.includes('خطاب ضمان');
            if (line.transactionId) return; // Skip lines linked to Transactions handled above

            const isIncome = (line.credit || 0) > 0 && !isGuaranteeLetter;
            const amount = isIncome ? (line.credit || 0) : (line.debit || 0);
            const rate = line.exchangeRate || 1;
            const amountBase = (line.originalAmount || amount) * rate;

            let pid = line.programId || 'GENERAL';
            if (line.accountName?.includes('طيران')) pid = FLIGHT_GROUP_ID;
            if (line.accountName?.includes('مصاريف') || line.accountType === 'EXPENSE') pid = EXPENSE_GROUP_ID;

            if (!programGroups[pid]) programGroups[pid] = { income: 0, expense: 0 };

            if (isIncome) programGroups[pid].income += amountBase;
            else programGroups[pid].expense += amountBase;
        }
    });
});

console.log('--- Final Stats ---');
let finalIncome = 0;
let finalExpense = 0;
for (const pid in programGroups) {
    console.log(`${pid}: Inc: ${programGroups[pid].income}, Exp: ${programGroups[pid].expense}, Profit: ${programGroups[pid].income - programGroups[pid].expense}`);
    finalIncome += programGroups[pid].income;
    finalExpense += programGroups[pid].expense;
}
console.log('--- Total ---');
console.log(`Income: ${finalIncome}`);
console.log(`Expense: ${finalExpense}`);
console.log(`Profit: ${finalIncome - finalExpense}`);
