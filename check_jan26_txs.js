const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

// Jan 26 Trip IDs (there are two, let's check both)
const tripIds = ['1768847095963', '1768922423344'];

tripIds.forEach(tid => {
    const txs = (backup.transactions || []).filter(tx => tx.masterTripId === tid && !tx.isVoided);
    console.log(`Trip ${tid} Sale:`, txs.reduce((acc, tx) => acc + (tx.amount || 0), 0));
    console.log(`Trip ${tid} Purchase:`, txs.reduce((acc, tx) => acc + (tx.purchasePrice || 0), 0));
});
