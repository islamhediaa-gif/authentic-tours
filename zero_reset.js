const fs = require('fs');
const backupPath = 'd:/authentic/Backup_Nebras_2026-01-29.json';
const outputPath = 'd:/authentic/Backup_Nebras_Zero_State.json';

const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// تصفير كافة السجلات المالية
data.transactions = [];
data.journalEntries = [];
data.customerPayments = [];
data.supplierPayments = [];
data.vouchers = [];

// تصفير أرصدة الحسابات في الشجرة المحاسبية
if (data.accounts) {
    data.accounts.forEach(acc => {
        acc.balance = 0;
        acc.openingBalance = 0;
    });
}

// الحفاظ على أسماء الرحلات كقوالب فارغة (أو مسحها إذا فضلت ذلك، لكن سأتركها لتسهيل التسجيل)
// إذا أردت مسح الرحلات أيضاً فك التشفير عن السطر التالي:
// data.masterTrips = [];

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log('Program has been completely reset to Zero State.');
