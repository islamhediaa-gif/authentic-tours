-- SQL Schema for Nebras ERP Pro
-- Created to support transition from JSON to SQL

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'USER', 'BOOKING_EMPLOYEE') DEFAULT 'USER',
    permissions TEXT -- Stored as JSON string
);

-- 2. Currencies table
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    rate_to_main DECIMAL(15, 6) DEFAULT 1.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance_currency VARCHAR(10),
    opening_balance_in_base DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0
);

-- 4. Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance_currency VARCHAR(10),
    opening_balance_in_base DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    is_saudi_wallet BOOLEAN DEFAULT FALSE,
    visa_quota INT DEFAULT 0
);

-- 5. Treasuries table (الصناديق والبنوك)
CREATE TABLE IF NOT EXISTS treasuries (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('CASH', 'BANK', 'WALLET') DEFAULT 'CASH',
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0
);

-- 6. Employees table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    basic_salary DECIMAL(15, 2) DEFAULT 0,
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    position VARCHAR(100),
    joining_date DATE,
    balance DECIMAL(15, 2) DEFAULT 0,
    advances DECIMAL(15, 2) DEFAULT 0,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_advances DECIMAL(15, 2) DEFAULT 0
);

-- 7. Transactions table (الجدول الأهم)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    ref_no VARCHAR(20),
    date DATETIME NOT NULL,
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
    cost_center_id VARCHAR(50) DEFAULT 'GENERAL', -- Added for branch/activity separation
    
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
    
    -- Hajj/Umrah specific
    program_id VARCHAR(50),
    program_name VARCHAR(100),
    master_trip_id VARCHAR(50),
    adult_count INT DEFAULT 0,
    child_count INT DEFAULT 0,
    infant_count INT DEFAULT 0,
    room_type VARCHAR(20),
    
    -- Other
    employee_id VARCHAR(50),
    parent_transaction_id VARCHAR(50),
    visa_status VARCHAR(20),
    visa_issued_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    ref_no VARCHAR(20),
    date DATETIME NOT NULL,
    description TEXT,
    total_amount DECIMAL(15, 2) NOT NULL
);

-- 9. Journal Lines table
CREATE TABLE IF NOT EXISTS journal_lines (
    id VARCHAR(50) PRIMARY KEY,
    journal_entry_id VARCHAR(50),
    account_id VARCHAR(50),
    account_type VARCHAR(30),
    account_name VARCHAR(100),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(15, 6),
    cost_center_id VARCHAR(50) DEFAULT 'GENERAL',
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);

-- 10. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    action VARCHAR(20),
    entity_type VARCHAR(30),
    entity_id VARCHAR(50),
    details TEXT,
    old_value LONGTEXT,
    new_value LONGTEXT
);
