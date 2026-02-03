const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const trip22Id = "1768576135774";

// 1. حذف كافة تكاليف الطيران المسجلة حالياً لرحلة 22 يناير (لأنها مكررة أو خاطئة)
const flightCategories = ['FLIGHT', 'FLIGHT_INTERNAL'];
data.transactions = data.transactions.filter(tx => {
    if (tx.masterTripId === trip22Id && (flightCategories.includes(tx.category) || tx.description?.includes('طيران'))) {
        return false;
    }
    return true;
});

// 2. إضافة التكاليف الصحيحة المجمعة
const targetFlight = 660000;
const targetGenExp = 71000;

function addFinalEntry(date, amount, desc, tripId, accId, accName, cat) {
    const id = `TX-FINAL-${Date.now()}-${Math.random()}`;
    const jeId = `JE-${id}`;
    data.transactions.push({
        id, date, type: "EXPENSE", category: cat, amount, amountInBase: amount, 
        description: desc, masterTripId: tripId, journalEntryId: jeId, isVoided: false
    });
    data.journalEntries.push({
        id: jeId, date, description: desc, refNo: "FINAL-FIX",
        lines: [
            { accountId: accId, accountName: accName, accountType: "EXPENSE", debit: amount, credit: 0, exchangeRate: 1, currencyCode: "EGP", costCenterId: tripId },
            { accountId: "CASH-1", accountName: "الخزينة", accountType: "TREASURY", debit: 0, credit: amount, exchangeRate: 1, currencyCode: "EGP" }
        ]
    });
}

addFinalEntry("2026-01-22", targetFlight, "تكاليف طيران مجمعة (تعديل نهائي)", trip22Id, "FLIGHT_COST", "تكاليف طيران", "FLIGHT");
addFinalEntry("2026-01-22", targetGenExp, "مصاريف إدارية وعامة (تعديل نهائي)", trip22Id, "EXPENSE_GEN", "مصاريف عامة", "EXPENSE_GEN");

fs.writeFileSync('d:/authentic/Backup_Nebras_Final_Fixed.json', JSON.stringify(data, null, 2));
console.log('Flight costs cleaned and consolidated for Trip 22 Jan.');
