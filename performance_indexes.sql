
-- تفعيل ميزة البحث السريع في الوصف وأرقام المرجع
CREATE INDEX IF NOT EXISTS idx_transactions_search ON transactions 
USING gin(to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(ref_no, '') || ' ' || COALESCE(pnr, '')));

-- إضافة ميزة الفلترة السريعة حسب نوع العملية والتصنيف
CREATE INDEX IF NOT EXISTS idx_transactions_type_cat ON transactions(tenant_id, type, category);

-- تحسين سرعة جلب كشوفات الحساب
CREATE INDEX IF NOT EXISTS idx_transactions_entities ON transactions(tenant_id, related_entity_id, date);
