-- Fix Schema Script (Comprehensive)
-- Run this in Supabase SQL Editor to ensure all tables exist and have correct columns

-- 1. Customers Table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS currency_balance DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance_currency VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance_in_base DECIMAL(15, 2) DEFAULT 0;

-- 2. Suppliers Table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS currency_balance DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS opening_balance_currency VARCHAR(10);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS opening_balance_in_base DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_saudi_wallet BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS visa_quota INT DEFAULT 0;

-- 3. Transactions Table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_sale_only BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_purchase_only BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS employee_commission_rate DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS apply_commission BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cost_center_id VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pnr VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS airline_code VARCHAR(10);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purchase_price_in_base DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS selling_price DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS selling_price_in_base DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_in_base DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS passenger_name VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS route TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS program_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS program_name VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS master_trip_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS adult_count INT DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS child_count INT DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS infant_count INT DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS room_type VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supervisor_count INT DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS accommodation TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS occupant_index INT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS component_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS names TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expense_category VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS journal_entry_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS accommodation_employee_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS booking_group_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS parent_transaction_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS visa_status VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS visa_issued_count INT DEFAULT 0;

-- 4. Employees Table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS basic_salary DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS opening_advances DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fingerprint_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS designation_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_balance DECIMAL(10, 2) DEFAULT 0;

-- 5. Treasuries Table
ALTER TABLE treasuries ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10);
ALTER TABLE treasuries ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15, 6);

-- 6. Journal Lines Table
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS original_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS cost_center_id VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS program_id VARCHAR(50);
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS component_id VARCHAR(50);

-- 7. Create Missing Tables if they don't exist

-- Partners
CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cost Centers
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

-- HR Tables
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

CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    grace_period INT DEFAULT 15,
    deduction_rate DECIMAL(15, 2) DEFAULT 0,
    deduction_type VARCHAR(20) DEFAULT 'FIXED',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_leaves (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id),
    type VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_allowances (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id),
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) DEFAULT 'FIXED',
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

CREATE TABLE IF NOT EXISTS attendance_logs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_sn INT,
    device_user_id VARCHAR(50),
    record_time TIMESTAMP WITH TIME ZONE NOT NULL,
    ip VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS master_trips (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    type VARCHAR(20),
    details TEXT,
    is_voided BOOLEAN DEFAULT FALSE,
    components JSONB,
    accommodation JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Logs
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

-- 12. Helper Functions
CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS void AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for missing tables
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON cost_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_leaves_updated_at BEFORE UPDATE ON employee_leaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_allowances_updated_at BEFORE UPDATE ON employee_allowances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_logs_updated_at BEFORE UPDATE ON attendance_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_trips_updated_at BEFORE UPDATE ON master_trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Update existing transactions to avoid nulls
UPDATE transactions SET is_sale_only = FALSE WHERE is_sale_only IS NULL;
UPDATE transactions SET is_purchase_only = FALSE WHERE is_purchase_only IS NULL;
UPDATE transactions SET employee_commission_rate = 0 WHERE employee_commission_rate IS NULL;
UPDATE transactions SET commission_amount = 0 WHERE commission_amount IS NULL;
UPDATE customers SET currency_balance = 0 WHERE currency_balance IS NULL;
UPDATE suppliers SET currency_balance = 0 WHERE currency_balance IS NULL;
UPDATE journal_lines SET original_amount = 0 WHERE original_amount IS NULL;
