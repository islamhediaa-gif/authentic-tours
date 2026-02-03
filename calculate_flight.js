const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));
const transactions = data.transactions || [];

function calculate() {
    let rev = { hajjUmrah: 0, flight: 0, other: 0 };
    let cost = { hajjUmrah: 0, flight: 0, other: 0 };

    transactions.forEach(t => {
        if (!t || t.isVoided || t.category === 'CASH') return;

        const isLinked = !!(t.masterTripId || t.programId);
        
        // Revenue
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
            const amount = (t.amountInBase || 0) || (t.sellingPriceInBase || t.sellingPrice || 0);
            const cat = t.category || '';
            
            if (isLinked || cat === 'HAJJ_UMRAH') rev.hajjUmrah += amount;
            else if (cat.startsWith('FLIGHT')) rev.flight += amount;
            else rev.other += amount;
        }

        // Cost
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
            const pCost = (t.purchasePriceInBase || t.purchasePrice || 0);
            if (pCost > 0) {
                const cat = t.category || '';
                if (isLinked || cat === 'HAJJ_UMRAH') cost.hajjUmrah += pCost;
                else if (cat.startsWith('FLIGHT')) cost.flight += pCost;
                else cost.other += pCost;
            }
        } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
            const amount = (t.amountInBase || 0);
            const cat = t.category || '';
            
            if (t.isPurchaseOnly && !isLinked && cat !== 'HAJJ_UMRAH') return;

            if (isLinked || cat === 'HAJJ_UMRAH') cost.hajjUmrah += amount;
            else if (cat.startsWith('FLIGHT')) cost.flight += amount;
            else if (cat === 'GENERAL_SERVICE' || cat === 'OTHER') cost.other += amount;
        }
    });

    console.log('Flight Revenue:', rev.flight);
    console.log('Flight Cost:', cost.flight);
    console.log('Flight Profit:', rev.flight - cost.flight);
}

calculate();
