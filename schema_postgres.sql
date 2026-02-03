-- Postgres Schema for Nebras ERP Pro (Supabase Optimized)
-- Created to support transition from JSON to SQL with Multi-tenancy

-- Enable UUID extension if needed (though we use string IDs for compatibility)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to reload PostgREST schema cache
CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS void AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) DEFAULT 'USER', -- ADMIN, USER, BOOKING_EMPLOYEE
    permissions TEXT, -- Stored as JSON string
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, username)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- 2. Currencies table
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(10),
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    rate_to_main DECIMAL(15, 6) DEFAULT 1.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_currencies_tenant ON currencies(tenant_id);

-- 3. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance_currency VARCHAR(10),
    opening_balance_in_base DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    currency_balance DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

-- 4. Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance_currency VARCHAR(10),
    opening_balance_in_base DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    currency_balance DECIMAL(15, 2) DEFAULT 0,
    is_saudi_wallet BOOLEAN DEFAULT FALSE,
    visa_quota INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);

-- 5. Treasuries table (الصناديق والبنوك)
CREATE TABLE IF NOT EXISTS treasuries (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'CASH', -- CASH, BANK, WALLET
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(15, 6),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_treasuries_tenant ON treasuries(tenant_id);

-- 6. Employees table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    basic_salary DECIMAL(15, 2) DEFAULT 0,
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    position VARCHAR(100),
    joining_date DATE,
    balance DECIMAL(15, 2) DEFAULT 0,
    advances DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_advances DECIMAL(15, 2) DEFAULT 0,
    fingerprint_id VARCHAR(50),
    shift_id VARCHAR(50),
    department_id VARCHAR(50),
    designation_id VARCHAR(50),
    leave_balance DECIMAL(10, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);

-- 7. Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    ref_no VARCHAR(20),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    amount_in_base DECIMAL(15, 2) NOT NULL,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(15, 6),
    type VARCHAR(30), -- INCOME, EXPENSE, etc.
    category VARCHAR(30), -- FLIGHT, HAJJ, etc.
    related_entity_id VARCHAR(50),
    related_entity_type VARCHAR(20),
    treasury_id VARCHAR(50),
    target_entity_id VARCHAR(50),
    target_entity_type VARCHAR(20),
    is_voided BOOLEAN DEFAULT FALSE,
    is_sale_only BOOLEAN DEFAULT FALSE,
    is_purchase_only BOOLEAN DEFAULT FALSE,
    cost_center_id VARCHAR(50) DEFAULT 'GENERAL',
    
    -- Flight specific
    pnr VARCHAR(20),
    airline_code VARCHAR(10),
    purchase_price DECIMAL(15, 2),
    purchase_price_in_base DECIMAL(15, 2),
    selling_price DECIMAL(15, 2),
    selling_price_in_base DECIMAL(15, 2),
    discount DECIMAL(15, 2),
    discount_in_base DECIMAL(15, 2),
    supplier_id VARCHAR(50),
    supplier_type VARCHAR(20),
    ticket_number VARCHAR(50),
    passenger_name VARCHAR(100),
    route TEXT,
    
    -- Hajj/Umrah specific
    program_id VARCHAR(50),
    program_name VARCHAR(100),
    master_trip_id VARCHAR(50),
    adult_count INT DEFAULT 0,
    child_count INT DEFAULT 0,
    infant_count INT DEFAULT 0,
    room_type VARCHAR(20),
    booking_type VARCHAR(20),
    agent_id VARCHAR(50),
    supervisor_count INT DEFAULT 0,
    supervisor_name VARCHAR(100),
    accommodation TEXT,
    room_id VARCHAR(50),
    occupant_index INT,
    component_id VARCHAR(50),
    names TEXT,
    
    -- Other
    employee_id VARCHAR(50),
    employee_commission_rate DECIMAL(15, 2) DEFAULT 0,
    commission_amount DECIMAL(15, 2) DEFAULT 0,
    expense_category VARCHAR(50),
    journal_entry_id VARCHAR(50),
    accommodation_employee_id VARCHAR(50),
    booking_group_id VARCHAR(50),
    parent_transaction_id VARCHAR(50),
    visa_status VARCHAR(20),
    visa_issued_count INT DEFAULT 0,
    apply_commission BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(ref_no);

-- 8. Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    ref_no VARCHAR(20),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    total_amount DECIMAL(15, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id);

-- 9. Journal Lines table
CREATE TABLE IF NOT EXISTS journal_lines (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    journal_entry_id VARCHAR(50) REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id VARCHAR(50),
    account_type VARCHAR(30),
    account_name VARCHAR(100),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    original_amount DECIMAL(15, 2) DEFAULT 0,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(15, 6),
    cost_center_id VARCHAR(50) DEFAULT 'GENERAL',
    program_id VARCHAR(50),
    component_id VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_journal_lines_tenant ON journal_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);

-- 10. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    action VARCHAR(20),
    entity_type VARCHAR(30),
    entity_id VARCHAR(50),
    details TEXT,
    old_value TEXT,
    new_value TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);

