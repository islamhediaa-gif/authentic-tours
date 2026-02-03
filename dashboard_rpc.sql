
-- Dashboard Summary RPC
-- This function provides a high-level summary of the financial state for the dashboard

CREATE OR REPLACE FUNCTION get_dashboard_summary(p_tenant_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_total_cash DECIMAL(15, 2);
    v_customer_debts DECIMAL(15, 2);
    v_supplier_credits DECIMAL(15, 2);
    v_total_sales DECIMAL(15, 2);
BEGIN
    -- 1. Total Cash from Treasuries
    SELECT COALESCE(SUM(balance), 0) INTO v_total_cash
    FROM treasuries
    WHERE tenant_id = p_tenant_id;

    -- 2. Customer Debts (Sum of positive balances)
    SELECT COALESCE(SUM(balance), 0) INTO v_customer_debts
    FROM customers
    WHERE tenant_id = p_tenant_id AND balance > 0;

    -- 3. Supplier Credits (Sum of positive balances)
    SELECT COALESCE(SUM(balance), 0) INTO v_supplier_credits
    FROM suppliers
    WHERE tenant_id = p_tenant_id AND balance > 0;

    -- 4. Total Sales (from transactions)
    -- Using a broader definition for sales in the context of this ERP
    SELECT COALESCE(SUM(amount_in_base), 0) INTO v_total_sales
    FROM transactions
    WHERE tenant_id = p_tenant_id 
      AND (category IN ('FLIGHT', 'HAJJ', 'UMRAH', 'SERVICE') OR type IN ('INCOME', 'SALE'))
      AND is_voided = FALSE;

    RETURN jsonb_build_object(
        'total_cash', v_total_cash,
        'customer_debts', v_customer_debts,
        'supplier_credits', v_supplier_credits,
        'total_sales', v_total_sales,
        'last_updated', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;
