const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

const jeToTxTypes = new Map();
const jeToProgramId = new Map();
const programBulkPurchases = new Set();

transactions.forEach(t => {
    if (t && t.journalEntryId) {
        if (!jeToTxTypes.has(t.journalEntryId)) jeToTxTypes.set(t.journalEntryId, new Set());
        let type = t.type || 'NORMAL';
        if (t.isSaleOnly) type = 'REVENUE_ONLY';
        if (t.isPurchaseOnly) type = 'PURCHASE_ONLY';
        jeToTxTypes.get(t.journalEntryId).add(type);
        if (t.programId) {
            jeToProgramId.set(t.journalEntryId, t.programId);
            if (t.isPurchaseOnly) programBulkPurchases.add(t.programId);
        }
    }
});

const balances = {};

journalEntries.forEach(entry => {
    const types = jeToTxTypes.get(entry.id) || new Set(['NORMAL']);
    const isPurchaseOnly = types.has('PURCHASE_ONLY');
    const isRevenueOnly = types.has('REVENUE_ONLY');
    const programId = jeToProgramId.get(entry.id);

    (entry.lines || []).forEach(line => {
        // --- REPAIR LOGIC ---
        if (isPurchaseOnly && !isRevenueOnly && (line.accountType === 'REVENUE' || line.accountType === 'CUSTOMER')) return;
        if (isRevenueOnly && !isPurchaseOnly && (line.accountType === 'EXPENSE' || line.accountType === 'SUPPLIER')) return;
        
        if (programId && programBulkPurchases.has(programId) && !isPurchaseOnly && (line.accountType === 'EXPENSE' || line.accountType === 'SUPPLIER')) {
            return;
        }
        // --------------------

        const accId = line.accountId;
        if (!balances[accId]) balances[accId] = { debit: 0, credit: 0, type: line.accountType };
        balances[accId].debit += (line.debit || 0);
        balances[accId].credit += (line.credit || 0);
    });
});

console.log('--- Simulated Trial Balance Results ---');
const accounts = Object.entries(balances).map(([id, b]) => ({
    id, ...b,
    net: b.type === 'REVENUE' || b.type === 'SUPPLIER' || b.type === 'PARTNER' ? b.credit - b.debit : b.debit - b.credit
}));

const rev = accounts.filter(a => a.type === 'REVENUE').reduce((s, a) => s + a.net, 0);
const exp = accounts.filter(a => a.type === 'EXPENSE').reduce((s, a) => s + a.net, 0);

console.log('Total Revenue:', rev.toFixed(2));
console.log('Total Expense:', exp.toFixed(2));
console.log('Net Profit:', (rev - exp).toFixed(2));

console.log('\n--- Specific Expense Accounts ---');
['HAJJ_UMRAH_COST', 'FLIGHT_COST', 'SERVICE_COST'].forEach(id => {
    const a = accounts.find(x => x.id === id);
    if (a) console.log(`${id.padEnd(20)}: ${a.net.toFixed(2)}`);
});
