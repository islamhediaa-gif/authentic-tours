
-- 1. وظيفة لجلب كشف حساب تفصيلي بسرعة البرق
-- تقبل: tenant_id, entity_id, start_date, end_date
CREATE OR REPLACE FUNCTION get_statement(
    p_tenant_id TEXT,
    p_entity_id TEXT,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    tx_date TIMESTAMP WITH TIME ZONE,
    ref_no TEXT,
    description TEXT,
    debit DECIMAL(15, 2),
    credit DECIMAL(15, 2),
    running_balance DECIMAL(15, 2)
) AS $$
DECLARE
    v_opening_balance DECIMAL(15, 2) := 0;
BEGIN
    -- حساب الرصيد الافتتاحي قبل التاريخ المحدد
    SELECT COALESCE(SUM(amount_in_base), 0) INTO v_opening_balance
    FROM transactions
    WHERE tenant_id = p_tenant_id 
      AND (related_entity_id = p_entity_id OR target_entity_id = p_entity_id)
      AND date < p_start_date
      AND is_voided = FALSE;

    -- جلب الحركات مع حساب الرصيد المتراكم
    RETURN QUERY
    WITH movements AS (
        SELECT 
            date, 
            transactions.ref_no::TEXT, 
            transactions.description,
            CASE WHEN amount_in_base > 0 THEN amount_in_base ELSE 0 END as dbt,
            CASE WHEN amount_in_base < 0 THEN ABS(amount_in_base) ELSE 0 END as crdt
        FROM transactions
        WHERE tenant_id = p_tenant_id 
          AND (related_entity_id = p_entity_id OR target_entity_id = p_entity_id)
          AND date BETWEEN p_start_date AND p_end_date
          AND is_voided = FALSE
        ORDER BY date ASC
    )
    SELECT 
        m.date, 
        m.ref_no, 
        m.description, 
        m.dbt, 
        m.crdt,
        v_opening_balance + SUM(m.dbt - m.crdt) OVER (ORDER BY m.date, m.ref_no) as running_balance
    FROM movements m;
END;
$$ LANGUAGE plpgsql;

-- 2. وظيفة لتحديث أرصدة العملاء/الموردين فوراً عند أي عملية
CREATE OR REPLACE FUNCTION refresh_entity_balances(p_tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
    -- تحديث أرصدة العملاء
    UPDATE customers c
    SET balance = (
        SELECT COALESCE(SUM(amount_in_base), 0)
        FROM transactions t
        WHERE t.tenant_id = p_tenant_id 
          AND t.related_entity_id = c.id
          AND t.is_voided = FALSE
    )
    WHERE c.tenant_id = p_tenant_id;
    
    -- تحديث أرصدة الموردين
    UPDATE suppliers s
    SET balance = (
        SELECT COALESCE(SUM(amount_in_base), 0)
        FROM transactions t
        WHERE t.tenant_id = p_tenant_id 
          AND (t.related_entity_id = s.id OR t.supplier_id = s.id)
          AND t.is_voided = FALSE
    )
    WHERE s.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;
