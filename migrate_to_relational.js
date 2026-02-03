
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKUP_FILE = 'Backup_Nebras_2026-01-28 (4).json';
const TENANT_ID = 'authentic';

async function migrate() {
    console.log(`Starting enhanced migration for tenant: ${TENANT_ID}`);
    
    if (!fs.existsSync(BACKUP_FILE)) {
        console.error(`Backup file ${BACKUP_FILE} not found`);
        return;
    }

    const rawData = fs.readFileSync(BACKUP_FILE, 'utf8');
    const db = JSON.parse(rawData);

    // --- Pre-processing for Journal Entry Uniqueness ---
    const jeIdToUniqueIds = {};
    if (db.journalEntries) {
        console.log("Preparing unique IDs for journal entries...");
        db.journalEntries.forEach((entry, idx) => {
            if (!jeIdToUniqueIds[entry.id]) jeIdToUniqueIds[entry.id] = [];
            jeIdToUniqueIds[entry.id].push(`${entry.id}_${idx}`);
        });
    }
    const jeIdUsageCounter = {};

    // 0. Migrate Users
    if (db.users) {
        console.log(`Migrating ${db.users.length} users...`);
        const users = db.users.map(u => ({
            id: u.id || u.username,
            tenant_id: TENANT_ID,
            username: u.username,
            password: u.password || 'TEMPORARY_PASSWORD',
            name: u.name,
            role: u.role || 'USER',
            permissions: JSON.stringify(u.permissions || [])
        }));
        await supabase.from('users').upsert(users);
    }

    // 1. Migrate Customers
    if (db.customers) {
        console.log(`Migrating ${db.customers.length} customers...`);
        const customers = db.customers.map(c => ({
            id: c.id,
            tenant_id: TENANT_ID,
            name: c.name,
            phone: c.phone,
            email: c.email,
            opening_balance: c.openingBalance || 0,
            opening_balance_currency: c.openingBalanceCurrency,
            opening_balance_in_base: c.openingBalanceInBase || 0,
            balance: c.balance || 0
        }));
        await supabase.from('customers').upsert(customers);
    }

    // 2. Migrate Suppliers
    if (db.suppliers) {
        console.log(`Migrating ${db.suppliers.length} suppliers...`);
        const suppliers = db.suppliers.map(s => ({
            id: s.id,
            tenant_id: TENANT_ID,
            name: s.name,
            phone: s.phone,
            company: s.company,
            opening_balance: s.openingBalance || 0,
            opening_balance_currency: s.openingBalanceCurrency,
            opening_balance_in_base: s.openingBalanceInBase || 0,
            balance: s.balance || 0,
            is_saudi_wallet: s.isSaudiWallet || false,
            visa_quota: s.visaQuota || 0
        }));
        await supabase.from('suppliers').upsert(suppliers);
    }

    // 3. Migrate Transactions
    if (db.transactions) {
        console.log(`Migrating ${db.transactions.length} transactions...`);
        
        const seenIds = new Set();
        const uniqueTransactions = db.transactions.filter(t => {
            if (seenIds.has(t.id)) return false;
            seenIds.add(t.id);
            return true;
        });

        const CHUNK_SIZE = 50;
        for (let i = 0; i < uniqueTransactions.length; i += CHUNK_SIZE) {
            const chunk = uniqueTransactions.slice(i, i + CHUNK_SIZE).map(t => {
                // Determine unique journal entry ID
                let uniqueJeId = null;
                if (t.journalEntryId) {
                    const available = jeIdToUniqueIds[t.journalEntryId] || [];
                    if (available.length === 1) {
                        uniqueJeId = available[0];
                    } else if (available.length > 1) {
                        const count = jeIdUsageCounter[t.journalEntryId] || 0;
                        uniqueJeId = available[count] || available[0];
                        jeIdUsageCounter[t.journalEntryId] = count + 1;
                    } else {
                        uniqueJeId = t.journalEntryId;
                    }
                }

                // Workaround for logic repair if columns don't exist yet
                let effectiveType = t.type;
                if (t.isSaleOnly) effectiveType = 'REVENUE_ONLY';
                if (t.isPurchaseOnly) effectiveType = 'PURCHASE_ONLY';

                return {
                    id: t.id,
                    tenant_id: TENANT_ID,
                    ref_no: t.refNo,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    amount_in_base: t.amountInBase,
                    currency_code: t.currencyCode,
                    exchange_rate: t.exchangeRate,
                    type: effectiveType,
                    category: t.category,
                    related_entity_id: t.relatedEntityId,
                    related_entity_type: t.relatedEntityType,
                    treasury_id: t.treasuryId,
                    target_entity_id: t.targetEntityId,
                    target_entity_type: t.targetEntityType,
                    is_voided: t.isVoided || false,
                    cost_center_id: t.costCenterId || 'GENERAL',
                    pnr: t.pnr,
                    airline_code: t.airlineCode,
                    purchase_price: t.purchasePrice,
                    purchase_price_in_base: t.purchasePriceInBase,
                    selling_price: t.sellingPrice,
                    selling_price_in_base: t.sellingPriceInBase,
                    discount: t.discount,
                    discount_in_base: t.discountInBase,
                    supplier_id: t.supplierId,
                    supplier_type: t.supplierType,
                    program_id: t.programId,
                    program_name: t.programName,
                    master_trip_id: t.masterTripId,
                    adult_count: t.adultCount || 0,
                    child_count: t.childCount || 0,
                    infant_count: t.infantCount || 0,
                    room_type: t.roomType,
                    employee_id: t.employeeId,
                    parent_transaction_id: t.parentTransactionId,
                    visa_status: t.visaStatus,
                    visa_issued_count: t.visaIssuedCount || 0,
                    created_at: t.createdAt || new Date().toISOString(),
                    // Missing columns that need schema update
                    journal_entry_id: uniqueJeId,
                    is_sale_only: t.isSaleOnly || false,
                    is_purchase_only: t.isPurchaseOnly || false,
                    ticket_number: t.ticketNumber,
                    passenger_name: t.passengerName,
                    route: t.route,
                    booking_type: t.bookingType,
                    agent_id: t.agentId,
                    supervisor_count: t.supervisorCount || 0,
                    supervisor_name: t.supervisorName,
                    accommodation: t.accommodation,
                    expense_category: t.expenseCategory,
                    accommodation_employee_id: t.accommodationEmployeeId,
                    booking_group_id: t.bookingGroupId,
                    room_id: t.roomId,
                    occupant_index: t.occupantIndex,
                    component_id: t.componentId,
                    names: t.names
                };
            });
            const { error } = await supabase.from('transactions').upsert(chunk);
            if (error) {
                if (error.message.includes('column') || error.code === '42703') {
                    console.warn(`⚠️ Warning: Some columns missing in database. Retrying with basic fields...`);
                    // Fallback to minimal fields if schema hasn't been updated yet
                    const fallbackChunk = chunk.map(c => {
                        const minimal = { ...c };
                        // Remove columns we suspect are missing
                        delete minimal.journal_entry_id;
                        delete minimal.is_sale_only;
                        delete minimal.is_purchase_only;
                        delete minimal.ticket_number;
                        delete minimal.passenger_name;
                        delete minimal.route;
                        delete minimal.booking_type;
                        delete minimal.agent_id;
                        delete minimal.supervisor_count;
                        delete minimal.supervisor_name;
                        delete minimal.accommodation;
                        delete minimal.expense_category;
                        delete minimal.accommodation_employee_id;
                        delete minimal.booking_group_id;
                        delete minimal.room_id;
                        delete minimal.occupant_index;
                        delete minimal.component_id;
                        delete minimal.names;
                        return minimal;
                    });
                    const { error: fallbackErr } = await supabase.from('transactions').upsert(fallbackChunk);
                    if (fallbackErr) console.error("Fallback failed:", fallbackErr.message);
                } else {
                    console.error(`❌ Error migrating transactions chunk ${i}:`, error.message);
                }
            }
        }
    }

    // 4. Migrate Journal Entries
    if (db.journalEntries) {
        console.log(`Migrating ${db.journalEntries.length} journal entries...`);
        for (let entryIdx = 0; entryIdx < db.journalEntries.length; entryIdx++) {
            const entry = db.journalEntries[entryIdx];
            const uniqueEntryId = `${entry.id}_${entryIdx}`;
            
            await supabase.from('journal_entries').upsert({
                id: uniqueEntryId,
                tenant_id: TENANT_ID,
                ref_no: entry.refNo,
                date: entry.date,
                description: entry.description,
                total_amount: entry.totalAmount
            });

            if (entry.lines) {
                const lines = entry.lines.map((l, lineIdx) => ({
                    id: `${uniqueEntryId}_${lineIdx}`,
                    tenant_id: TENANT_ID,
                    journal_entry_id: uniqueEntryId,
                    account_id: l.accountId,
                    account_type: l.accountType,
                    account_name: l.accountName,
                    debit: l.debit || 0,
                    credit: l.credit || 0,
                    currency_code: l.currencyCode,
                    exchange_rate: l.exchangeRate,
                    cost_center_id: l.costCenterId || 'GENERAL'
                }));
                await supabase.from('journal_lines').upsert(lines);
            }
        }
    }

    // 5. Migrate Remaining (Partners, Employees, Treasuries, etc.)
    if (db.partners) await supabase.from('partners').upsert(db.partners.map(p => ({ id: p.id, tenant_id: TENANT_ID, name: p.name, balance: p.balance || 0, opening_balance: p.openingBalance || 0 })));
    if (db.employees) await supabase.from('employees').upsert(db.employees.map(e => ({ id: e.id, tenant_id: TENANT_ID, name: e.name, phone: e.phone, basic_salary: e.basicSalary || 0, commission_rate: e.commissionRate || 0, position: e.position, joining_date: e.joiningDate, balance: e.balance || 0, advances: e.advances || 0, opening_balance: e.openingBalance || 0, opening_advances: e.openingAdvances || 0 })));
    if (db.treasuries) await supabase.from('treasuries').upsert(db.treasuries.map(t => ({ id: t.id, tenant_id: TENANT_ID, name: t.name, type: t.type || 'CASH', opening_balance: t.openingBalance || 0, balance: t.balance || 0 })));
    if (db.currencies) await supabase.from('currencies').upsert(db.currencies.map(c => ({ code: c.code, tenant_id: TENANT_ID, name: c.name, symbol: c.symbol, rate_to_main: c.rateToMain || 1.0 })));
    if (db.costCenters) await supabase.from('cost_centers').upsert(db.costCenters.map(cc => ({ id: cc.id, tenant_id: TENANT_ID, name: cc.name, code: cc.code, description: cc.description, is_active: cc.isActive ?? true })));

    console.log("Migration complete!");
}

migrate();
