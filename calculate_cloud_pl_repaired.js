
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = 'authentic';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function calculateCloudPLWithRepair() {
    console.log(`Calculating P&L from Cloud with Repair Logic for tenant: ${TENANT_ID}`);
    const startDate = '2025-12-31';
    const endDate = '2026-01-28';

    // Fetch transactions to get the repair flags
    const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('id, journal_entry_id, type, program_id')
        .eq('tenant_id', TENANT_ID);
    
    if (txError) {
        console.error("Error fetching transactions:", txError.message);
        return;
    }

    const jeToTxTypes = new Map();
    const jeToProgramId = new Map();
    const programBulkPurchases = new Set();

    txs.forEach(t => {
        if (t.journal_entry_id) {
            // Since multiple transactions can point to the same journal entry ID in some cases
            if (!jeToTxTypes.has(t.journal_entry_id)) jeToTxTypes.set(t.journal_entry_id, new Set());
            let type = t.type || 'NORMAL';
            // In the app code, it checks t.isSaleOnly and t.isPurchaseOnly
            // We need to check if those columns exist or if they are encoded in 'type'
            // Looking at migrate_to_relational.js, it doesn't seem to have is_sale_only/is_purchase_only columns
            // But wait, I'll check the transactions table structure
            jeToTxTypes.get(t.journal_entry_id).add(type);
            if (t.program_id) {
                jeToProgramId.set(t.journal_entry_id, t.program_id);
                if (type === 'PURCHASE_ONLY') programBulkPurchases.add(t.program_id);
            }
        }
    });

    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
            id,
            date,
            journal_lines (
                account_id,
                account_name,
                account_type,
                debit,
                credit
            )
        `)
        .eq('tenant_id', TENANT_ID)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error("Error fetching journal entries:", error.message);
        return;
    }

    const balances = {};
    entries.forEach(entry => {
        // The original ID was something like JE-123_index, but transactions might refer to JE-123
        // In my migration I changed entry.id to uniqueEntryId = `${entry.id}_${entryIdx}`
        // But the transactions in the JSON had journalEntryId: entry.id
        // So I need to match carefully.
        
        // Find the base ID (before the _index)
        const baseId = entry.id.split('_')[0];
        const types = jeToTxTypes.get(baseId) || new Set(['NORMAL']);
        const isPurchaseOnly = types.has('PURCHASE_ONLY');
        const isRevenueOnly = types.has('REVENUE_ONLY') || types.has('SALE_ONLY');
        const programId = jeToProgramId.get(baseId);

        (entry.journal_lines || []).forEach(line => {
            // Repair Logic
            if (isPurchaseOnly && !isRevenueOnly && (line.account_type === 'REVENUE' || line.account_type === 'CUSTOMER')) return;
            if (isRevenueOnly && !isPurchaseOnly && (line.account_type === 'EXPENSE' || line.account_type === 'SUPPLIER')) return;
            
            if (programId && programBulkPurchases.has(programId) && !isPurchaseOnly && (line.account_type === 'EXPENSE' || line.account_type === 'SUPPLIER')) {
                return;
            }

            const key = line.account_id || line.account_name;
            if (!balances[key]) {
                balances[key] = { 
                    name: line.account_name, 
                    type: line.account_type, 
                    debit: 0, 
                    credit: 0 
                };
            }
            balances[key].debit += (line.debit || 0);
            balances[key].credit += (line.credit || 0);
        });
    });

    let flightRev = 0;
    let hajjUmrahRev = 0;
    let otherRev = 0;
    let directCosts = 0;
    let adminExp = 0;

    Object.entries(balances).forEach(([id, b]) => {
        const netCredit = b.credit - b.debit;
        const netDebit = b.debit - b.credit;

        if (id === 'FLIGHT_REVENUE') flightRev += netCredit;
        else if (id === 'HAJJ_UMRAH_REVENUE') hajjUmrahRev += netCredit;
        else if (b.type === 'REVENUE' || id.includes('REVENUE') || id === 'SALES_REVENUE' || id === 'SERVICE_REVENUE') {
            otherRev += netCredit;
        }
        else if (id === 'FLIGHT_COST' || id === 'HAJJ_UMRAH_COST' || id === 'COGS' || id === 'SERVICE_COST' || id === 'DIRECT_COST') {
            directCosts += netDebit;
        }
        else if (b.type === 'EXPENSE') {
            adminExp += netDebit;
        }
    });

    console.log("--- Repaired Cloud Profit & Loss ---");
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

calculateCloudPLWithRepair();
