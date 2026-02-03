const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];
const masterTrips = data.masterTrips || [];
const programs = data.programs || [];

const targetTrips = ["رحلة 22 يناير", "رحله 26 يناير"];

targetTrips.forEach(targetName => {
    const trip = masterTrips.find(t => t.name === targetName);
    if (!trip) return;

    let tripIncome = 0;
    let tripExpense = 0;
    
    const tripPrograms = (programs || []).filter(p => p && p.masterTripId === trip.id);
    const linkedProgramIds = new Set(tripPrograms.map(p => p.id).filter(Boolean));

    transactions.forEach(tx => {
        if (!tx || tx.isVoided) return;
        const isDirectlyLinked = tx.masterTripId === trip.id;
        const isLinkedViaProgram = tx.programId && linkedProgramIds.has(tx.programId);

        if (isDirectlyLinked || isLinkedViaProgram) {
            const rate = tx.exchangeRate || 1;
            const amountBase = (tx.amount || 0) * rate;
            const purchaseBase = (tx.purchasePrice || 0) * rate;

            if (tx.type === 'INCOME' || tx.type === 'REVENUE_ONLY') {
                tripIncome += amountBase;
                if (purchaseBase > 0) tripExpense += purchaseBase;
            } else if (tx.type === 'EXPENSE' || tx.type === 'PURCHASE_ONLY') {
                tripExpense += amountBase;
            }
        }
    });

    const includedJournalEntryIds = new Set(transactions.filter(tx => tx.masterTripId === trip.id || (tx.programId && linkedProgramIds.has(tx.programId))).map(tx => tx.journalEntryId).filter(Boolean));
    
    journalEntries.forEach(entry => {
        if (!entry || includedJournalEntryIds.has(entry.id)) return;
        entry.lines.forEach(line => {
            if (line.costCenterId === trip.id || (line.programId && linkedProgramIds.has(line.programId))) {
                const isPLAccount = line.accountType === 'EXPENSE' || line.accountType === 'REVENUE';
                const hasPLInEntry = (entry.lines || []).some(l => l.accountType === 'EXPENSE' || l.accountType === 'REVENUE');
                if (hasPLInEntry && !isPLAccount) return;
                if (!hasPLInEntry && line.accountType === 'TREASURY') return;

                const isIncome = (line.credit || 0) > 0;
                const amount = isIncome ? (line.credit || 0) : (line.debit || 0);
                const rate = line.exchangeRate || 1;
                const amountBase = line.originalAmount ? (line.originalAmount * rate) : (amount * rate);

                if (isIncome) tripIncome += amountBase;
                else tripExpense += amountBase;
            }
        });
    });

    console.log(`Trip: ${trip.name}`);
    console.log(`  Revenue: ${tripIncome.toLocaleString()}`);
    console.log(`  Cost:    ${tripExpense.toLocaleString()}`);
    console.log(`  Profit:  ${(tripIncome - tripExpense).toLocaleString()}`);
});
