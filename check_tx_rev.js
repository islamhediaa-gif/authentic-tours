
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_Updated.json', 'utf8'));

function checkTransactions() {
    const tx = data.transactions || [];
    let hajjUmrahRev = 0;
    
    tx.forEach(t => {
        if (!t.isVoided && (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') && t.category === 'HAJJ_UMRAH') {
            hajjUmrahRev += (t.amountInBase || 0);
        }
    });
    
    console.log("Hajj/Umrah Revenue from Transactions:", hajjUmrahRev.toFixed(2));
    console.log("Total Transactions count:", tx.length);
}

checkTransactions();
