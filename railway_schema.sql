-- Nebras ERP Full MySQL Schema for Railway
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Customers
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    email VARCHAR(255),
    address TEXT,
    balance DECIMAL(15, 2) DEFAULT 0,
    currency_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance_in_base DECIMAL(15, 2) DEFAULT 0,
    opening_balance_currency VARCHAR(10) DEFAULT 'EGP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Suppliers
DROP TABLE IF EXISTS suppliers;
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    company VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(100),
    balance DECIMAL(15, 2) DEFAULT 0,
    currency_balance DECIMAL(15, 2) DEFAULT 0,
    is_saudi_wallet BOOLEAN DEFAULT FALSE,
    visa_quota INT DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance_in_base DECIMAL(15, 2) DEFAULT 0,
    opening_balance_currency VARCHAR(10) DEFAULT 'EGP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Partners
DROP TABLE IF EXISTS partners;
CREATE TABLE partners (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Employees
DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    position VARCHAR(100),
    basic_salary DECIMAL(15, 2) DEFAULT 0,
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    advances DECIMAL(15, 2) DEFAULT 0,
    shift_id VARCHAR(50),
    department_id VARCHAR(50),
    designation_id VARCHAR(50),
    fingerprint_id VARCHAR(50),
    joining_date DATE,
    leave_balance DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Treasuries
DROP TABLE IF EXISTS treasuries;
CREATE TABLE treasuries (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    currency_code VARCHAR(10) DEFAULT 'EGP',
    exchange_rate DECIMAL(15, 6) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Currencies
DROP TABLE IF EXISTS currencies;
CREATE TABLE currencies (
    code VARCHAR(10),
    tenant_id VARCHAR(50),
    name VARCHAR(50),
    symbol VARCHAR(10),
    rate_to_main DECIMAL(15, 6) DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (code, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Master Trips
DROP TABLE IF EXISTS master_trips;
CREATE TABLE master_trips (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    date DATE,
    details LONGTEXT,
    accommodation LONGTEXT,
    components LONGTEXT,
    is_voided TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Programs
DROP TABLE IF EXISTS programs;
CREATE TABLE programs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255),
    date DATE,
    type VARCHAR(50),
    employee_id VARCHAR(50),
    supplier_id VARCHAR(50),
    master_trip_id VARCHAR(50),
    currency_code VARCHAR(10),
    selling_price DECIMAL(15, 2),
    purchase_price DECIMAL(15, 2),
    components LONGTEXT,
    details LONGTEXT,
    is_agent TINYINT(1) DEFAULT 0,
    room_type VARCHAR(50),
    adult_count INT,
    child_count INT,
    infant_count INT,
    supplier_type VARCHAR(50),
    quad_adult_count INT,
    quad_agent_price DECIMAL(15, 2),
    quad_child_count INT,
    adult_agent_price DECIMAL(15, 2),
    apply_commission TINYINT(1),
    child_agent_price DECIMAL(15, 2),
    quad_infant_count INT,
    double_adult_count INT,
    double_agent_price DECIMAL(15, 2),
    double_child_count INT,
    infant_agent_price DECIMAL(15, 2),
    quad_selling_price DECIMAL(15, 2),
    single_adult_count INT,
    single_agent_price DECIMAL(15, 2),
    single_child_count INT,
    triple_adult_count INT,
    triple_agent_price DECIMAL(15, 2),
    triple_child_count INT,
    adult_selling_price DECIMAL(15, 2),
    child_selling_price DECIMAL(15, 2),
    double_infant_count INT,
    quad_purchase_price DECIMAL(15, 2),
    single_infant_count INT,
    triple_infant_count INT,
    adult_purchase_price DECIMAL(15, 2),
    child_purchase_price DECIMAL(15, 2),
    double_selling_price DECIMAL(15, 2),
    infant_selling_price DECIMAL(15, 2),
    single_selling_price DECIMAL(15, 2),
    triple_selling_price DECIMAL(15, 2),
    double_purchase_price DECIMAL(15, 2),
    infant_purchase_price DECIMAL(15, 2),
    single_purchase_price DECIMAL(15, 2),
    triple_purchase_price DECIMAL(15, 2),
    quad_child_selling_price DECIMAL(15, 2),
    employee_commission_rate DECIMAL(15, 6),
    quad_child_purchase_price DECIMAL(15, 2),
    quad_infant_selling_price DECIMAL(15, 2),
    double_child_selling_price DECIMAL(15, 2),
    quad_infant_purchase_price DECIMAL(15, 2),
    single_child_selling_price DECIMAL(15, 2),
    triple_child_selling_price DECIMAL(15, 2),
    double_child_purchase_price DECIMAL(15, 2),
    double_infant_selling_price DECIMAL(15, 2),
    single_child_purchase_price DECIMAL(15, 2),
    single_infant_selling_price DECIMAL(15, 2),
    triple_child_purchase_price DECIMAL(15, 2),
    triple_infant_selling_price DECIMAL(15, 2),
    double_infant_purchase_price DECIMAL(15, 2),
    single_infant_purchase_price DECIMAL(15, 2),
    triple_infant_purchase_price DECIMAL(15, 2),
    customer_id VARCHAR(50),
    exchange_rate DECIMAL(15, 6),
    commission_amount DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Transactions
DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    date DATETIME NOT NULL,
    type VARCHAR(50),
    category VARCHAR(50),
    amount DECIMAL(15, 2) DEFAULT 0,
    amount_in_base DECIMAL(15, 2) DEFAULT 0,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(15, 6) DEFAULT 1,
    description TEXT,
    ref_no VARCHAR(100),
    related_entity_id VARCHAR(50),
    related_entity_type VARCHAR(50),
    target_entity_id VARCHAR(50),
    treasury_id VARCHAR(50),
    journal_entry_id VARCHAR(50),
    purchase_price_in_base DECIMAL(15, 2) DEFAULT 0,
    selling_price_in_base DECIMAL(15, 2) DEFAULT 0,
    is_purchase_only BOOLEAN DEFAULT FALSE,
    is_sale_only BOOLEAN DEFAULT FALSE,
    program_id VARCHAR(50),
    master_trip_id VARCHAR(50),
    component_id VARCHAR(50),
    is_voided BOOLEAN DEFAULT FALSE,
    -- Added missing columns for full compatibility
    pnr VARCHAR(50),
    ticket_number VARCHAR(100),
    passenger_name VARCHAR(255),
    route TEXT,
    airline_code VARCHAR(20),
    purchase_price DECIMAL(15, 2) DEFAULT 0,
    selling_price DECIMAL(15, 2) DEFAULT 0,
    discount DECIMAL(15, 2) DEFAULT 0,
    discount_in_base DECIMAL(15, 2) DEFAULT 0,
    supplier_id VARCHAR(50),
    supplier_type VARCHAR(50),
    program_name VARCHAR(255),
    booking_type VARCHAR(50),
    agent_id VARCHAR(50),
    adult_count INT DEFAULT 0,
    child_count INT DEFAULT 0,
    infant_count INT DEFAULT 0,
    supervisor_count INT DEFAULT 0,
    supervisor_name VARCHAR(255),
    room_type VARCHAR(50),
    accommodation TEXT,
    expense_category VARCHAR(100),
    employee_id VARCHAR(50),
    employee_commission_rate DECIMAL(15, 6) DEFAULT 0,
    commission_amount DECIMAL(15, 2) DEFAULT 0,
    accommodation_employee_id VARCHAR(50),
    parent_transaction_id VARCHAR(50),
    booking_group_id VARCHAR(50),
    visa_status VARCHAR(50),
    visa_issued_count INT DEFAULT 0,
    cost_center_id VARCHAR(50),
    apply_commission BOOLEAN DEFAULT FALSE,
    room_id VARCHAR(50),
    occupant_index INT DEFAULT 0,
    names TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id),
    INDEX (date),
    INDEX (journal_entry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Journal Entries
DROP TABLE IF EXISTS journal_entries;
CREATE TABLE journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    date DATE NOT NULL,
    ref_no VARCHAR(100),
    description TEXT,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id),
    INDEX (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Journal Lines
DROP TABLE IF EXISTS journal_lines;
CREATE TABLE journal_lines (
    id VARCHAR(50) PRIMARY KEY,
    journal_entry_id VARCHAR(50),
    tenant_id VARCHAR(50),
    account_id VARCHAR(50),
    account_name VARCHAR(255),
    account_type VARCHAR(50),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(15, 6) DEFAULT 1,
    original_amount DECIMAL(15, 2),
    cost_center_id VARCHAR(50),
    program_id VARCHAR(50),
    component_id VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (journal_entry_id),
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    permissions LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Cost Centers
DROP TABLE IF EXISTS cost_centers;
CREATE TABLE cost_centers (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    code VARCHAR(50),
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Shifts
DROP TABLE IF EXISTS shifts;
CREATE TABLE shifts (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255),
    start_time TIME,
    end_time TIME,
    grace_period INT,
    deduction_rate DECIMAL(5, 2),
    deduction_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Departments
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Designations
DROP TABLE IF EXISTS designations;
CREATE TABLE designations (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255),
    department_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. Audit Logs
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    timestamp DATETIME,
    user_id VARCHAR(50),
    user_name VARCHAR(255),
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id VARCHAR(50),
    details LONGTEXT,
    old_value LONGTEXT,
    new_value LONGTEXT,
    INDEX (tenant_id),
    INDEX (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. User Backups
DROP TABLE IF EXISTS user_backups;
CREATE TABLE user_backups (
    user_id VARCHAR(50) PRIMARY KEY,
    data LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. Tenant Settings
DROP TABLE IF EXISTS tenant_settings;
CREATE TABLE tenant_settings (
    tenant_id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    logo_url LONGTEXT,
    base_currency VARCHAR(10) DEFAULT 'EGP',
    address TEXT,
    phone VARCHAR(100),
    email VARCHAR(100),
    website VARCHAR(100),
    enable_cost_centers BOOLEAN DEFAULT FALSE,
    other_settings LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. Employee Leaves
DROP TABLE IF EXISTS employee_leaves;
CREATE TABLE employee_leaves (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    employee_id VARCHAR(50),
    type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. Employee Allowances
DROP TABLE IF EXISTS employee_allowances;
CREATE TABLE employee_allowances (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    employee_id VARCHAR(50),
    name VARCHAR(255),
    amount DECIMAL(15, 2),
    type VARCHAR(50),
    is_monthly BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. Employee Documents
DROP TABLE IF EXISTS employee_documents;
CREATE TABLE employee_documents (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    employee_id VARCHAR(50),
    name VARCHAR(255),
    type VARCHAR(100),
    expiry_date DATE,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. Attendance Logs
DROP TABLE IF EXISTS attendance_logs;
CREATE TABLE attendance_logs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    user_sn INT,
    device_user_id VARCHAR(50),
    record_time DATETIME,
    ip VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- View for Equity Summary (Refined with FULL Live Repair Logic AND Opening Balances)
CREATE OR REPLACE VIEW view_equity_summary AS
WITH tx_info AS (
    SELECT 
        journal_entry_id,
        MAX(CASE WHEN is_purchase_only = 1 THEN 1 ELSE 0 END) as is_purchase_only,
        MAX(CASE WHEN is_sale_only = 1 THEN 1 ELSE 0 END) as is_sale_only,
        MAX(program_id) as program_id,
        MAX(category) as category
    FROM transactions
    GROUP BY journal_entry_id
),
program_bulk AS (
    SELECT DISTINCT program_id
    FROM transactions
    WHERE is_purchase_only = 1 AND program_id IS NOT NULL AND program_id != ''
),
category_bulk AS (
    SELECT DISTINCT category
    FROM transactions
    WHERE is_purchase_only = 1 AND category IS NOT NULL AND category != ''
),
category_hints AS (
    SELECT 
        journal_entry_id,
        MAX(CASE WHEN account_id = 'FLIGHT_COST' THEN CAST('FLIGHT' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci 
                 WHEN account_id = 'HAJJ_UMRAH_COST' THEN CAST('HAJJ_UMRAH' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci 
                 ELSE CAST('' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci END) as hint
    FROM journal_lines
    GROUP BY journal_entry_id
),
filtered_lines AS (
    SELECT 
        jl.tenant_id,
        jl.account_type,
        jl.credit,
        jl.debit
    FROM journal_lines jl
    LEFT JOIN tx_info t ON jl.journal_entry_id = t.journal_entry_id
    LEFT JOIN category_hints ch ON jl.journal_entry_id = ch.journal_entry_id
    LEFT JOIN program_bulk pb ON jl.program_id = pb.program_id
    LEFT JOIN category_bulk cb ON ch.hint = cb.category
    WHERE 
        -- Live Repair Logic
        NOT (COALESCE(t.is_purchase_only, 0) = 1 AND COALESCE(t.is_sale_only, 0) = 0 AND jl.account_type IN ('REVENUE', 'CUSTOMER'))
        AND NOT (COALESCE(t.is_sale_only, 0) = 1 AND COALESCE(t.is_purchase_only, 0) = 0 AND jl.account_type IN ('EXPENSE', 'SUPPLIER'))
        AND NOT (pb.program_id IS NOT NULL AND COALESCE(t.is_purchase_only, 0) = 0 AND jl.account_type IN ('EXPENSE', 'SUPPLIER'))
        AND NOT (cb.category IS NOT NULL AND COALESCE(t.is_purchase_only, 0) = 0 AND jl.account_type IN ('EXPENSE', 'SUPPLIER'))
)
SELECT 
    tenant_id,
    -- Capital = Implied Capital from opening balances
    (
        COALESCE((SELECT SUM(opening_balance * COALESCE(exchange_rate, 1)) FROM treasuries), 0) +
        COALESCE((SELECT SUM(opening_balance_in_base) FROM customers), 0) -
        COALESCE((SELECT SUM(opening_balance_in_base) FROM suppliers), 0) -
        COALESCE((SELECT SUM(opening_balance) FROM partners), 0)
    ) as total_capital,
    -- Net Profit from filtered journal lines
    SUM(CASE 
        WHEN account_type = 'REVENUE' THEN (credit - debit)
        WHEN account_type = 'EXPENSE' THEN (credit - debit)
        ELSE 0 END) as net_profit,
    -- Partners Balance (Opening + Transactions)
    COALESCE((SELECT SUM(opening_balance) FROM partners), 0) +
    SUM(CASE WHEN account_type = 'PARTNER' THEN (credit - debit) ELSE 0 END) as partners_balance,
    -- Total Equity = Capital + Profit + Partners (This should match the formula)
    (
        COALESCE((SELECT SUM(opening_balance * COALESCE(exchange_rate, 1)) FROM treasuries), 0) +
        COALESCE((SELECT SUM(opening_balance_in_base) FROM customers), 0) -
        COALESCE((SELECT SUM(opening_balance_in_base) FROM suppliers), 0) -
        COALESCE((SELECT SUM(opening_balance) FROM partners), 0)
    ) +
    SUM(CASE 
        WHEN account_type = 'REVENUE' THEN (credit - debit)
        WHEN account_type = 'EXPENSE' THEN (credit - debit)
        ELSE 0 END) +
    (
        COALESCE((SELECT SUM(opening_balance) FROM partners), 0) +
        SUM(CASE WHEN account_type = 'PARTNER' THEN (credit - debit) ELSE 0 END)
    ) as total_equity
FROM filtered_lines
GROUP BY tenant_id;

SET FOREIGN_KEY_CHECKS = 1;
