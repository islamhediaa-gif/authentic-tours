
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixSchema() {
    console.log("Adding missing columns to transactions table...");
    
    // إضافة الأعمدة الناقصة التي قد تؤثر على الحسابات
    const { error: err1 } = await supabase.rpc('exec_sql', { 
        sql_query: `
            ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_sale_only BOOLEAN DEFAULT FALSE;
            ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_purchase_only BOOLEAN DEFAULT FALSE;
            ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pnr VARCHAR(50);
        ` 
    });

    if (err1) {
        // إذا لم تكن وظيفة rpc موجودة، سنحاول عبر الاستعلام المباشر (قد يفشل حسب الصلاحيات)
        console.error("Error adding columns via RPC:", err1.message);
    } else {
        console.log("Columns added successfully.");
    }
}

// ملاحظة: هذا السكريبت للتوضيح، سأقوم بالتعديل في الكود لضمان معالجة الحقول بشكل آمن