-- 11. Partners table
CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_partners_tenant ON partners(tenant_id);

-- 12. Cost Centers table
CREATE TABLE IF NOT EXISTS cost_centers (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON cost_centers(tenant_id);

-- 13. HR Tables
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designations (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) REFERENCES departments(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. More HR Tables
CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time VARCHAR(10), -- "09:00"
    end_time VARCHAR(10),   -- "17:00"
    grace_period INT DEFAULT 15,
    deduction_rate DECIMAL(15, 2) DEFAULT 0,
    deduction_type VARCHAR(20) DEFAULT 'FIXED', -- FIXED, HOURLY_PERCENT
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_leaves (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id),
    type VARCHAR(20), -- ANNUAL, SICK, UNPAID, OTHER
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_allowances (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id),
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) DEFAULT 'FIXED', -- FIXED, PERCENTAGE
    is_monthly BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_documents (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    expiry_date DATE,
    file_path TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Attendance Logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_sn INT,
    device_user_id VARCHAR(50),
    record_time TIMESTAMP WITH TIME ZONE NOT NULL,
    ip VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tenant ON attendance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee ON attendance_logs(device_user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_time ON attendance_logs(record_time);

-- 16. Tenant Settings table (To replace full JSON blob for settings)
CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    base_currency VARCHAR(10) DEFAULT 'EGP',
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(100),
    enable_cost_centers BOOLEAN DEFAULT FALSE,
    other_settings JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Master Trips table (For Hajj/Umrah Programs and Accommodation)
CREATE TABLE IF NOT EXISTS master_trips (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    type VARCHAR(20), -- HAJJ, UMRAH, GENERAL
    details TEXT,
    is_voided BOOLEAN DEFAULT FALSE,
    components JSONB,
    accommodation JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_master_trips_tenant ON master_trips(tenant_id);

-- Add triggers for all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_currencies_updated_at ON currencies;
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treasuries_updated_at ON treasuries;
CREATE TRIGGER update_treasuries_updated_at BEFORE UPDATE ON treasuries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_lines_updated_at ON journal_lines;
CREATE TRIGGER update_journal_lines_updated_at BEFORE UPDATE ON journal_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cost_centers_updated_at ON cost_centers;
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON cost_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_designations_updated_at ON designations;
CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_leaves_updated_at ON employee_leaves;
CREATE TRIGGER update_employee_leaves_updated_at BEFORE UPDATE ON employee_leaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_allowances_updated_at ON employee_allowances;
CREATE TRIGGER update_employee_allowances_updated_at BEFORE UPDATE ON employee_allowances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_documents_updated_at ON employee_documents;
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_logs_updated_at ON attendance_logs;
CREATE TRIGGER update_attendance_logs_updated_at BEFORE UPDATE ON attendance_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_settings_updated_at ON tenant_settings;
CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_master_trips_updated_at ON master_trips;
CREATE TRIGGER update_master_trips_updated_at BEFORE UPDATE ON master_trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
