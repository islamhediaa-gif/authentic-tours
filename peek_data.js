const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
if (data.transactions && data.transactions.length > 0) {
    console.log(JSON.stringify(data.transactions[0], null, 2));
} else {
    console.log("No transactions found");
}
