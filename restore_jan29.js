
const fs = require('fs');

async function restore() {
    console.log("Reading backup file...");
    const raw = fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8');
    const data = JSON.parse(raw);
    
    console.log("Preparing to send to Railway...");
    const payload = {
        userId: 'authentic',
        data: data
    };

    try {
        const response = await fetch('https://authentic-tours-production.up.railway.app/api/backup/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log("Result:", result);
        if (result.success) {
            console.log("Restore SUCCESSFUL");
        } else {
            console.error("Restore FAILED", result.error);
        }
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

restore();
