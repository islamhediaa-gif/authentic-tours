
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-28 (4).json', 'utf8'));

function analyzeAccurately() {
    const journalEntries = data.journalEntries || [];
    const balances = {};

    let entriesCount = 0;
    let linesCount = 0;
    journalEntries.forEach(entry => {
        // فلترة القيود بناءً على التاريخ الموضح في الصورة
        if (entry.date >= '2025-12-31' && entry.date <= '2026-01-28') {
            entriesCount++;
            (entry.lines || []).forEach(line => {
                linesCount++;
                const key = line.accountId || line.accountName;
                if (!balances[key]) {
                    balances[key] = { 
                        name: line.accountName, 
                        type: line.accountType, 
                        debit: 0, 
                        credit: 0 
                    };
                }
                balances[key].debit += (line.debit || 0);
                balances[key].credit += (line.credit || 0);
            });
        }
    });
    console.log(`Local Entries processed: ${entriesCount}`);
    console.log(`Local Lines processed: ${linesCount}`);

    // تصنيف دقيق بناءً على ما يظهر في تطبيق "نبراس"
    let flightRev = 0;
    let hajjUmrahRev = 0;
    let otherRev = 0;
    let directCosts = 0;
    let adminExp = 0;

    Object.entries(balances).forEach(([id, b]) => {
        const netCredit = b.credit - b.debit;
        const netDebit = b.debit - b.credit;

        if (id === 'FLIGHT_REVENUE') {
            flightRev += netCredit;
            console.log(`FLIGHT_REVENUE (Local): credit=${b.credit}, debit=${b.debit}, net=${netCredit}`);
        }
        else if (id === 'HAJJ_UMRAH_REVENUE') {
            hajjUmrahRev += netCredit;
            console.log(`HAJJ_UMRAH_REVENUE (Local): credit=${b.credit}, debit=${b.debit}, net=${netCredit}`);
        }
        else if (b.type === 'REVENUE' || id.includes('REVENUE') || id === 'SALES_REVENUE' || id === 'SERVICE_REVENUE') {
            otherRev += netCredit;
        }
        // التكاليف والمصروفات
        else if (id === 'FLIGHT_COST' || id === 'HAJJ_UMRAH_COST' || id === 'COGS' || id === 'SERVICE_COST' || id === 'DIRECT_COST') {
            directCosts += netDebit;
        }
        else if (b.type === 'EXPENSE') {
            adminExp += netDebit;
        }
    });

    console.log("--- الميزان التحليلي (مطابقة الصورة) ---");
    console.log("إيرادات حجز طيران:", flightRev.toFixed(3));
    console.log("إيرادات العمرة والحج:", hajjUmrahRev.toFixed(3));
    console.log("إيرادات خدمات أخرى:", otherRev.toFixed(3));
    console.log("إجمالي الإيرادات:", (flightRev + hajjUmrahRev + otherRev).toFixed(3));
    console.log("---------------------------------------");
    console.log("تكاليف مباشرة:", directCosts.toFixed(3));
    console.log("مصروفات إدارية:", adminExp.toFixed(3));
    console.log("إجمالي التكاليف:", (directCosts + adminExp).toFixed(3));
    console.log("---------------------------------------");
    console.log("صافي الربح / الخسارة:", (flightRev + hajjUmrahRev + otherRev - directCosts - adminExp).toFixed(3));
}

analyzeAccurately();
