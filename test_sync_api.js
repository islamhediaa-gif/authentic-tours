
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const API_URL = 'http://localhost:3001';
const TENANT_ID = 'authentic';

async function test() {
    console.log("Starting Sync Test through API...");
    
    // 1. Wipe
    console.log("Wiping existing data...");
    const wipeRes = await fetch(`${API_URL}/api/wipe/${TENANT_ID}`, { method: 'DELETE' });
    const wipeData = await wipeRes.json();
    if (!wipeData.success) throw new Error("Wipe failed: " + wipeData.error);
    console.log("✅ Wipe successful");

    // 2. Load Backup
    const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
    
    // 3. Sync Tables (Simplified DataService logic)
    const syncTable = async (name, records, size = 100) => {
        if (!records || records.length === 0) return;
        console.log(`Syncing ${records.length} records to ${name}...`);
        for (let i = 0; i < records.length; i += size) {
            const batch = records.slice(i, i + size);
            const res = await fetch(`${API_URL}/api/upsert/${name}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: batch, tenant_id: TENANT_ID })
            });
            const resData = await res.json();
            if (!resData.success) throw new Error(`Failed to sync ${name}: ${resData.error}`);
        }
    };

    try {
        await syncTable('transactions', data.transactions || [], 100);
        await syncTable('customers', data.customers || []);
        await syncTable('suppliers', data.suppliers || []);
        await syncTable('partners', data.partners || []);
        await syncTable('employees', data.employees || []);
        await syncTable('treasuries', data.treasuries || []);
        await syncTable('currencies', data.currencies || []);
        await syncTable('cost_centers', data.costCenters || []);
        await syncTable('departments', data.departments || []);
        await syncTable('designations', data.designations || []);
        await syncTable('master_trips', data.masterTrips || []);
        await syncTable('attendance_logs', data.attendanceLogs || [], 100);
        await syncTable('audit_logs', data.auditLogs || [], 100);
        await syncTable('shifts', data.shifts || []);
        await syncTable('employee_leaves', data.leaves || []);
        await syncTable('employee_allowances', data.allowances || []);
        await syncTable('employee_documents', data.documents || []);

        // Journal Entries & Lines (The critical part)
        if (data.journalEntries) {
            const allLines = [];
            data.journalEntries.forEach((entry, entryIdx) => {
                if (entry.lines && Array.isArray(entry.lines)) {
                    entry.lines.forEach((line, lineIdx) => {
                        allLines.push({
                            ...line,
                            id: line.id || `L_${entryIdx}_${lineIdx}`,
                            journal_entry_id: entry.id
                        });
                    });
                }
            });
            
            console.log(`Extracted ${allLines.length} journal lines.`);
            await syncTable('journal_entries', data.journalEntries, 100);
            await syncTable('journal_lines', allLines, 200);
        }

        console.log("✅ Sync through API completed!");
        
        // 4. Verify Equity Parity
        console.log("Verifying Equity Parity in DB...");
        const mysql = require('mysql2/promise');
        const conn = await mysql.createConnection({
            host: process.env.MYSQLHOST,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQLPASSWORD,
            database: process.env.MYSQLDATABASE,
            port: process.env.MYSQLPORT
        });

        const [rows] = await conn.query('SELECT * FROM view_equity_summary WHERE tenant_id = ?', [TENANT_ID]);
        console.log("Equity Summary Result:", rows[0]);
        
        const expectedProfit = 1024607.63; // From previous session
        const actualProfit = parseFloat(rows[0].net_profit);
        
        if (Math.abs(actualProfit - expectedProfit) < 1) {
            console.log("🚀 SUCCESS! Equity Parity Maintained.");
        } else {
            console.error(`❌ DISCREPANCY! Expected: ${expectedProfit}, Actual: ${actualProfit}`);
        }
        
        await conn.end();

    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
